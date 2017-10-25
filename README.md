EASYSAX - pure javascript sax-style parser for xml
==================================================
Простой и быстрый SAX парсер XML файлов.
Реализован по принципу парсить только то что нужно и как можно быстрее.
Парсер не потоковый, и не расчитан на гиганские файлы. Весь XML должен быть в памяти.
Встроенный уникальный механизм работы с пространсвами имен.


Парсер был написан для RSS ридера http://zzreader.com
На конец 2012 года остается самым быстрым SAX парсером под NODE.JS



BENCHMARK 
---------------------------------------------------
https://github.com/vflash/sax-benchmark


**sh: node bench-01.js**
```
count - 100000
size - 25

saxjs : 346.182ms
libxml: 852.098ms
expat : 705.867ms
expat buffer: 712.212ms
ltx: 137.998ms
easysax ns=on uq=on attr=on   : 100.050ms
easysax ns=off uq=on attr=on  : 82.520ms
easysax ns=off uq=off attr=on : 69.133ms
easysax ns=off uq=off attr=off: 29.226ms
```

**sh: node bench-02.js**
```
count - 1000
size - 22750

saxjs : 1484.910ms
libxml: 1058.808ms
expat : 1028.151ms
expat buffer: 853.925ms
ltx: 359.173ms
easysax ns=on uq=on attr=on   : 151.511ms
easysax ns=off uq=on attr=on  : 114.646ms
easysax ns=off uq=off attr=on : 88.604ms
easysax ns=off uq=off attr=off: 80.773ms
```

**sh: node bench-03.js**
```
count - 1000
size - 121786

saxjs : 10765.309ms
libxml: 5387.832ms
expat : 6734.018ms
expat buffer: 5865.209ms
ltx: 2953.910ms
easysax ns=on uq=on attr=on   : 1769.676ms
easysax ns=off uq=on attr=on  : 1475.585ms
easysax ns=off uq=off attr=on : 1214.665ms
easysax ns=off uq=off attr=off: 405.799ms
```





Пример использования
---------------------------------------------------
```js
var parser = new EasySax();

// если требуется пространство имен
parser.ns('rss', {
	'http://www.w3.org/2005/Atom': 'atom',
	'http://www.w3.org/1999/xhtml': 'xhtml',

	'http://search.yahoo.com/mrss/': 'media',
	'http://purl.org/rss/1.0/': 'rss',
	'http://purl.org/dc/elements/1.1/': 'dc',
	'http://www.w3.org/1999/02/22-rdf-syntax-ns#' : 'rdf',
	'http://purl.org/rss/1.0/modules/content/': 'content',
	'http://www.yandex.ru': 'yandex',
	'http://news.yandex.ru': 'yandex',
	'http://backend.userland.com/rss2': 'rss'

});


parser.on('error', function(msg) {
	// console.log('error - ' + msg);
});


parser.on('startNode', function(elem, attr, uq, str, tagend) {
	// elem -- (string) название элемента. при указании пространства имен, то автоматически подставляется префикс
	// attr() -- (function) парсит атрибуты и возврашает обьект. 
	// uq() -- (function) встроенный xml декодер.  пример: uq(&lt;a&gt;)
	// str -- (string) нераспарсенная строка элемента. пример: <item title="text" id="x345">
	// tagend -- (boolean) флаг что элемент пустой
	
});

parser.on('endNode', function(elem, uq, str, tagstart) {
	// ...
});

parser.on('textNode', function(text, uq) {
	// text -- (String) строковой элемент. пример: uq(text);
});

parser.on('cdata', function(text) {
	// text -- (String) строковой элемент CDATA
});


parser.on('comment', function(text) {
	// text - (String) текст комментария
});


//parser.on('question', function() {}); // <? ... ?>
//parser.on('attention', function() {}); // <!XXXXX zzzz="eeee">


// parser.parse(arg1, arg2)
// первый аргумент -- (String) строка xml
// второй аргумент -- пространство имен по умолчанию

parser.parse(xml, 'rss')

```


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

**benchmark/test.js, parse file #1**
```
sax-js: 12671ms
libxmljs: 11311ms
expat: 6118ms
expat buffer: 5278ms
easysax : 1739ms  //  namespace--on, attr()--on , entity_decode--on
easysax: 1035ms   //  namespace--off, attr()--on , entity_decode--on
easysax: 740ms    //  namespace--off, attr()--off , entity_decode--off
```


**benchmark/test.js, parse file #2 (много атрибутов)**
```
sax-js: 84060ms
libxmljs: 48919ms
expat: 39444ms
expat buffer: 35375ms
easysax: 14655ms  //  namespace--on, attr()--on , entity_decode--on
easysax: 9874ms   //  namespace--off, attr()--on , entity_decode--on
easysax: 3531ms   //  namespace--off, attr()--off , entity_decode--on
easysax: 2954ms   //  namespace--off, attr()--off , entity_decode--off
```


**demo/example.js, parse file #2**
```
1,000 pages for: 13335ms -  attr()--all
1,000 pages for: 7300ms  -  attr()--on_request
```


##Пример использования##
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


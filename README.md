EASYSAX - pure javascript sax-style parser for xml
==================================================

Simple and fast SAX XML parser.

- **Incremental processing**: EasySAX supports incremental data processing. This allows parsing files several gigabytes in size with minimal RAM consumption, passing data to the parser as it is read.
- **Namespaces**: Supports namespace normalization.
- **Fast**: High-performance streaming engine.

The parser was written for the RSS reader http://zzreader.com (not working)
Remains the fastest SAX XML parser for JS by 2026

Install
---------------------------------------------------
```
$ npm install easysax
```

Benchmark
---------------------------------------------------

**sh: bun benchmark/stream.js**
```
file: mock                                                              elems    text
------------------------------------------------------------------------------------------
only load                      - total: 169.28   time: 2.51     500 MB

easysax ns=on  uq=on  attr=on  - total: 3109.29  time: 2670.36  500 MB 7505704  5003804
easysax ns=off uq=on  attr=on  - total: 2482.34  time: 2100.68  500 MB 7505704  5003804
easysax ns=off uq=off attr=on  - total: 1369.77  time: 1066.33  500 MB 7505704  5003804
easysax ns=off uq=off attr=off - total: 1237.50  time: 887.20   500 MB 7505704  5003804

eksml          uq=off attr=on  - total: 1557.89  time: 1259.11  500 MB 7505704  2501901
saxes          uq=on  attr=on  - total: 7909.32  time: 7439.90  500 MB 7505704  5003804
ltx            uq=on  attr=on  - total: 14608.25 time: 14167.45 500 MB 7505704  5003803
------------------------------------------------------------------------------------------
```

**sh: bun benchmark/stream.js -file AS_HOUSES_PARAMS.XML**
```
file: ./AS_HOUSES_PARAMS.XML
------------------------------------------------------------------------------------------
only load                      - total: 29979.80 time: 29.69    4.74 GB

easysax ns=on  uq=on  attr=on  - total: 53994.98 time: 21257.70 4.74 GB 27997407 1
easysax ns=off uq=on  attr=on  - total: 50518.53 time: 17841.35 4.74 GB 27997407 1
easysax ns=off uq=off attr=on  - total: 47360.99 time: 14886.36 4.74 GB 27997407 1
easysax ns=off uq=off attr=off - total: 42390.00 time: 10174.52 4.74 GB 27997407 1

eksml          uq=off attr=on  - total: 58463.19 time: 25675.42 4.74 GB 27997407 1
ltx            uq=on  attr=on  - total: 89953.37 time: 56807.52 4.74 GB 27997407 1
saxes          uq=on  attr=on  - total: 123178.7 time: 89020.67 4.74 GB 27997407 0
------------------------------------------------------------------------------------------
```


**sh: node benchmark/bench-01.js**
```
count - 100000
size - 34
----------------------------------------------
easysax    ns=on  uq=on  attr=on  : 124.97  ms
easysax    ns=off uq=on  attr=on  : 71.09   ms
easysax    ns=off uq=off attr=on  : 67.30   ms
easysax    ns=off uq=off attr=off : 52.92   ms

eksml             uq=off attr=on  : 111.99  ms
saxen      ns=off uq=on  attr=on  : 94.97   ms
saxophone         uq=off attr=on  : 69.96   ms
ltx               uq=on  attr=on  : 88.91   ms
saxes             uq=on  attr=on  : 174.89  ms
saxjs             uq=on  attr=on  : 245.46  ms
libxml                            : 1184.2  ms
expat                             : 1102.1  ms
saxwasm~481                       : 513.93  ms
tuananh           uq=off attr=on  : 2778.8  ms
----------------------------------------------
```

**sh: node bench-02.js**
```
count - 1000
size - 22736
----------------------------------------------
easysax    ns=on  uq=on  attr=on  : 104.48  ms
easysax    ns=off uq=on  attr=on  : 75.82   ms
easysax    ns=off uq=off attr=on  : 54.09   ms
easysax    ns=off uq=off attr=off : 45.54   ms

eksml             uq=off attr=on  : 68.54   ms
saxen      ns=off uq=on  attr=on  : 67.67   ms
saxophone         uq=off attr=on  : 83.87   ms
ltx               uq=on  attr=on  : 130.20  ms
saxes             uq=on  attr=on  : 157.29  ms
saxjs             uq=on  attr=on  : 576.21  ms
libxml                            : 1362.6  ms
expat                             : 1174.6  ms
saxwasm~481                       : 436.54  ms
tuananh           uq=off attr=on  : 451.34  ms
----------------------------------------------
```

**sh: node bench-03.js**
```
count - 1000
size - 121786
----------------------------------------------
easysax    ns=on  uq=on  attr=on  : 691.52  ms
easysax    ns=off uq=on  attr=on  : 489.07  ms
easysax    ns=off uq=off attr=on  : 389.16  ms
easysax    ns=off uq=off attr=off : 319.11  ms

eksml             uq=off attr=on  : 420.79  ms
saxen      ns=off uq=on  attr=on  : 837.77  ms
saxophone         uq=off attr=on  : 681.66  ms
ltx               uq=on  attr=on  : 920.86  ms
saxes             uq=on  attr=on  : 1155.2  ms
saxjs             uq=on  attr=on  : 4305.0  ms
libxml                            : 7069.5  ms
expat                             : 7421.8  ms
saxwasm~481                       : 3548.3  ms
tuananh           uq=off attr=on  : 1993.5  ms
----------------------------------------------
```



Example of use
---------------------------------------------------
```js
var parser = new EasySax();

// if namespace is required
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

parser.on('startNode', function(elementName, getAttr, isTagEnd, getStringNode) {
	// elementName -- (string) element name. If namespaces are enabled, it automatically sets the prefix
	// getAttr() -- (function) parse attributes and return an object
	// isTagEnd -- (boolean) flag that the element is empty "<elem/>"
	// getStringNode() -- (function) returns the unparsed string of the element. example: <item title="text" id="x345">
});

parser.on('endNode', function(elementName, isTagStart, getStringNode) {
	// isTagStart -- (boolean) flag that the element is empty "<elem/>"
});

parser.on('textNode', function(text) {
	// text -- (String) line of text
});

parser.on('cdata', function(text) {
    // text -- (String) CDATA element text string
});

parser.on('comment', function(text) {
	// text - (String) comment text
});

//parser.on('question', function() {}); // <? ... ?>
//parser.on('attention', function() {}); // <!XXXXX zzzz="eeee">


parser.write(stringChunk);
parser.write(stringChunk);
...
parser.end(stringChunk);


```


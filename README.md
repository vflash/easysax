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

**sh: node benchmark/stream.js**
```
file: mock                                                              elems    text
------------------------------------------------------------------------------------------
only load                      - total: 91.13    time: 0.35     500 MB
easysax ns=on  uq=on  attr=on  - total: 2238.40  time: 2151.18  500 MB 6254753  6254754
easysax ns=off uq=on  attr=on  - total: 1840.96  time: 1755.02  500 MB 6254753  6254754
easysax ns=off uq=off attr=on  - total: 1711.58  time: 1625.02  500 MB 6254753  6254754
easysax ns=off uq=off attr=off - total: 1383.35  time: 1296.81  500 MB 6254753  6254754
ltx                            - total: 2563.93  time: 2477.30  500 MB 6254753  6254753
```

**sh: node benchmark/stream.js -file AS_HOUSES_PARAMS.XML**
```
file: ./AS_HOUSES_PARAMS.XML                                            elems    text
------------------------------------------------------------------------------------------
only load                      - total: 3777.53  time: 5.34     4.74 GB
easysax ns=on  uq=on  attr=on  - total: 44596.10 time: 40821.88 4.74 GB 27997407 1
easysax ns=off uq=on  attr=on  - total: 39105.67 time: 35382.78 4.74 GB 27997407 1
easysax ns=off uq=off attr=on  - total: 36759.76 time: 32966.74 4.74 GB 27997407 1
easysax ns=off uq=off attr=off - total: 20291.19 time: 16555.40 4.74 GB 27997407 1
ltx                            - total: 57810.57 time: 54235.45 4.74 GB 27997407 1
```


https://github.com/vflash/sax-benchmark

**sh: node bench-01.js**
```
count - 100000
size - 25

easysax ns=on  entityDecode=on  getAttr=on : 100.050ms
easysax ns=off entityDecode=on  getAttr=on : 82.520ms
easysax ns=off entityDecode=off getAttr=on : 69.133ms
easysax ns=off entityDecode=off getAttr=off: 29.226ms
saxjs : 346.182ms
libxml: 852.098ms
expat : 705.867ms
expat buffer: 712.212ms
ltx: 137.998ms
```

**sh: node bench-02.js**
```
count - 1000
size - 22750

easysax ns=on  entityDecode=on  getAttr=on : 151.511ms
easysax ns=off entityDecode=on  getAttr=on : 114.646ms
easysax ns=off entityDecode=off getAttr=on : 88.604ms
easysax ns=off entityDecode=off getAttr=off: 80.773ms
saxjs : 1484.910ms
libxml: 1058.808ms
expat : 1028.151ms
expat buffer: 853.925ms
ltx: 359.173ms
```

**sh: node bench-03.js**
```
count - 1000
size - 121786

easysax ns=on  entityDecode=on  getAttr=on : 1769.676ms
easysax ns=off entityDecode=on  getAttr=on : 1475.585ms
easysax ns=off entityDecode=off getAttr=on : 1214.665ms
easysax ns=off entityDecode=off getAttr=off: 405.799ms
saxjs : 10765.309ms
libxml: 5387.832ms
expat : 6734.018ms
expat buffer: 5865.209ms
ltx: 2953.910ms
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


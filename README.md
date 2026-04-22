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


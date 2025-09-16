var bench = require('./bench.js');
var xml = '<foo bar="baz">quux<dd>ddd</dd><e xmlns="http://www.w3.org/2005/Atom">xxx<x>++++</x></e><dd>aaaa</dd></foo>';


bench(xml, 100000);


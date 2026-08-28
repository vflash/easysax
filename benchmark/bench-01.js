var bench = require('./bench.js');
var xml = '<foo bar="baz">hello<world/></foo>';

bench(xml, 100000);


var bench = require('./bench.js');
function gen() {var z, xml = '<persons>\n';for (z=1800000; z--;) xml += '<person>\n       <name>John</name>\n       <!-- other nodes -->\n   </person>\n   <!-- 21466 person nodes -->\n';return xml + '</persons>';};

bench(gen(), 1);


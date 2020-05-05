var test = require('./easysax.test.js');

// // default ns:
// // {
// //     'http://search.yahoo.com/mrss/': 'media',
// //     'http://www.w3.org/1999/xhtml': 'xhtml',
// //     'http://www.w3.org/2005/Atom': 'atom',
// //     'http://purl.org/rss/1.0/': 'rss',
// // }


test({
    xml: '<root title="abc>abc"></root>',
    to: [
        ['startNode', 'root', {title: 'abc>abc'}, false],
        ['endNode', 'root', false],
    ],
});

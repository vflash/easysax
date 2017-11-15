var test = require('./easysax.test.js');

// // default ns:
// // {
// //     'http://search.yahoo.com/mrss/': 'media',
// //     'http://www.w3.org/1999/xhtml': 'xhtml',
// //     'http://www.w3.org/2005/Atom': 'atom',
// //     'http://purl.org/rss/1.0/': 'rss',
// // }




test({
    xml: '<div/>',
    to: [
        ['startNode', 'div', true, true],
        ['endNode', 'div', true],
    ],
});

test({
    xml: '<a><b/></a>',
    to: [
        ['startNode', 'a', true, false],
        ['startNode', 'b', true, true],
        ['endNode', 'b', true],
        ['endNode', 'a', false],
    ],
});

test({
    xml: '<a><b></c></b></a>',
    to: [
        ['startNode', 'a', true, false],
        ['startNode', 'b', true, false],
        ['error'],
    ],
});

test({
    xml: '</a>',
    to: [
        ['error'],
    ],
});

test({
    xml: '<_a><:b></:b></_a>',
    to: [
        ['startNode', '_a', true, false],
        ['startNode', ':b', true, false],
        ['endNode', ':b', false],
        ['endNode', '_a', false],
    ],
});

test({
    xml: '<a><!--comment text--></a>',
    to: [
        ['startNode', 'a', true, false],
        ['comment', 'comment text'],
        ['endNode', 'a', false],
    ],
});

test({
    xml: '<root>',
    to: [
        ['startNode', 'root'],
        ['error'],
    ],
});

test({
    xml: '<root/>',
    to: [
        ['startNode', 'root', true, true],
        ['endNode', 'root', true],
    ],
});

test({
    xml: '<root/><f',
    to: [
        ['startNode', 'root', true, true],
        ['endNode', 'root', true],
        ['error'],
    ],
});

test({
    xml: '<root>text</root>',
    to: [
        ['startNode', 'root'],
        ['textNode', 'text'],
        ['endNode', 'root'],
    ],
});

test({
    xml: '<root></root>',
    to: [
        ['startNode', 'root', true, false, '<root>'],
        ['endNode', 'root', false, '</root>'],
    ],
});

test({
    xml: '<root length="abc=abc"></root>',
    to: [
        ['startNode', 'root', {length: 'abc=abc'}, false],
        ['endNode', 'root', false],
    ],
});

test({
    xml: '<root length=\'abc=abc\'></root>',
    to: [
        ['startNode', 'root', {length: 'abc=abc'}, false],
        ['endNode', 'root', false],
    ],
});

test({
    xml: '<root _abc="abc=abc" :abc="abc"></root>',
    to: [
        ['startNode', 'root', {_abc: 'abc=abc', ':abc': 'abc'}, false],
        ['endNode', 'root', false],
    ],
});


test({
    xml: '<root attr1="first"\t attr2="second"/>',
    to: [
        ['startNode', 'root', {attr1: 'first', attr2: 'second'}, true],
        ['endNode', 'root', true],
    ],
});

test({
    xml: '<root length=\'12345\'><item/></root>',
    to: [
        ['startNode', 'root', {length: '12345'}, false],
        ['startNode', 'item', true, true],
        ['endNode', 'item', true],
        ['endNode', 'root', false]
    ],
});

test({
    xml: '<r><![CDATA[ this is ]]><![CDATA[ this is ]]></r>',
    to: [
        ['startNode', 'r'],
        ['cdata', ' this is '],
        ['cdata', ' this is '],
        ['endNode', 'r'],
    ],
});

test({
    xml: '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>',
    to: [
        ['startNode', 'r'],
        ['cdata', '[[[[[[[[]]]]]]]]'],
        ['endNode', 'r'],
    ],
});



test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" id="aa" media:title="bb"/>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed', {id: 'aa', 'media:title': 'bb'}],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" id="aa" media:title="bb"></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed', {id: 'aa', 'media:title': 'bb'}],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:m="http://search.yahoo.com/mrss/" id="aa" m:title="bb"/>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed', {id: 'aa', 'media:title': 'bb'}],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:a="http://www.w3.org/2005/Atom" id="aa" a:title="bb"/>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed', {id: 'aa', 'title': 'bb'}],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><media:title>text</media:title></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['startNode', 'media:title'],
        ['textNode', 'text'],
        ['endNode', 'media:title'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom"><aa xmlns="http://search.yahoo.com/mrss/"><bb/></aa></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['startNode', 'media:aa'],
        ['startNode', 'media:bb'],
        ['endNode', 'media:bb'],
        ['endNode', 'media:aa'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:m="http://search.yahoo.com/mrss/"><m:title>text</m:title></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['startNode', 'media:title'],
        ['textNode', 'text'],
        ['endNode', 'media:title'],
        ['endNode', 'atom:feed'],
    ],
});


test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:a="http://www.w3.org/2005/Atom"><a:title>text</a:title></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['startNode', 'atom:title'],
        ['textNode', 'text'],
        ['endNode', 'atom:title'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:="http://search.yahoo.com/mrss/" id="aa" :title="bb"><:text/></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed', {id: 'aa', 'media:title': 'bb'}],
        ['startNode', 'media:text'],
        ['endNode', 'media:text'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom"><title xmlns="http://search.yahoo.com/mrss/"/><text>text</text></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['startNode', 'media:title'],
        ['endNode', 'media:title'],
        ['startNode', 'atom:text'],
        ['textNode', 'text'],
        ['endNode', 'atom:text'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:xxx="xxx.xx"><xxx:title>text</xxx:title></feed>',
    ns: 'atom',
    to: [
        ['unknownNS', 'xxx.xx'],
        ['startNode', 'atom:feed'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom"><title xmlns="xxx.xx">text</title></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['unknownNS', 'xxx.xx'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:xxx="AAA" xxx:id="22"><xxx:title id="22">text</xxx:title></feed>',
    ns: 'atom',
    to: [
        ['unknownNS'],
        ['startNode', 'atom:feed', {'aaa:id': '22'}],
        ['startNode', 'aaa:title', {id: '22', }],
        ['textNode', 'text'],
        ['endNode', 'aaa:title'],
        ['endNode', 'atom:feed'],
    ],
});

test({
    xml: '<feed xmlns="http://www.w3.org/2005/Atom"><title xmlns="AAA">text</title></feed>',
    ns: 'atom',
    to: [
        ['startNode', 'atom:feed'],
        ['unknownNS'],
        ['startNode', 'aaa:title'],
        ['textNode', 'text'],
        ['endNode', 'aaa:title'],
        ['endNode', 'atom:feed'],
    ],
});

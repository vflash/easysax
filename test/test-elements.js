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
        ['startNode', 'div', true /*attrs*/, true],
        ['endNode', 'div', true],
    ],
});

test({
    xml: '<div />',
    to: [
        ['startNode', 'div', true /*attrs*/, true],
        ['endNode', 'div', true],
    ],
});


test({
    xml: '<dateTime.iso8601 />',
    to: [
        ['startNode', 'dateTime.iso8601', true, true],
        ['endNode', 'dateTime.iso8601', true],
    ],
});

test({
    xml: '<a></a>',
    to: [
        ['startNode', 'a', true, false],
        ['endNode', 'a', false],
    ],
});

test({
    xml: '<a></a \u000F>',
    to: [
        ['startNode', 'a', true, false],
        ['error'],
    ],
});

test({
    xml: '<A\u000Ctitle="xx"></A>',
    to: [
        ['startNode', 'A', {title: 'xx'}, false],
        ['endNode', 'A', false],
    ],
});

test({
    xml: '01234567890qwertyuiopasdfghjkl',
    to: [
        ['error'],
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
    xml: '<root title="abc=abc"></root>',
    to: [
        ['startNode', 'root', {title: 'abc=abc'}, false],
        ['endNode', 'root', false],
    ],
});

test({
    xml: '<root title="abc>abc"></root>',
    to: [
        ['startNode', 'root', {title: 'abc>abc'}, false],
        ['endNode', 'root', false],
    ],
});

test({
    xml: '<root title=\'abc=abc\'></root>',
    to: [
        ['startNode', 'root', {title: 'abc=abc'}, false],
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
    xml: '<!XXXXX zzzz="eeee"><xml/>',
    to: [
        ['attention', '<!XXXXX zzzz="eeee">'],
        ['startNode', 'xml', true, true],
        ['endNode', 'xml', true],
    ],
});


test({
    xml: '<? QUESTION ?><xml/>',
    to: [
        ['question', '<? QUESTION ?>'],
        ['startNode', 'xml', true, true],
        ['endNode', 'xml', true],
    ],
});

test({
    xml: '<? QUESTION',
    to: [
        ['error'],
    ],
});



// // processing instruction + whitespace outside of root node
// test({
//     xml: '<?xml version="1.0" encoding="UTF-8"?>\n\t <root/>\n',
//     to: [
//         ['question', '<?xml version="1.0" encoding="UTF-8"?>'],
//         ['startNode', 'root'],
//         ['endNode', 'root']
//     ],
// });
//
// // processing instruction + non-whitespace outside of root node
// test({
//     xml: '<?xml version="1.0" encoding="UTF-8"?>  blablabla  <root/>\n',
//     expect: [
//         ['question', '<?xml version="1.0" encoding="UTF-8"?>'],
//         ['warn', 'non-whitespace outside of root node'], // ?? is error xml
//         ['startNode', 'root'],
//         ['endNode', 'root']
//     ],
// });


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

test({
    xml: [
        '<',
        'abcdefghijklmn',
        'opqrstuvwxyzABC',
        'DEFGHIJKLMNOPQR',
        'STUVWXYZ>',
        'yo y',
        'o<',
        '/abcdefghijklm',
        'nopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ>',
    ],
    to: [
        ['startNode', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
        ['textNode', 'yo yo'],
        ['endNode', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
    ],
});

test({
    autoEntity: true,
    xml: '<a>&lt;--&gt;</a>',
    to: [
        ['startNode', 'a', true, false],
        ['textNode', '<-->'],
        ['endNode', 'a', false],
    ],
});

test({
    autoEntity: true,
    xml: '<a title="&lt;--&gt;"></a>',
    to: [
        ['startNode', 'a', {title: '<-->'}, false],
        ['endNode', 'a', false],
    ],
});

// ============================================================

// ========== 1. EDGE CASES: ПУСТОЙ XML / WHITESPACE ==========
test({
    xml: '',
    to: [],
});

test({
    xml: '   \n\t  ',
    to: [],
});

0&&test({
    xml: '<?xml version="1.0"?>\n<<root/>',
    to: [
        ['question', '<?xml version="1.0"?>'],
        ['startNode', 'root', true, true],
        ['endNode', 'root', true],
    ],
});

// ========== 2. СПЕЦИАЛЬНЫЕ СИМВОЛЫ В ИМЕНАХ ТЕГОВ ==========
test({
    xml: '<a-b_c.d/>',
    to: [
        ['startNode', 'a-b_c.d', true, true],
        ['endNode', 'a-b_c.d', true],
    ],
});

test({
    xml: '<xml:lang>value</xml:lang>',
    to: [
        ['startNode', 'xml:lang', true, false],
        ['textNode', 'value'],
        ['endNode', 'xml:lang', false],
    ],
});

// ========== 3. АТРИБУТЫ: КРАЙНИЕ СЛУЧАИ ==========
test({
    xml: '<a attr="" />',
    to: [
        ['startNode', 'a', {attr: ''}, true],
        ['endNode', 'a', true],
    ],
});

test({
    xml: '<a attr="  spaces  " />',
    to: [
        ['startNode', 'a', {attr: '  spaces  '}, true],
        ['endNode', 'a', true],
    ],
});

test({
    xml: '<a a1="1" a2="2" a3="3" a4="4" a5="5" />',
    to: [
        ['startNode', 'a', {a1: '1', a2: '2', a3: '3', a4: '4', a5: '5'}, true],
        ['endNode', 'a', true],
    ],
});


// ========== 4. ENTITY DECODE: ВСЕ ПРЕДОПРЕДЕЛЁННЫЕ ==========
test({
    autoEntity: true,
    xml: '<a>&amp;&lt;&gt;&quot;&apos;</a>',
    to: [
        ['startNode', 'a', true, false],
        ['textNode', '&<>"\''],
        ['endNode', 'a', false],
    ],
});

test({
    autoEntity: true,
    xml: '<a title="&amp;&lt;&gt;&quot;&apos;"/>',
    to: [
        ['startNode', 'a', {title: '&<>"\''}, true],
        ['endNode', 'a', true],
    ],
});

// Числовые entities
test({
    autoEntity: true,
    xml: '<a>&#65;&#66;&#67;</a>',
    to: [
        ['startNode', 'a', true, false],
        ['textNode', 'ABC'],
        ['endNode', 'a', false],
    ],
});

test({
    autoEntity: true,
    xml: '<a>&#x41;&#x42;&#x43;</a>',
    to: [
        ['startNode', 'a', true, false],
        ['textNode', 'ABC'],
        ['endNode', 'a', false],
    ],
});

// ========== 5. CDATA: КРАЙНИЕ СЛУЧАИ ==========
test({
    xml: '<r><![CDATA[]]></r>',
    to: [
        ['startNode', 'r', true, false],
        ['cdata', ''],
        ['endNode', 'r', false],
    ],
});

test({
    xml: '<r><![CDATA[ ]]><![CDATA[ ]]></r>',
    to: [
        ['startNode', 'r', true, false],
        ['cdata', ' '],
        ['cdata', ' '],
        ['endNode', 'r', false],
    ],
});

// ========== 6. КОММЕНТАРИИ: КРАЙНИЕ СЛУЧАИ ==========
test({
    xml: '<r><!-- --></r>',
    to: [
        ['startNode', 'r', true, false],
        ['comment', ' '],
        ['endNode', 'r', false],
    ],
});

test({
    xml: '<r><!-- a -- b --></r>',
    to: [
        ['startNode', 'r', true, false],
        ['comment', ' a -- b '],
        ['endNode', 'r', false],
    ],
});

// ========== 7. ВЛОЖЕННОСТЬ / ГЛУБИНА ==========
test({
    xml: '<a><b><c><d><e>text</e></d></c></b></a>',
    to: [
        ['startNode', 'a', true, false],
        ['startNode', 'b', true, false],
        ['startNode', 'c', true, false],
        ['startNode', 'd', true, false],
        ['startNode', 'e', true, false],
        ['textNode', 'text'],
        ['endNode', 'e', false],
        ['endNode', 'd', false],
        ['endNode', 'c', false],
        ['endNode', 'b', false],
        ['endNode', 'a', false],
    ],
});

// ========== 8. НЕСКОЛЬКО КОРНЕВЫХ ЭЛЕМЕНТОВ ==========
test({
    xml: '<a/><b/>',
    to: [
        ['startNode', 'a', true, true],
        ['endNode', 'a', true],
        ['startNode', 'b', true, true],
        ['endNode', 'b', true],
    ],
});

// ========== 9. MIXED CONTENT ==========
test({
    xml: '<p>text <b>bold</b> more text</p>',
    to: [
        ['startNode', 'p', true, false],
        ['textNode', 'text '],
        ['startNode', 'b', true, false],
        ['textNode', 'bold'],
        ['endNode', 'b', false],
        ['textNode', ' more text'],
        ['endNode', 'p', false],
    ],
});

// ========== 10. ИНКРЕМЕНТАЛЬНЫЙ ПАРСИНГ: КРАЙНИЕ СЛУЧАИ ==========
test({
    xml: ['<ro', 'ot>te', 'xt</', 'root>'],
    to: [
        ['startNode', 'root', true, false],
        ['textNode', 'text'],
        ['endNode', 'root', false],
    ],
});

test({
    xml: ['<', 'a', ' ', 't', 'i', 't', 'l', 'e', '=', '"', 'x', '"', '>', 'y', '<', '/', 'a', '>'],
    to: [
        ['startNode', 'a', {title: 'x'}, false],
        ['textNode', 'y'],
        ['endNode', 'a', false],
    ],
});

// ========== 11. NAMESPACES: СКОПИРОВАНИЕ И ВОССТАНОВЛЕНИЕ ==========
test({
    xml: '<root xmlns:a="http://purl.org/rss/1.0/" xmlns:b="http://search.yahoo.com/mrss/"><a:item/><b:item/></root>',
    ns: 'rss',
    to: [
        ['startNode', 'rss:root', true, false],
        ['startNode', 'rss:item', true, true],
        ['endNode', 'rss:item', true],
        ['startNode', 'media:item', true, true],
        ['endNode', 'media:item', true],
        ['endNode', 'rss:root', false],
    ],
});

// ========== 12. ОШИБКИ: БОЛЬШЕ СЦЕНАРИЕВ ==========
// Закрывающий тег без открывающего
test({
    xml: '</root>',
    to: [
        ['error'],
    ],
});

// Несоответствие регистра (XML case-sensitive)
test({
    xml: '<Root></root>',
    to: [
        ['startNode', 'Root', true, false],
        ['error'],
    ],
});

// Невалидный первый символ имени тега (цифра)
test({
    xml: '<1a/>',
    to: [
        ['error'],
    ],
});

// ========== 13. getStringNode() ДЛЯ РАЗНЫХ ТИПОВ ==========
test({
    xml: '<root attr="val">text</root>',
    to: [
        ['startNode', 'root', {attr: 'val'}, false, '<root attr="val">'],
        ['textNode', 'text'],
        ['endNode', 'root', false, '</root>'],
    ],
});

test({
    xml: '<root attr="val"/>',
    to: [
        ['startNode', 'root', {attr: 'val'}, true, '<root attr="val"/>'],
        ['endNode', 'root', true, '<root attr="val"/>'],
    ],
});

// ========== 14. ОЧЕНЬ ДЛИННЫЕ ЗНАЧЕНИЯ ==========
test({
    xml: '<a title="' + 'x'.repeat(1000) + '"/>',
    to: [
        ['startNode', 'a', {title: 'x'.repeat(1000)}, true],
        ['endNode', 'a', true],
    ],
});

// ========== 15. UNICODE В ТЕКСТЕ ==========
test({
    xml: '<r>日本語 🎉 émojis</r>',
    to: [
        ['startNode', 'r', true, false],
        ['textNode', '日本語 🎉 émojis'],
        ['endNode', 'r', false],
    ],
});


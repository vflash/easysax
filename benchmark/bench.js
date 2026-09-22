module.exports = banch;

var EasySax = require("../easysax.js");
var isBun = !!(typeof process !== 'undefined' && process.versions && process.versions.bun);
var count;
var only;
var xml;


async function banch(_xml, _count, _only) {

    //var only = /^easysax ns=off uq=on attr=on/;
    //var count = 1;

    count = _count;
    only = _only;


    if (!count) {
        count = 1000;
    };


    console.log('');
    console.log('count - ' + count);
    console.log('size - ' + _xml.length);
    console.log('----------------------------------------------');



    var list = [
        //test_stringIndexOf,
        /* Due to differences in launch configurations, only the results of the first test with EasySax are reliable */
        test_EasySax_on_on_on,
        test_EasySax_off_on_on,
        test_EasySax_off_off_on,
        test_EasySax_off_off_off,

        ' ',
        test_eksml,
        test_saxen,
        test_saxophone,
        test_ltx,
        test_saxes,
        test_sax,
        test_libxmljs,
        test_nodeExpat_string,
        // test_nodeExpat_Buffer,
        test_saxwasm,
        test_tuananhSax,
    ];


    var countNode = 0;
    var countText = 0;
    var onNode;
    var onText;
    var fn;
    while(fn = list.shift()) {
        await pause(50);


        if (typeof fn === 'string') {
            console.log(fn);
        } else {
            await fn(_xml, onNode, onText);
        };
    };

    console.log('----------------------------------------------');

};

function nullfunc() {};
function pause(ms) {new Promise(resolve => setTimeout(resolve, ms))};
function ss(value, len) {return (value + '                                           ').slice(0, len)};

async function test(name, go) {
    var countNode = 0;
    var countText = 0;
    var onNode = function(tag, attrs) {countNode += 1};
    var onText = function(text) {countText += 1};

    var x = Date.now()
    for(var z = count > 50 ? count : 1; z--;) {
        go(onNode, onText);
        if (Date.now() - x > 1000) break;
    };

    await pause(100);

    var tA = performance.now()
    for (var z = count; z--;) {
        countNode = 0;
        countText = 0;
        go(onNode, onText);
    };
    var tB = performance.now()
    let tx = x => ss(x.toFixed(x < 1000 ? 2 : 1), 7);

    console.log(name + ' : ' + tx(tB - tA) + ' ms' + (countNode || countText ? '  -  ' + countNode + '  ' + countText : ''));
};


function test_charCodeAt(xml) {
    test('charCodeAt', function() {
        var l = xml.length, x;
        var m = [];
        var j = 0;
        var w;

        for (; j < l; j++) {
            if (xml.charCodeAt(j) === 60) {
                m.push(j)
            };
        };
    });
};

function test_stringIndexOf(xml) {
    test('stringIndexOf                    ', function() {
        var j = 0;
        var z = true;
        var m = [];

        while(true) {
            j = xml.indexOf('<', j);
            if (j === -1) break;
            m.push(j);
            j = xml.indexOf('>', j);
            if (j === -1) break;
            m.push(j);
        };
    });
};

function test_Buffer(xml) {
    var buff = new Buffer(xml)

    test('Buffer2String', function() {
        buff.toString();
    });
};

function test_sax(xml) {
    var saxjs = require('sax');


    test('saxjs             uq=on  attr=on ', function(onNode, onText) {
        var parser = saxjs.parser(false);
        parser.onopentag = function(node) {
            onNode(node.name, node.attributes);
        };
        parser.ontext = onText;
        parser.write(xml).close();
    });
};

async function test_saxwasm(xml) {
    var {SaxEventType, SAXParser} = require('sax-wasm');
    var {readFileSync} = require('fs');

    const wasmUrl = require.resolve('sax-wasm/lib/sax-wasm.wasm');
    const saxWasm = readFileSync(wasmUrl);
    const eventsType = SaxEventType.OpenTagStart | SaxEventType.CloseTag | SaxEventType.OpenTag | SaxEventType.Attribute | SaxEventType.Text;
    const parser = new SAXParser(eventsType);
    await parser.prepareWasm(saxWasm);

    async function parseXML(xmlString, onNode, onText) {
        parser.eventHandler = (eventType, data) => {
            // console.log('Событие:', eventType);
            // console.log('  Данные:', data);
            // console.log('---');
            if (eventType === SaxEventType.OpenTag) {
                onNode();
            };
            if (eventType === SaxEventType.Text) {
                onText();
            };
        };

        const buffer = new TextEncoder().encode(xmlString);

        parser.write(buffer);
        parser.end();
    }

    test('saxwasm~' + ss(eventsType, 25), async function(onNode, onText) {
        await parseXML(xml, onNode, onText).catch(err => {
          console.error('Ошибка:', err);
        });
    });
};

function test_libxmljs(xml) {
    if (isBun) {
        return;
    };

    var libxml = require("libxmljs");

    function go() {
        new libxml.SaxParser(function() {}).parseString(xml)
    };

    try {
        test('libxml                           ', go);
    } catch(e) {
        console.log('libxml: error');
    };
};

function test_nodeExpat_string(xml) {
    if (isBun) {
        return;
    };

    var Expat = require('node-expat'), parser;
    function nullfunc() {};

    test('expat                            ', function(onNode, onText) {
        parser = new Expat.Parser('utf-8');

        parser.addListener('startElement', onNode);
        parser.addListener('endElement', nullfunc);
        parser.addListener('text', onText);

        parser.parse(xml, true);
    });
};

function test_nodeExpat_Buffer(xml) {
    if (isBun) {
        return;
    };

    var Expat = require('node-expat');
    var buff = new Buffer(xml), parser;
    function nullfunc() {};

    test('expat buffer', function(onNode, onText) {
        parser = new Expat.Parser('utf-8');
        parser.addListener('startElement', onNode);
        parser.addListener('endElement', nullfunc);
        parser.addListener('text', onText);
        parser.parse(buff, true);
    });
};

function test_saxophone(xml) {
    var Saxophone = require('saxophone'); // bad

    test('saxophone         uq=off attr=on ', function(onNode, onText) {
        var parser = new Saxophone();

        parser.on('tagopen', onNode);
        parser.on('tagclose', nullfunc)
        parser.on('text', onText);

        parser.parse(xml);
    });
};


function test_ltx(xml) {
    var LtxSaxParser = require('ltx/lib/parsers/ltx.js');
    var countNodes = 0;

    test('ltx               uq=on  attr=on ', function(onNode, onText) {
        var parser = new LtxSaxParser();

        parser.on('startElement', onNode)
        parser.on('endElement', nullfunc)
        parser.on('text', onText);

        parser.end(xml);
    });
};

function test_saxes(xml) {
    var {SaxesParser} = require('saxes');

    test('saxes             uq=on  attr=on ', function(onNode, onText) {
        var countNodes = 0;
        var parser = new SaxesParser({xmlns: false});

        parser.on('opentag', onNode)
        parser.on('closetag', function (name) {})
        parser.on('text', onText);

        parser.write(xml);
        parser.close();
    });
};

function test_EasySax_on_on_on(xml) {
    var entityDecode = EasySax.entityDecode
    var countNodes = 0;
    var mapNS = {
        'http://www.w3.org/1999/xhtml': 'xhtml',
        'http://purl.org/rss/1.0/': 'rss',
        'http://www.w3.org/2005/Atom': 'atom',
        'http://search.yahoo.com/mrss/': 'media',
        'http://www.georss.org/georss': 'georss',
        'http://schemas.google.com/g/2005': 'gd',
    };

    test('easysax    ns=on  uq=on  attr=on ', function(onNode, onText) {
        var parser = new EasySax({
            autoEntity: true,
            defaultNS: 'rss',
            lazy: false,
            ns: mapNS,
            on: {
                startNode: onNode,
                endNode: nullfunc,
                text: onText,
            },
        });

        parser.parse(xml);
    });
};

function test_EasySax_off_on_on(xml) {
    test('easysax    ns=off uq=on  attr=on ', function(onNode, onText) {
        var parser = new EasySax({
            autoEntity: true,
            defaultNS: null,
            lazy: false,
            ns: null,
            on: {
                startNode: onNode,
                endNode: nullfunc,
                text: onText,
            },
        });

        parser.parse(xml);
    });

};

function test_EasySax_off_off_on(xml) {
    test('easysax    ns=off uq=off attr=on ', function(onNode, onText) {
        var parser = new EasySax({
            autoEntity: false,
            defaultNS: null,
            lazy: false,
            ns: null,
            on: {
                startNode: onNode,
                endNode: nullfunc,
                text: onText,
            },
        });

        parser.parse(xml);
    });
};

function test_EasySax_off_off_off(xml) {
    test('easysax    ns=off uq=off attr=off', function(onNode, onText) {
        var parser = new EasySax({
            autoEntity: false,
            defaultNS: null,
            lazy: true,
            ns: null,
            on: {
                startNode: onNode,
                endNode: nullfunc,
                text: onText,
            },
        });

        parser.parse(xml);
    });
};


function test_saxen(xml) {
    var saxen = require('saxen');

    test('saxen      ns=off uq=on  attr=on ', function(onNode, onText) {
        var parser = new saxen.Parser();
        parser.on('openTag', function(elementName, attrGetter, decodeEntities) {
            var attrs = attrGetter();
            for (var i in attrs) {
                decodeEntities(attrs[i]);
            };
        });
        parser.on('closeTag', function() {})
        parser.on('text', function() {});
        parser.parse(xml);
    });
};


function test_eksml(xml) {
    var eksmlSaxParser = require('./eksml.js').default;

    test('eksml             uq=off attr=on ', function(onNode, onText) {
        var countNodes = 0;
        var countText = 0;
        const parser = eksmlSaxParser();

        parser.on('openTag', onNode)
        parser.on('closeTag', function (name) {})
        parser.on('text', onText);

        parser.write(xml);
        parser.close();
    });
};


function test_tuananhSax(xml) {
    var SaxParser = require('@tuananh/sax-parser');

    test('tuananh           uq=off attr=on ', function(onNode, onText) {
        const parser = new SaxParser();

        parser.on('startElement', onNode);
        parser.on('endElement', function (name) {});
        parser.on('text', onText);

        parser.parse(xml);
    });
};

module.exports = banch;

var EasySax = require("../easysax.js");
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


    var fn;
    while(fn = list.shift()) {
        await pause(50);

        if (typeof fn === 'string') {
            console.log(fn);
        } else {
            await fn(_xml);
        };
    };

    console.log('----------------------------------------------');

};

function nullfunc() {};
function pause(ms) {new Promise(resolve => setTimeout(resolve, ms))};
function ss(value, len) {return (value + '                                           ').slice(0, len)};

async function test(name, test) {
    if (count > 50) {
        for(var z = 20; z--;) {
            test();
        };
    } else {
        test();
    };

    await pause(50);

    var tA = performance.now()
    for (var z = count; z--;) {
        test();
    };
    var tB = performance.now()
    let tx = x => ss(x.toFixed(x < 1000 ? 2 : 1), 7);

    console.log(name + ' : ' + tx(tB - tA) + ' ms');
};


function test_charCodeAt() {
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
        var j = xml.indexOf('>');
        var m = [];

        for (; j !== -1; j = xml.indexOf('>', j + 1)) {
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
    var parser = saxjs.parser(false);

    test('saxjs             uq=on  attr=on ', function() {
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

    async function parseXML(xmlString) {
        parser.eventHandler = (eventType, data) => {
            // console.log('Событие:', eventType);
            // console.log('  Данные:', data);
            // console.log('---');
        };

        const buffer = new TextEncoder().encode(xmlString);

        parser.write(buffer);
        parser.end();
    }

    test('saxwasm~' + ss(eventsType, 25), async function() {
        await parseXML(xml).catch(err => {
          console.error('Ошибка:', err);
        });
    });
};

function test_libxmljs(xml) {
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
    var Expat = require('node-expat'), parser;
    function nullfunc() {};

    test('expat                            ', function() {
        parser = new Expat.Parser('utf-8');

        parser.addListener('startElement', nullfunc);
        parser.addListener('endElement', nullfunc);
        parser.addListener('text', nullfunc);

        parser.parse(xml, true);
    });
};

function test_nodeExpat_Buffer(xml) {
    var Expat = require('node-expat');
    var buff = new Buffer(xml), parser;
    function nullfunc() {};

    test('expat buffer', function() {
        parser = new Expat.Parser('utf-8');
        parser.addListener('startElement', nullfunc);
        parser.addListener('endElement', nullfunc);
        parser.addListener('text', nullfunc);
        parser.parse(buff, true);
    });
};

function test_saxophone(xml) {
    var Saxophone = require('saxophone'); // bad

    test('saxophone         uq=off attr=on ', function() {
        var parser = new Saxophone();

        parser.on('tagopen', function(tag) {});
        parser.on('tagclose', nullfunc)
        parser.on('text', function(op) {});

        parser.parse(xml);
    });
};


function test_ltx(xml) {
    var LtxSaxParser = require('ltx/lib/parsers/ltx.js');
    var countNodes = 0;

    test('ltx               uq=on  attr=on ', function() {
        var parser = new LtxSaxParser();

        parser.on('startElement', function(name, attrs) {
            countNodes += 1;
        })
        parser.on('endElement', nullfunc)
        parser.on('text', nullfunc);

        parser.end(xml);
    });
};

function test_saxes(xml) {
    var {SaxesParser} = require('saxes');

    test('saxes             uq=on  attr=on ', function() {
        var countNodes = 0;
        var parser = new SaxesParser({xmlns: false});

        parser.on('opentag', function (name, attrs) {countNodes += 1})
        parser.on('closetag', function (name) {})
        parser.on('text', function (text) {});

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

    test('easysax    ns=on  uq=on  attr=on ', function() {
        var parser = new EasySax({
            autoEntity: true,
            defaultNS: 'rss',
            ns: mapNS,
            on: {
                startNode: function(tag, attr) {attr();countNodes += 1},
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });
};

function test_EasySax_off_on_on(xml) {
    var countNodes = 0;

    test('easysax    ns=off uq=on  attr=on ', function() {
        var parser = new EasySax({
            autoEntity: true,
            defaultNS: null,
            ns: null,
            on: {
                startNode: function(tag, attr) {attr();countNodes += 1},
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });

};

function test_EasySax_off_off_on(xml) {
    var countNodes = 0;

    test('easysax    ns=off uq=off attr=on ', function() {
        var parser = new EasySax({
            autoEntity: false,
            defaultNS: null,
            ns: null,
            on: {
                startNode: function(tag, attr) {attr();countNodes += 1},
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });
};

function test_EasySax_off_off_off(xml) {
    var countNodes = 0;

    test('easysax    ns=off uq=off attr=off', function() {
        var parser = new EasySax({
            autoEntity: false,
            defaultNS: null,
            ns: null,
            on: {
                startNode: function() {countNodes += 1},
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });
};


function test_saxen(xml) {
    var saxen = require('saxen');

    test('saxen      ns=off uq=on  attr=on ', function() {
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

    test('eksml             uq=off attr=on ', function() {
        var countNodes = 0;
        var countText = 0;
        const parser = eksmlSaxParser();

        parser.on('openTag', function (name, attrs) {
            countNodes += 1;
        })
        parser.on('closeTag', function (name) {})
        parser.on('text', function (text) {countText += 1;});

        parser.write(xml);
        parser.close();
    });
};


function test_tuananhSax(xml) {
    var SaxParser = require('@tuananh/sax-parser');

    test('tuananh           uq=off attr=on ', function() {
        var countNodes = 0;
        var countText = 0;
        const parser = new SaxParser();

        parser.on('startElement', function (name, attrs) { // attrs no decode entities
            countNodes += 1;
        })
        parser.on('endElement', function (name) {})
        parser.on('text', function (text) {countText += 1;});

        parser.parse(xml);
    });
};

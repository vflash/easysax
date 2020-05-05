module.exports = banch;

var EasySax = require("../easysax.js");
var count;
var only;
var xml;


_ltx('<root aa  aa = "dd>d<d"  qqq = "adfadf"/>');

function _ltx(xml) {
    var LtxSaxParser = require('ltx/lib/parsers/ltx.js');

    // (function() {
    //     var parser = new LtxSaxParser();
    //
    //     parser.on('startElement', function() {
    //         console.log(arguments);
    //     })
    //     parser.on('endElement', nullfunc)
    //     parser.on('text', nullfunc);
    //
    //     parser.end(xml);
    // })();

    (function() {
        console.log(4444, xml);
        var parser = new EasySax({
            autoEntity: true,
            on: {
                startNode: function(name, attr) {
                    console.log(name, attr());
                },
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    })();

};


function banch(_xml, _count, _only) {

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
    console.log('-------------------------------------------');


    var list = [
        test_ltx,

        test_EasySax_on_on_on,
        test_EasySax_off_on_on,
        test_EasySax_off_off_on,
        test_EasySax_off_off_off,

        // test_sax,
        // test_libxmljs,
        // test_nodeExpat_string,
        // test_nodeExpat_Buffer,
    ];


    var fn;
    while(fn = list.shift()) {
        fn(_xml);
    };

    console.log('-------------------------------------------');

};

function nullfunc() {};

function test(name, test) {
    'use strict';

    // if (only && !only.test(name.trim())) {
    //     return;
    // };

    if (count > 50) {
        for(var z = 20; z--;) {
            test();
        };
    } else {
        test();
    };



    console.time(name);
    for(var z = count; z--;) {
        test();
    };
    console.timeEnd(name);
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
    test('stringIndexOf', function() {
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

    test('saxjs ', function() {
        parser.write(xml).close();
    });
};

function test_libxmljs(xml) {
    var libxml = require("libxmljs");

    function go() {
        new libxml.SaxParser(function() {}).parseString(xml)
    };

    try {
        test('libxml', go);
    } catch(e) {
        console.log('libxml: error');
    };
};

function test_nodeExpat_string(xml) {
    var Expat = require('node-expat'), parser;
    function nullfunc() {};

    test('expat ', function() {
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

function test_ltx(xml) {
    var LtxSaxParser = require('ltx/lib/parsers/ltx.js');
    var countNodes = 0;

    test('ltx', function() {
        var parser = new LtxSaxParser();

        parser.on('startElement', function() {
            countNodes += 1;
        })
        parser.on('endElement', nullfunc)
        parser.on('text', nullfunc);

        parser.end(xml);

    });

    console.log('countNodes:', countNodes);

};

function test_EasySax_on_on_on(xml) {
    var entityDecode = EasySax.entityDecode
    var mapNS = {
        'http://www.w3.org/1999/xhtml': 'xhtml',
        'http://purl.org/rss/1.0/': 'rss',
        'http://www.w3.org/2005/Atom': 'atom',
        'http://search.yahoo.com/mrss/': 'media',
        'http://www.georss.org/georss': 'georss',
        'http://schemas.google.com/g/2005': 'gd',
    };

    function startNode(elem, attr, isTagEnd, getStrNode) {
        attr();
    };

    test('easysax ns=on  uq=on  attr=on ', function() {
        var parser = new EasySax({
            autoEntity: true,
            defaultNS: 'rss',
            ns: mapNS,
            on: {
                startNode: startNode,
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });
};

function test_EasySax_off_on_on(xml) {
    var entityDecode = EasySax.entityDecode
    function startNode(elem, attr) {
        attr();
    };

    test('easysax ns=off uq=on  attr=on ', function() {
        var parser = new EasySax({
            autoEntity: true,
            on: {
                startNode: startNode,
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });

};

function test_EasySax_off_off_on(xml) {
    var entityDecode = EasySax.entityDecode
    function startNode(elem, attr) {
        attr();
    };

    test('easysax ns=off uq=off attr=on ', function() {
        var parser = new EasySax({
            autoEntity: false,
            on: {
                startNode: startNode,
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });

};

function test_EasySax_off_off_off(xml) {
    var countNodes = 0;

    test('easysax ns=off uq=off attr=off', function() {
        var parser = new EasySax({
            autoEntity: false,
            on: {
                startNode: function() {countNodes += 1},
                endNode: nullfunc,
                text: nullfunc,
            },
        });

        parser.parse(xml);
    });

    console.log('countNodes:', countNodes);
};


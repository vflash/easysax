var FILE_NAME = './AS_SOCRBASE.XML';
var FILE_NAME = './xml.xml';

process.argv.forEach((cmd, index, list) => {
    if (cmd === '-file' && list[index + 1]) {
        FILE_NAME = list[index + 1];
    };
});

console.log(FILE_NAME);

var {performance} = require('perf_hooks');
var EasySax = require('../easysax.js');
var fs = require('fs');

(async function go() {
    await test(test_ltx);
    await test(test_saxwasm_zero);
    await test(test_saxwasm_full);
    await test(test_saxwasm);
    // await test(test_ltx);
    await test(test_EasySax_on_on_on);
    await test(test_EasySax_off_on_on);
    await test(test_EasySax_off_off_on);
    await test(test_EasySax_off_off_off);
})();


function nullFunc() {};
function str(value, len) {
    return (value + '                                           ').slice(0, len);
};

async function test(test) {
    var run = async (log) => {
        var end, p = new Promise(x => end = x);

        var timeTotal = performance.now();
        var time = 0;

        var config = await test();
        // time += performance.now() - timeTotal;

        var config_write = config.write;
        var config_end = config.end;
        var config_name = config.name;

        var rstream = fs.createReadStream(FILE_NAME, config.utf !== false ? 'utf8' : null);
        var size = 0;

        rstream.on("data", function(chunk){
            var xt = performance.now();
            config_write(chunk);
            time += performance.now() - xt;
            size += chunk.length;
        });

        rstream.on("end", function(){
            var xt = performance.now();
            var res = config_end();
            time += performance.now() - xt;

            var total = performance.now() - timeTotal;

            if (log) {
                console.log(`${str(config_name, 30)} - total: ${str(total.toFixed(2), 7)} time: ${str(time.toFixed(2), 7)}`, size, res?.countNodes, res?.countText);
            };
            end();
        });

        return p;
    };


    var z = 5; while(z--) {
        await run(false);
    };
    await run(true);
};


var {SaxEventType, SAXParser} = require('sax-wasm');
var {readFileSync} = require('fs');


async function test_saxwasm_full() {
    const wasmUrl = require.resolve('sax-wasm/lib/sax-wasm.wasm');
    const saxWasm = readFileSync(wasmUrl);
    const parser = new SAXParser(1023);
    await parser.prepareWasm(saxWasm);

    var countNodes = 0;
    var countText = 0;

    parser.eventHandler = (eventType, data) => {
        if (eventType === SaxEventType.OpenTag) {
            countNodes += 1;
        };
        if (eventType === SaxEventType.Text) {
            countText += 1;
        };
        // console.log('Событие:', eventType);
        // console.log('  Данные:', data);
        // console.log('---');
    };

    return {
        name: 'saxwasm-full',
        utf: false,
        write: async function(buffer) {
            parser.write(buffer);
        },
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

async function test_saxwasm_zero() {
    const wasmUrl = require.resolve('sax-wasm/lib/sax-wasm.wasm');
    const saxWasm = readFileSync(wasmUrl);
    // const parser = new SAXParser(1023);
    const parser = new SAXParser();
    await parser.prepareWasm(saxWasm);

    var countNodes = 0;
    var countText = 0;

    parser.eventHandler = (eventType, data) => {
    };

    return {
        name: 'saxwasm-zero',
        write: async function(data) {
            const buffer = new TextEncoder().encode(data);
            parser.write(buffer);
        },
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

async function test_saxwasm() {
    const wasmUrl = require.resolve('sax-wasm/lib/sax-wasm.wasm');
    const saxWasm = readFileSync(wasmUrl);
    // const parser = new SAXParser(1023);
    const parser = new SAXParser(SaxEventType.CloseTag | SaxEventType.OpenTag | SaxEventType.Text);
    await parser.prepareWasm(saxWasm);

    var countNodes = 0;
    var countText = 0;

    parser.eventHandler = (eventType, data) => {
        if (eventType === SaxEventType.OpenTag) {
            countNodes += 1;
        };
        if (eventType === SaxEventType.Text) {
            countText += 1;
        };
        // console.log('Событие:', eventType);
        // console.log('  Данные:', data);
        // console.log('---');
    };

    return {
        name: 'saxwasm',
        write: async function(data) {
            const buffer = new TextEncoder().encode(data);
            parser.write(buffer);
        },
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

function test_ltx() {
    var LtxSaxParser = require('ltx/lib/parsers/ltx.js');

    var countNodes = 0;
    var countText = 0;

    var parser = new LtxSaxParser();

    parser.on('startElement', function (name, attrs) {countNodes += 1})
    parser.on('endElement', function (name) {})
    parser.on('text', function (text) {countText += 1});

    return {
        name: 'ltx',
        write: function(data) {
            parser.write(data)
        },
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};


function test_EasySax_on_on_on() {
    var countNodes = 0;
    var countText = 0;

    var entityDecode = EasySax.entityDecode;
    var mapNS = {
        'http://www.w3.org/1999/xhtml': 'xhtml',
        'http://purl.org/rss/1.0/': 'rss',
        'http://www.w3.org/2005/Atom': 'atom',
        'http://search.yahoo.com/mrss/': 'media',
        'http://www.georss.org/georss': 'georss',
        'http://schemas.google.com/g/2005': 'gd',
    };

    var parser = new EasySax({
        autoEntity: true,
        defaultNS: 'rss',
        ns: mapNS,
        on: {
            startNode: function (name, attr, isTagEnd, getStrNode) {
                countNodes += 1;
                attr();
            },
            endNode: nullFunc,
            text: function(text) {
                countText += 1;
            },
        },
    });

    return {
        name: 'easysax ns=on  uq=on  attr=on ',
        write: function(data) {parser.write(data)},
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};


function test_EasySax_off_on_on() {
    var entityDecode = EasySax.entityDecode
    var countNodes = 0;
    var countText = 0;

    var parser = new EasySax({
        autoEntity: true,
        on: {
            startNode: function (elem, attr) {
                countNodes += 1;
                attr();

            },
            endNode: nullFunc,
            text: function(text) {
                countText += 1;
            },
        },
    });

    return {
        name: 'easysax ns=off uq=on  attr=on ',
        write: function(data) {parser.write(data)},
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

function test_EasySax_off_off_on() {
    var countNodes = 0;
    var countText = 0;

    var parser = new EasySax({
        autoEntity: false,
        on: {
            startNode: function(name, attr) {
                countNodes += 1;
                attr();
            },
            endNode: nullFunc,
            text: function(text) {countText += 1},
        },
    });

    return {
        name: 'easysax ns=off uq=off attr=on ',
        write: function(data) {parser.write(data)},
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};



function test_EasySax_off_off_off() {
    var countNodes = 0;
    var countText = 0;

    var parser = new EasySax({
        autoEntity: false,
        on: {
            startNode: function() {countNodes += 1},
            endNode: nullFunc,
            text: function(text) {
                countText += 1;
            },
        },
    });

    return {
        name: 'easysax ns=off uq=off attr=off',
        write: function(data) {parser.write(data)},
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

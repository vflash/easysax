var FILE_NAME = null;
var SIZE_MB = 500;

process.argv.forEach((cmd, index, list) => {
    if (cmd === '-file' && list[index + 1]) {
        FILE_NAME = list[index + 1];
    };
    if (cmd === '-size' && list[index + 1]) {
        SIZE_MB = list[index + 1];
    };
});


console.log(str('file: ' + FILE_NAME, 71) + ' elems    text');
console.log("-".repeat(90));

var {performance} = require('perf_hooks');
var EasySax = require('../easysax.js');
var fs = require('fs');

(async function go() {
    await test(test_empty);
    console.log('')
    await test(test_EasySax_on_on_on);
    await test(test_EasySax_off_on_on);
    await test(test_EasySax_off_off_on);
    await test(test_EasySax_off_off_off);
    console.log('')
    await test(test_ltx);
    await test(test_saxwasm_zero);
    await test(test_saxwasm_full);
    await test(test_saxwasm);
})();


function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 Bytes';
    };
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function nullFunc() {};
function str(value, len) {
    return ((value ?? '') + " ".repeat(100)).slice(0, len);
};

async function test(test) {
    var run = async (log) => {
        var end, p = new Promise(x => end = x);

        var timeTotal = performance.now();
        var time = 0;
        var size = 0;

        var config = await test();
        var config_write = config.write;
        var config_end = config.end;
        var config_name = config.name;

        var rstream = (FILE_NAME
            ? fs.createReadStream(FILE_NAME, config.utf !== false ? 'utf8' : null)
            : createMockXmlStream(SIZE_MB, config.utf !== false)
        );

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
                console.log(`${str(config_name, 30)} - total: ${str(total.toFixed(2), 8)} time: ${str(time.toFixed(2), 8)}`, formatBytes(size), str(res?.countNodes, 8), (res?.countText ?? ''));
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


const { Readable } = require('stream');

/**
 * Создает мок-поток (Readable), генерирующий XML заданного объема порциями по 64 КБ.
 * @param {number} sizeInGb - Желаемый объем данных в ГБ.
 * @param {boolean} isUtf8 - Нужно ли устанавливать кодировку utf8.
 * @returns {Readable}
 */
function createMockXmlStream(sizeInMb = 1000, isUtf8 = true) {
    const TARGET_SIZE_BYTES = sizeInMb * 1024 * 1024;
    const CHUNK_SIZE = 64 * 1024; // 64 КБ
    const repeat_x = 'x'.repeat(120);

    const stream = Readable.from((async function* () {
        let totalSent = 0;
        let buffer = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';

        let i = 0;
        while (totalSent < TARGET_SIZE_BYTES) {
            // Генерируем повторяющийся блок
            const item = `  <item id="${i++}"><payload>${repeat_x}</payload></item>\n`;
            buffer += item;

            // Как только накопили 64 КБ или больше — отдаем чанк в поток
            if (buffer.length >= CHUNK_SIZE) {
                yield buffer;
                totalSent += buffer.length;
                buffer = '';
            }

            // Оставляем запас под закрывающий тег в конце
            if (totalSent + buffer.length > TARGET_SIZE_BYTES - 20) {
                break;
            }
        }

        yield buffer + '</root>';
    })());

    if (isUtf8) {
        stream.setEncoding('utf8');
    };

    return stream;
};

async function test_empty() {
    return {
        name: 'only load',
        utf: false,
        write: async function(buffer) {
        },
        end: function() {
        },
    };
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

var SaxEventType, SAXParser; // sax-wasm - опциональная зависимость, нужна только для закомментированных тестов
try {
    ({SaxEventType, SAXParser} = require('sax-wasm'));
} catch (e) {};

var EasySax = require('../easysax.js');

var {readFileSync} = require('fs');
var {performance} = require('perf_hooks');
var {Readable} = require('stream');
var fs = require('fs');

var FILE_NAME = null;
var LIMIT_MB = 0;
var SIZE_MB = 500;
var MOCK_TYPE = 'mock'; // тип генератора мока: mock | catalog
var MOCK_TYPES = ['mock', 'catalog'];

process.argv.forEach((cmd, index, list) => {
    if (cmd === '-file' && list[index + 1]) {
        FILE_NAME = list[index + 1];
    };
    if (cmd === '-limit' && list[index + 1]) {
        LIMIT_MB = list[index + 1];
    };
    if (cmd === '-size' && list[index + 1]) {
        SIZE_MB = list[index + 1];
    };
    if (cmd === '-type' && list[index + 1]) {
        MOCK_TYPE = list[index + 1];
    };
});

if (MOCK_TYPES.indexOf(MOCK_TYPE) === -1) {
    console.error('unknown -type: ' + MOCK_TYPE + ' (available: ' + MOCK_TYPES.join(', ') + ')');
    process.exit(1);
};


console.log(str('file: ' + FILE_NAME, 71) + ' elems    text');
console.log("-".repeat(90));

if (require.main === module) {
    (async function() {
        await test(test_empty);

        await test(test_EasySax_on_on_on);
        await test(test_EasySax_off_on_on);
        await test(test_EasySax_off_off_on);
        await test(test_EasySax_off_off_off);

        console.log(' ');

        await tryTest(test_eksml, 'eksml');
        await tryTest(test_ltx, 'ltx');
        await tryTest(test_saxes, 'saxes');
        //await test(test_saxwasm_zero);
        //await test(test_saxwasm_full);
        //await test(test_saxwasm);

        console.log('-'.repeat(90));
    })();
};



// тест с опциональной зависимостью: модуль не установлен - строка пропускается
async function tryTest(testFn, name) {
    try {
        await test(testFn);
    } catch (e) {
        var msg = String(e && e.message || e).split('\n')[0];
        console.log(str(name + ' - skip: ' + msg, 71));
    };
};



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
function pause(ms) {return new Promise(resolve => setTimeout(resolve, ms))};
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

        var rstream = (FILE_NAME && log
            ? fs.createReadStream(FILE_NAME, config.utf !== false ? 'utf8' : null)
            : createMockStream(MOCK_TYPE, log ? SIZE_MB : 20, config.utf !== false)
        );

        var onchunk = (chunk) => {
            var xt = performance.now();
            config_write(chunk);
            time += performance.now() - xt;
            size += chunk.length;

            if (LIMIT_MB && size >= LIMIT_MB * 1024 * 1024) {
                rstream.destroy();
                onend();
            };
        };
        var onend = () => {
            var xt = performance.now();
            var res = config_end();
            var total = performance.now() - timeTotal;
            time += performance.now() - xt;
            if (log) {
                console.log(`${str(config_name, 30)} - total: ${str(total.toFixed(2), 8)} time: ${str(time.toFixed(2), 8)}`, formatBytes(size), str(res?.countNodes, 8), (res?.countText ?? ''));
            };
            end();
        };

        // // для работы лучше использовать for await
        // for await (const chunk of rstream) {onchunk(chunk)};
        // onend();

        // для тестов лучше использовать .on()
        rstream.on('data', onchunk);
        rstream.on('end', onend);

        return p;
    };


    var z = 5; while(z--) {
        await run(false);
    };

    await pause(100);
    await run(true);
};


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
            const item = `  <item id="${i++}" size="&quot;big&quot;"><payload type="string">${repeat_x}</payload><hr/></item>\n`;
            //const item = `  <item id="${i++}"><payload>${repeat_x}</payload></item>\n`;
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


// << ------------------------------------------------------------------------ >>
// catalog mock: детерминированный генератор "каталога товаров".
// Циклические шаблоны (status, имя, версия, uuid, tags) совпадают с эталонным
// примером байт в байт. Никакого Math.random - одинаковый поток при каждом запуске.
// --------------------------------------------------------------------------

const CATALOG_ADJ = ['Быстрый', 'Мощный', 'Умный', 'Красивый'];          // имя, цикл 4
const CATALOG_DEVICES = ['движок', 'процессор', 'контроллер', 'модуль']; // имя и category, цикл 4
const CATALOG_STATUS = ['inactive', 'pending', 'deployed', 'testing', 'active'];    // цикл 5
const CATALOG_TAG_ADJ = ['умный', 'компактный', 'быстрый', 'красивый'];  // первый tag, цикл 4
const CATALOG_TAG_STATUS = ['pending', 'testing', 'inactive', 'deployed', 'active']; // второй tag, цикл 5
const CATALOG_UUID_BASE = '741eb852fc9630da'; // база uuid: ротация на 3*i hex-символов, дубль 2 раза


function catalogHash(i, salt) { // детерминированный хеш ( murmur3 finalizer )
    var h = (i ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
};


function catalogItem(i) { // один <item> с \n в конце, i - с нуля
    const id = i + 1;
    const adj = CATALOG_ADJ[i % 4];
    const device = CATALOG_DEVICES[i % 4];
    const status = CATALOG_STATUS[i % 5];
    const tag1 = CATALOG_TAG_ADJ[i % 4];
    const tag2 = CATALOG_TAG_STATUS[i % 5];

    const major = (id % 99) + 1; // версия: id 96 -> 97.7, id 98 -> 99.9, id 99 -> 1.1
    const version = major + '.' + (major % 10);

    const rot = (3 * i) % 16;
    const core = CATALOG_UUID_BASE.slice(rot) + CATALOG_UUID_BASE.slice(0, rot);
    const full = core + core;
    const uuid = `${full.slice(0, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}-${full.slice(16, 20)}-${full.slice(20, 32)}`;

    const price = (1000 + (catalogHash(i, 1) % 900000) / 100).toFixed(2); // 1000.00 - 9999.99
    const stock = catalogHash(i, 2) % 5000; // 0 - 4999

    return `  <item id="${id}" status="${status}">\n`
        + `    <name>${adj} ${device} #${id}</name>\n`
        + `    <description>${adj.toLowerCase()} ${device} для высокопроизводительных систем, версия ${version}. UUID: ${uuid}</description>\n`
        + `    <price>${price}</price>\n`
        + `    <stock>${stock}</stock>\n`
        + `    <category>${device}</category>\n`
        + `    <tags>\n`
        + `      <tag>${tag1}</tag>\n`
        + `      <tag>${tag2}</tag>\n`
        + `    </tags>\n`
        + `  </item>\n`;
};


/**
 * Создает мок-поток (Readable) в формате каталога товаров заданного объема.
 * Содержимое полностью детерминировано: при каждом запуске байт в байт одинаковое.
 */
function createMockCatalogStream(sizeInMb = 1000, isUtf8 = true) {
    const TARGET_SIZE_BYTES = sizeInMb * 1024 * 1024;
    const CHUNK_SIZE = 64 * 1024; // 64 КБ

    const stream = Readable.from((async function* () {
        let totalSent = 0;
        let buffer = '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n';

        let i = 0;
        while (totalSent < TARGET_SIZE_BYTES) {
            buffer += catalogItem(i);
            i += 1;

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

        yield buffer + '</catalog>';
    })());

    if (isUtf8) {
        stream.setEncoding('utf8');
    };

    return stream;
};


// реестр типов моков: имя -> генератор потока
var MOCK_STREAMS = {
    mock: createMockXmlStream,
    catalog: createMockCatalogStream,
};

function createMockStream(type, sizeInMb, isUtf8) { // диспетчер по -type
    return MOCK_STREAMS[type](sizeInMb, isUtf8);
};

async function test_empty() {
    return {
        name: 'only load',
        utf: true,
        write: async function(buffer) {},
        end: function() {},
    };
};


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

    // усеченный поток (-limit): не даем ошибкам закрытия документа убить бенчмарк
    parser.on('error', function (e) {});
    parser.on('startElement', function (name, attrs) {countNodes += 1});
    parser.on('endElement', function (name) {});
    parser.on('text', function (text) {countText += 1});

    return {
        name: 'ltx            uq=on  attr=on',
        write: function(data) {
            parser.write(data)
        },
        end: function() {
            parser.end();
            return {countNodes, countText};
        },
    };
};

function test_saxes() {
    var {SaxesParser} = require('saxes');

    var countNodes = 0;
    var countText = 0;

    var parser = new SaxesParser({xmlns: false});

    // без слушателя error saxes бросает исключение на parser.close() усеченного документа (-limit)
    parser.on('error', function (e) {})
    parser.on('opentag', function (name, attrs) {countNodes += 1})
    parser.on('closetag', function (name) {})
    parser.on('text', function (text) {countText += 1});
    parser.on('attribute', function (atts) {});

    return {
        name: 'saxes          uq=on  attr=on',
        write: function(data) {
            parser.write(data)
        },
        end: function() {
            parser.close();
            return {countNodes, countText};
        },
    };
};


function test_eksml() {
    var eksmlSaxParser = require('./eksml.js').default;

    var countNodes = 0;
    var countText = 0;

    const parser = eksmlSaxParser();

    parser.on('openTag', function (name, attrs) {countNodes += 1})
    parser.on('closeTag', function (name) {})
    parser.on('text', function (text) {countText += 1;});

    return {
        name: 'eksml          uq=off attr=on',
        write: function(data) {
            parser.write(data)
        },
        end: function() {
            parser.close();
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
        defaultNS: null,
        ns: null,
        on: {
            startNode: function (elem, attr) {
                countNodes += 1;
                attr();
            },
            endNode: nullFunc,
            text: function(text) {countText += 1},
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
        defaultNS: null,
        ns: null,
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
        defaultNS: null,
        ns: null,
        on: {
            startNode: function() {countNodes += 1},
            endNode: nullFunc,
            text: function(text) {countText += 1},
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


module.exports = {
    createMockXmlStream,
    createMockCatalogStream,
};

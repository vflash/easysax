var easysax = require('../easysax.js');
var assert = require('assert');

/*
describe('test-01', function() {
    it('создание корневого элемента', function() {
        assert.equal('MyBlock', b(''));
    });
});


test({
    xml: '<div/>',
    ns: false, // 'rss',
    to: [
        ['startNode', 'div', {}, true],
    ],
});
*/

// << ------------------------------------------------------------------------ >>
// тестовый харнесс (мини-раннер, замена mocha)
//
// файлы кейсов (easysax.test.js и другие) вызывают
// test({xml, to, ...}) на каждый кейс, раннер выполняет кейс сразу
// и печатает результат в стиле spec-репортера mocha:
//
//   ✓ <div/>
//   1) <div />  (проваленные тесты нумеруются)
//
//   98 passing (12ms)
//   2 failing
//
// код возврата 1 - есть проваленные тесты

var runnerTotal = 0; // всего тестов
var runnerFailList = []; // [{name, error}]
var runnerTimeStart = 0; // время старта первого теста
var runnerSummaryPlaned = false; // вывод итогов запланирован


function runnerLog(str) {
    console.log(str);
};


function runnerColor(code, str) { // раскраска вывода (как в mocha spec)
    if (!process.stdout.isTTY || process.env.NO_COLOR) {
        return str;
    };

    return '\x1b[' + code + 'm' + str + '\x1b[0m';
};


function runnerStack(error) { // чистый стек без служебных кадров
    var list = String(error && error.stack || '').split('\n');
    var out = [];
    var line = '';
    var i = 0;

    for (; i < list.length; i++) {
        line = list[i];

        if (line.indexOf('node:internal') !== -1 || line.indexOf('node:assert') !== -1) {
            continue;
        };

        if (line.indexOf('utils.js') !== -1) {
            continue;
        };

        out.push(line);
    };

    return out;
};


function runnerPrintSummary() { // итоги, печатаются после завершения всех тестов
    var failed = runnerFailList.length;
    var passed = runnerTotal - failed;
    var time = Date.now() - runnerTimeStart;
    var item = null;
    var stack = null;
    var i = 0;

    if (!runnerTotal) {
        return; // модуль могли просто потребовать без тестов
    };

    runnerLog('');
    runnerLog('  ' + runnerColor('32', passed + ' passing') + runnerColor('90', ' (' + time + 'ms)'));

    if (!failed) {
        return;
    };

    runnerLog('  ' + runnerColor('31', failed + ' failing'));
    runnerLog('');

    for (; i < failed; i++) {
        item = runnerFailList[i];

        runnerLog('  ' + runnerColor('31', (i + 1) + ')') + ' ' + item.name);
        runnerLog('     ' + runnerColor('31', String(item.error && item.error.message || item.error)));

        stack = runnerStack(item.error);
        for (var j = 1; j < stack.length; j++) { // первая строка стека дублирует message
            runnerLog(runnerColor('90', '      ' + stack[j].replace(/^\s+/, '')));
        };

        runnerLog('');
    };

    process.exitCode = 1;
};


function runnerRun(name, fn) { // регистрация и выполнение одного теста
    if (!runnerTotal) {
        runnerTimeStart = Date.now();
    };

    if (!runnerSummaryPlaned) {
        runnerSummaryPlaned = true;
        setImmediate(runnerPrintSummary); // все вызовы test() синхронны, итоги - после последнего
    };

    runnerTotal++;

    var time = Date.now();

    try {
        fn();

        var duration = Date.now() - time;
        var slow = duration >= 250 ? '31' : (duration >= 75 ? '33' : (duration >= 18 ? '90' : ''));

        runnerLog('  ' + runnerColor('32', '✓') + ' ' + name + (slow ? runnerColor(slow, ' (' + duration + 'ms)') : ''));

    } catch (error) {
        runnerFailList.push({name: name, error: error});
        runnerLog('  ' + runnerColor('31', runnerFailList.length + ')') + ' ' + name);
    };
};


module.exports = function(op) {
    var name = Array.isArray(op.xml) ? op.xml.join('|') : '' + op.xml;
    //var name = JSON.stringify(op.xml);
    if (!name.trim()) {
        name = JSON.stringify(name);
    };

    runnerRun(name.substr(0, 275), function() {
        assert.equal(false, test(op || false));
    });
};

function test(options) {
    var parser = options.parser;
    var error = false;
    var indexTest = -1;
    var list = [].concat(options.to);

    if (!parser) {
        parser = new easysax({
            autoEntity: !!options.autoEntity,
            defaultNS: options.ns,
            ns: {
                'http://search.yahoo.com/mrss/': 'media',
                'http://www.w3.org/1999/xhtml': 'xhtml',
                'http://www.w3.org/2005/Atom': 'atom',
                'http://purl.org/rss/1.0/': 'rss',
            },
        });
    };

    function test(name) {
        var values = list[++indexTest];
        var args = arguments;

        if (error) {
            return;
        };

        if (!values) {
            if (name === 'startNode' || name === 'endNode') {
                error = name + ' ' + args[1] + ' - не полный тест';
            } else {
                error = name + ' - не полный тест';
            };
            return;
        };
        var str = x => Object.prototype.toString.call(x);

        for(var index = 0, l = values.length; index < l; index++) {
            var value = values[index];

            if (name === 'startNode' && index === 2) {
                var attrs = args[index];
                if (!value || value === true) {
                    if (attrs !== value) {
                        error = '#' + indexTest + ' событие ' + name + ':' + index + '  attr: ' + str(attrs) + ' !== ' + value;
                        break;
                    };
                };

                for (var j in value) {
                    if (value[j] !== attrs[j]) {
                        error = '#' + indexTest + ' событие ' + name + ':' + index + ', атрибут  ' + j + ', значение ' + attrs[j] + ' !== ' + value[j];
                        break;
                    };
                };

                if (error) {
                    break;
                };

                continue;
            };

            if ((name === 'startNode' && index === 4) || (name === 'endNode' && index === 3)) {
                var arg = args[index]();
                if (arg !== value) {
                    error = name + ':' + index + '  getStringNode ' + arg + ' !== ' + value;
                };
                break;
            };

            if (args[index] !== value) {
                error = '#' + indexTest + ' событие ' + name + ':' + index + ', значение ' + args[index] + ' !== ' + value;
                break;
            };
        };
    };


    parser.on('error', function(msg) {
        test('error');
    });

    parser.on('startNode', function(elem, attr, tagend, getStrNode) {
        test('startNode', elem, attr(), tagend, getStrNode);
    });

    parser.on('endNode', function(elem, tagstart, str) {
        test('endNode', elem, tagstart, str);
    });

    parser.on('textNode', function(s) {
        test('textNode', s);
    });

    parser.on('cdata', function(data) {
        test('cdata', data);
    });

    parser.on('comment', function(text) {
        test('comment', text);
    });

    parser.on('attention', function(text) {
        test('attention', text);
    });

    parser.on('question', function(text) {
        test('question', text);
    });


    parser.on('unknownNS', function(value) {
        test('unknownNS', value);
        return value === 'AAA' ? 'aaa' : (value === 'BBB' ? 'bbb' : null);
    });

    var xml = options.xml;
    if (Array.isArray(xml)) {
        xml.forEach(chunk => parser.write(chunk));
        parser.end();

    } else {
        parser.parse(xml);
    };

    return error;
};



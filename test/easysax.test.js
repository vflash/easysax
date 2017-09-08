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

module.exports = function(op) {
    it(op.xml.substr(0, 275), function() {
        assert.equal(false, test(op || false));
    });
};

function test(options) {
    var parser = options.parser;
    var error = false;
    var list = options.to;

    if (!parser) {
        parser = new easysax();
        parser.ns(options.ns || false, {
            'http://search.yahoo.com/mrss/': 'media',
            'http://www.w3.org/1999/xhtml': 'xhtml',
            'http://www.w3.org/2005/Atom': 'atom',
            'http://purl.org/rss/1.0/': 'rss',
        });
    };

    function test(name) {
        var values = list.shift();
        var args = arguments;

        if (error) {
            return;
        };

        if (!values) {
            error = name + ': не полный тест';
            return;
        };

        for(var index = 0, l = values.length; index < l; index++) {
            var value = values[index];

            if (name === 'startNode' && index === 2) {
                var attrs = args[index];
                if (!value || value === true) {
                    if (attrs !== value) {
                        error = name + ':' + index + '  attr: ' + value + ' !== ' + attrs;
                        break;
                    };
                };

                for (var j in value) {
                    if (value[j] !== attrs[j]) {
                        error = name + ':' + index + '  ' + j + ': ' + value[j] + ' !== ' + attrs[j];
                        break;
                    };
                };

                if (error) {
                    break;
                };

                continue;
            };

            if (args[index] !== value) {
                error = name + ':' + index + '  ' + args[index] + ' !== ' + value;
                break;
            };
        };

        return error;
    };


    parser.on('error', function(msg) {
        test('error');
    });

    parser.on('startNode', function(elem, attr, uq, tagend, getStrNode) {
        test('startNode', elem, attr(), tagend, getStrNode);
    });

    parser.on('endNode', function(elem, uq, tagstart, str) {
        test('endNode', elem, tagstart, str);
    });

    parser.on('textNode', function(s, uq) {
        test('textNode', s);
    });

    parser.on('cdata', function(data) {
        test('cdata', data);
    });

    parser.on('comment', function(text) {
        test('comment', text);
    });


    parser.parse(options.xml);
    return error;
};



'use strict';

/*
new function() {
    var parser = new EasySAXParser();

    parser.ns('rss', { // or false
        'http://search.yahoo.com/mrss/': 'media',
        'http://www.w3.org/1999/xhtml': 'xhtml',
        'http://www.w3.org/2005/Atom': 'atom',
        'http://purl.org/rss/1.0/': 'rss',
    });

    parser.on('error', function(msgError) {
    });

    parser.on('startNode', function(nodeName, getAttr, isTagEnd, getStrNode) {
        var attr = getAttr();
    });

    parser.on('endNode', function(nodeName, isTagStart, getStrNode) {
    });

    parser.on('textNode', function(text) {
    });

    parser.on('cdata', function(data) {
    });


    parser.on('comment', function(text) {
        //console.log('--'+text+'--')
    });

    //parser.on('unknownNS', function(key) {console.log('unknownNS: ' + key)});
    //parser.on('question', function() {}); // <? ... ?>
    //parser.on('attention', function() {}); // <!XXXXX zzzz="eeee">


    parser.write(stringChunk);
    parser.write(stringChunk);
    ...
    parser.end(stringChunk);
};

*/

// << ------------------------------------------------------------------------ >> //

EasySAXParser.entityDecode = xmlEntityDecode;
module.exports = EasySAXParser;


var stringFromCharCode = String.fromCharCode;
var objectCreate = Object.create;
function NULL_FUNC() {};


function entity2char(x) {
    if (x === 'amp') {
        return '&';
    };

    switch(x.toLocaleLowerCase()) {
        case 'quot': return '"';
        case 'amp': return '&'
        case 'lt': return '<'
        case 'gt': return '>'

        case 'plusmn': return '\u00B1';
        case 'laquo': return '\u00AB';
        case 'raquo': return '\u00BB';
        case 'micro': return '\u00B5';
        case 'nbsp': return '\u00A0';
        case 'copy': return '\u00A9';
        case 'sup2': return '\u00B2';
        case 'sup3': return '\u00B3';
        case 'para': return '\u00B6';
        case 'reg': return '\u00AE';
        case 'deg': return '\u00B0';
        case 'apos': return '\'';
    };

    return '&' + x + ';';
};

function replaceEntities(s, d, x, z) {
    if (z) {
        return entity2char(z);
    };

    if (d) {
        return stringFromCharCode(d);
    };

    return stringFromCharCode(parseInt(x, 16));
};

function xmlEntityDecode(s) {
    var s = ('' + s);

    if (s.length > 3 && s.indexOf('&') !== -1) {
        if (s.indexOf('&lt;') !== -1) {s = s.replace(/&lt;/g, '<');}
        if (s.indexOf('&gt;') !== -1) {s = s.replace(/&gt;/g, '>');}
        if (s.indexOf('&quot;') !== -1) {s = s.replace(/&quot;/g, '"');}

        if (s.indexOf('&') !== -1) {
            s = s.replace(/&#(\d+);|&#x([0123456789abcdef]+);|&(\w+);/ig, replaceEntities);
        };
    };

    return s;
};

function cloneMatrixNS(nsmatrix) {
    var nn = objectCreate(null);
    for (var n in nsmatrix) {
        nn[n] = nsmatrix[n];
    };
    return nn;
};


function EasySAXParser(config) {
    if (!this) {
        return null;
    };

    var onTextNode = NULL_FUNC, onStartNode = NULL_FUNC, onEndNode = NULL_FUNC, onCDATA = NULL_FUNC, onError = NULL_FUNC, onComment, onQuestion, onAttention, onUnknownNS;
    var is_onComment = false, is_onQuestion = false, is_onAttention = false, is_onUnknownNS = false;

    var isAutoEntity = true; // делать "EntityDecode" всегда
    var indexStartXML; // позиция на которой закончен разбор xml
    var entityDecode = xmlEntityDecode;
    var hasSurmiseNS;
    var isNamespace = false;
    var returnError;
    var isParseStop; // прервать парсер
    var defaultNS;
    var nsmatrix = null;
    var useNS;
    var init = false;
    var xml; // string

    var stringNodePosStart; // number. для получения исходной строки узла
    var stringNodePosEnd; // number. для получения исходной строки узла
    var attrStartPos; // number начало позиции атрибутов в строке attrString <(div^ class="xxxx" title="sssss")/>
    var attrString; // строка атрибутов <(div class="xxxx" title="sssss")/>
    var attrRes; // закешированный результат разбора атрибутов , null - разбор не проводился, object - хеш атрибутов, true - нет атрибутов, false - невалидный xml

    function reset() {
        if (isNamespace) {
            nsmatrix = objectCreate(null);
            nsmatrix.xmlns = defaultNS;
        };

        indexStartXML = 0;
        hasSurmiseNS = false;
        returnError = '';
        isParseStop = false;
        attrRes = true;
        xml = '';
    };

    this.setup = function (op) {
        for (var name in op) {
            switch(name) {
                case 'entityDecode': entityDecode = op.entityDecode || entityDecode; break;
                case 'autoEntity': isAutoEntity = !!op.autoEntity; break;
                case 'defaultNS': defaultNS = op.defaultNS || null; break;
                case 'ns': useNS = op.ns || null; break;
                case 'on':
                    var listeners = op.on;
                    for (var ev in listeners) {
                        this.on(ev, listeners[ev]);
                    };
                break;
            };
        };

        isNamespace = !!defaultNS && !!useNS;
    };

    this.on = function(name, cb) {
        // if (typeof cb !== 'function') {
        //     if (cb !== null) {
        //         throw error('required args on(string, function||null)');
        //     };
        // };

        switch(name) {
            case 'startNode': onStartNode = cb || NULL_FUNC; break;
            case 'endNode': onEndNode = cb || NULL_FUNC; break;
            case 'text': case 'textNode': onTextNode = cb || NULL_FUNC; break;
            case 'error': onError = cb || NULL_FUNC; break;
            case 'cdata': onCDATA = cb || NULL_FUNC; break;

            case 'unknownNS': onUnknownNS = cb; is_onUnknownNS = !!cb; break;
            case 'attention': onAttention = cb; is_onAttention = !!cb; break; // <!XXXXX zzzz="eeee">
            case 'question': onQuestion = cb; is_onQuestion = !!cb; break; // <? ....  ?>
            case 'comment': onComment = cb; is_onComment = !!cb; break;
        };
    };

    this.ns = function(root, ns) {
        if (!root) {
            isNamespace = false;
            defaultNS = null;
            useNS = null;
            return this;
        };

        if (!ns || typeof root !== 'string') {
            throw error('required args ns(string, object)');
        };

        isNamespace = !!(useNS = ns || null);
        defaultNS = root || null;

        return this;
    };

    this.write = function(chunk) {
        if (typeof chunk !== 'string' || isParseStop) {
            return;
        };

        if (!init) {
            init = true;
            reset();
        };

        xml = xml ? xml + chunk : chunk;
        parse();

        if (isParseStop && returnError) {
            if (returnError) {
                onError(returnError);
                returnError = '';
            };
        };

        if (indexStartXML > 0) {
            xml = xml.substring(indexStartXML);
            indexStartXML = 0;
        };

        return this;
    };

    this.end = function() {
        if (returnError) {
            onError(returnError);
            returnError = '';
        };

        attrString = '';
        init = false;
        xml = '';
    };

    this.parse = function(xml) {
        this.write(xml);
        this.end();
    };

    this.stop = function() {
        isParseStop = true;
    };

    if (config) {
        this.setup(config);
    };

    // -----------------------------------------------------



    /*
        парсит атрибуты по требованию. Важно! - функция не генерирует исключения.

        если была ошибка разбора возврашается false
        если атрибутов нет и разбор удачен то возврашается true
        если есть атрибуты то возврашается обьект(хеш)
    */

    function getAttrs() {
        if (attrRes !== null) {
            return attrRes;
        };

        var xmlnsAlias;
        var nsAttrName;
        var attrList = isNamespace && hasSurmiseNS ? [] : null;
        var i = attrStartPos + 1; // так как первый символ уже был проверен
        var s = attrString;
        var l = s.length;
        var hasNewMatrix;
        var newalias;
        var value;
        var alias;
        var name;
        var res = {};
        var ok;
        var iQ;
        var iK;
        var w;
        var j;


        for(; i < l; i++) {
            w = s.charCodeAt(i);

            if (w === 32 || (w < 14 && w > 8) ) { // \f\n\r\t\v
                continue
            };

            if (w < 65 || w > 122 || (w > 90 && w < 97) ) { // недопустимые первые символы
                if (w !== 95 && w !== 58) { // char 95"_" 58":"
                    return attrRes = false; // error. invalid first char
                };
            };

            for(j = i + 1; j < l; j++) { // проверяем все символы имени атрибута
                w = s.charCodeAt(j);

                if ( w > 96 && w < 123 || w > 64 && w < 91 || w > 47 && w < 59 || w === 45 || w === 95) {
                    continue;
                };

                if (w !== 61) { // "=" == 61
                    return attrRes = false; // error. invalid char "="
                };

                break;
            };

            name = s.substring(i, j);
            ok = true;


            if (name === 'xmlns:xmlns') {
                return attrRes = false; // error. invalid name
            };

            w = s.charCodeAt(j + 1);

            if (w === 34) {  // '"'
                j = s.indexOf('"', i = j + 2);

            } else {
                if (w !== 39) { // "'"
                    return attrRes = false; // error. invalid char
                };

                j = s.indexOf('\'', i = j + 2);
            };

            if (j === -1) {
                return attrRes = false; // error. invalid char
            };

            if (j + 1 < l) {
                w = s.charCodeAt(j + 1);

                if (w > 32 || w < 9 || (w < 32 && w > 13)) {
                    // error. invalid char
                    return attrRes = false;
                };
            };


            value = s.substring(i, j);
            i = j + 1; // след. семвол уже проверен потому проверять нужно следуюший

            if (isAutoEntity) {
                value = entityDecode(value);
            };

            if (!isNamespace) { //
                res[name] = value;
                continue;
            };

            if (hasSurmiseNS) {
                // есть подозрение что в атрибутах присутствует xmlns
                newalias = (name !== 'xmlns'
                    ? name.charCodeAt(0) === 120 && name.substr(0, 6) === 'xmlns:' ? name.substr(6) : null
                    : 'xmlns'
                );

                if (newalias !== null) {
                    alias = useNS[isAutoEntity ? value : entityDecode(value)];
                    if (is_onUnknownNS && !alias) {
                        alias = onUnknownNS(value);
                    };

                    if (alias) {
                        if (nsmatrix[newalias] !== alias) {
                            if (!hasNewMatrix) {
                                nsmatrix = cloneMatrixNS(nsmatrix);
                                hasNewMatrix = true;
                            };

                            nsmatrix[newalias] = alias;
                        };
                    } else {
                        if (nsmatrix[newalias]) {
                            if (!hasNewMatrix) {
                                nsmatrix = cloneMatrixNS(nsmatrix);
                                hasNewMatrix = true;
                            };

                            nsmatrix[newalias] = false;
                        };
                    };

                    res[name] = value;
                    continue;
                };

                attrList.push(name, value);
                continue;
            };

            iQ = name.indexOf(':');
            if (iQ === -1) {
                res[name] = value;
                continue;
            };

            if (nsAttrName = nsmatrix[name.substring(0, iQ)]) {
                nsAttrName = nsmatrix.xmlns === nsAttrName ? name.substr(iQ + 1) : nsAttrName + name.substr(iQ);
                res[nsAttrName + name.substr(iQ)] = value;
            };
        };

        if (!ok) {
            return attrRes = true;  // атрибутов нет, ошибок тоже нет
        };

        if (hasSurmiseNS)  {
            xmlnsAlias = nsmatrix.xmlns;

            for (i = 0, l = attrList.length; i < l; i++) {
                name = attrList[i++];
                iK = name.indexOf(':');

                if (iK !== -1) {
                    if (nsAttrName = nsmatrix[name.substring(0, iK)]) {
                        nsAttrName = xmlnsAlias === nsAttrName ? name.substr(iK + 1) : nsAttrName + name.substr(iK);
                        res[nsAttrName] = attrList[i];
                    };
                    continue;
                };
                res[name] = attrList[i];
            };
        };

        return attrRes = res;
    };

    function getStringNode() { // вернет исходную строку узла
        return xml.substring(stringNodePosStart, stringNodePosEnd);
    };


    var parseStackMatrixNS = [];
    var parseStackNodes = [];
    var stopIndexNS = 0;


    function parse() {
        // разбор идет по элементам (тег, текст cdata, ...).
        // элемент должен быть целиком в памяти

        var _nsmatrix;
        var isTagStart = false;
        var isTagEnd = false;
        var nodeBody;
        var stopEmit; // используется при разборе "namespace" . если встретился неизвестное пространство то события не генерируются
        var nodeName;
        var xmlns;
        var iD;
        var iQ;
        var w;
        var i; // number

        returnError = null; // сброс ошибки неудачного разбора

        while(indexStartXML !== -1) {
            stopEmit = stopIndexNS > 0;

            // поиск начала тега
            if (xml.charCodeAt(indexStartXML) === 60) { // "<"
                i = indexStartXML;
            } else {
                i = xml.indexOf('<', indexStartXML);
            };

            if (i === -1) { // узел не найден. повторим попытку на след. write
                if (parseStackNodes.length) {
                    returnError = 'unexpected end parse';
                    return;
                };

                // --- нужно подумать как обрабатывать начало файла ---
                // if (indexStartXML === 0) { // разбор еше не начат. возможно это начало файла. мусор до первого тега игнор
                //     returnError = 'missing first tag';
                //     return;
                // };

                return;
            };

            if (indexStartXML !== i && !stopEmit) { // все что до тега это текст
                let text = xml.substring(indexStartXML, i);
                indexStartXML = i; // до этой позиции разбор завершен

                onTextNode(isAutoEntity ? entityDecode(text) : text);
                if (isParseStop) {
                    return;
                };
            };

            // ELEMENT
            // ---------------------------------------------

            w = xml.charCodeAt(i + 1);

            if (w === 33) { // 33 == "!"
                let w = xml.charCodeAt(i + 2);

                // CDATA
                // ---------------------------------------------
                if (w === 91 && xml.substr(i + 3, 6) === 'CDATA[') { // 91 == "["
                    let indexStartCDATA = i + 9;
                    let indexEndCDATA = xml.indexOf(']]>', indexStartCDATA);
                    if (indexEndCDATA === -1) {
                        returnError = 'cdata, not found ...]]>'; // не закрыт CDATA. повторим попытку на след. write
                        return;
                    };

                    indexStartXML = indexEndCDATA + 3;

                    if (!stopEmit) {
                        onCDATA(xml.substring(indexStartCDATA, indexEndCDATA));
                        if (isParseStop) {
                            return;
                        };
                    };
                    continue;
                };


                // COMMENT
                // ---------------------------------------------
                if (w === 45 && xml.charCodeAt(i + 3) === 45) { // 45 == "-"
                    let indexStartComment = i + 4;
                    let indexEndComment = xml.indexOf('-->', indexStartComment);
                    if (indexEndComment === -1) {
                        returnError = 'expected -->'; // не закрыт комментарий. повторим попытку на след. write
                        return;
                    };

                    indexStartXML = indexEndComment + 3;

                    if (is_onComment && !stopEmit) {
                        let commentText = xml.substring(indexStartComment, indexEndComment);
                        onComment(isAutoEntity ? entityDecode(commentText) : commentText);
                        if (isParseStop) {
                            return;
                        };
                    };
                    continue;
                };

                // ATTENTION
                // ---------------------------------------------
                {
                    let indexStartAttention = i + 1;
                    let indexEndAttention = xml.indexOf('>', indexStartAttention);
                    if (indexEndAttention === -1) {
                        returnError = 'expected attention ...>'; // повторим попытку на след. write
                        return;
                    };

                    indexStartXML = indexEndAttention + 1;

                    if (is_onAttention && !stopEmit) {
                        onAttention(xml.substring(i, indexStartXML)); // весь тег, так как не придумал api
                        if (isParseStop) {
                            return;
                        };
                    };
                };

                continue;
            };

            // QUESTION
            // ---------------------------------------------
            if (w === 63) { // "?"
                let indexEndQuestion = xml.indexOf('?>', i);
                if (indexEndQuestion === -1) { // error
                    returnError = 'expected question ...?>'; // повторим попытку на след. write
                    return;
                };

                indexStartXML = indexEndQuestion + 2;

                if (is_onQuestion) {
                    onQuestion(xml.substring(i, indexStartXML)); // весь тег, так как не придумал api
                    if (isParseStop) {
                        return;
                    };
                };
                continue;
            };


            // NODE ELEMENT
            // ---------------------------------------------

            let indexEndNode = xml.indexOf('>', i + 1);
            if (indexEndNode === -1) { // error  ...> // не нашел знак закрытия тега
                returnError = 'unclosed tag'; // повторим попытку на след. write
                return;
            };


            indexStartXML = indexEndNode + 1;
            attrRes = true; // атрибутов нет

            if (w === 47) { // </...
                isTagStart = false;
                isTagEnd = true;

                // проверяем что тег должен быть закрыт тот-же что и открывался
                if (!parseStackNodes.length) {
                    returnError = 'close tag, requires open tag';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                nodeName = nodeBody = parseStackNodes.pop();
                iQ = i + 2 + nodeName.length;

                if (nodeName !== xml.substring(i + 2, iQ)) {
                    returnError = 'close tag, not equal to the open tag';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                // проверим что в закрываюшем теге нет лишнего
                for(; iQ < indexEndNode; iQ++) {
                    let w = xml.charCodeAt(iQ);
                    if (w === 32 || (w > 8 && w < 14)) {  // \f\n\r\t\v пробел
                        continue;
                    };

                    returnError = 'close tag, unallowable char';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

            } else {

                if (!(w > 96  && w < 123 || w > 64 && w < 91 || w === 95 || w === 58)) { // char 95"_" 58":"
                    returnError = 'first char <nodeName .../>';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                if (xml.charCodeAt(indexEndNode - 1) ===  47) { // .../>
                    nodeBody = xml.substring(i + 1, indexEndNode - 1);

                    isTagStart = true;
                    isTagEnd = true;

                } else {
                    nodeBody = xml.substring(i + 1, indexEndNode);

                    isTagStart = true;
                    isTagEnd = false;
                };

                nodeName = nodeBody;
                iQ = 1;

                for (let iY = nodeBody.length; iQ < iY; iQ++) {
                    let w = nodeBody.charCodeAt(iQ);

                    if (w > 96 && w < 123 || w > 64 && w < 91 || w > 47 && w < 59 || w === 45 || w === 46 || w === 95) {
                        continue; // символы имени тега только латиница
                    };

                    if (w === 32 || (w < 14 && w > 8)) { // \f\n\r\t\v пробел
                        nodeName = nodeBody.substring(0, iQ)
                        attrRes = null; // возможно есть атирибуты
                        break;
                    };

                    returnError = 'invalid nodeName';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                if (!isTagEnd) {
                    parseStackNodes.push(nodeName);
                };
            };


            if (isNamespace) {
                if (stopEmit) { // потомки неизвестного пространства имен
                    if (isTagEnd) {
                        if (!isTagStart) {
                            if (--stopIndexNS === 0) {
                                nsmatrix = parseStackMatrixNS.pop();
                            };
                        };

                    } else {
                        stopIndexNS += 1;
                    };
                    continue;
                };

                // добавляем в parseStackMatrixNS только если !isTagEnd, иначе сохраняем контекст пространств в переменной
                _nsmatrix = nsmatrix;
                if (!isTagEnd) {
                    parseStackMatrixNS.push(nsmatrix);
                };

                if (isTagStart && (attrRes === null)) {
                    if (hasSurmiseNS = nodeBody.indexOf('xmlns', iQ) !== -1) { // есть подозрение на xmlns
                        attrStartPos = iQ;
                        attrString = nodeBody;

                        getAttrs();
                        hasSurmiseNS = false;
                    };
                };

                iD = nodeName.indexOf(':');
                if (iD !== -1) {
                    xmlns = nsmatrix[nodeName.substring(0, iD)];
                    nodeName = nodeName.substr(iD + 1);

                } else {
                    xmlns = nsmatrix.xmlns;
                };


                if (!xmlns) {
                    // элемент неизвестного пространства имен
                    if (isTagEnd) {
                        nsmatrix = _nsmatrix; // так как тут всегда isTagStart
                    } else {
                        stopIndexNS = 1; // первый элемент для которого не определено пространство имен
                    };
                    continue;
                };

                nodeName = xmlns + ':' + nodeName;
            };

            stringNodePosStart = i; // stringNodePosStart, stringNodePosEnd - для ручного разбора getStringNode()
            stringNodePosEnd = indexStartXML;

            if (isTagStart) {
                attrStartPos = iQ;
                attrString = nodeBody;

                onStartNode(nodeName, getAttrs, isTagEnd, getStringNode);
                if (isParseStop) {
                    return;
                };
            };

            if (isTagEnd) {
                onEndNode(nodeName, isTagStart, getStringNode);
                if (isParseStop) {
                    return;
                };

                if (isNamespace) {
                    if (isTagStart) {
                        nsmatrix = _nsmatrix;
                    } else {
                        nsmatrix = parseStackMatrixNS.pop();
                    };
                };
            };
        };
    };
};


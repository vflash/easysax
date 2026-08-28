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

function NULL_FUNC() {};

function entity2char(x) {
    if (x === 'amp') {
        return '&';
    };

    switch(x.toLowerCase()) {
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
    var nn = {};
    for (var n in nsmatrix) {
        nn[n] = nsmatrix[n];
    };
    return nn;
};


function EasySAXParser(config) {
    if (!this) {
        return null;
    };

    var internEnabled = false;
    var internSalt = null;
    var internMap = null;

    var onTextNode = NULL_FUNC, onStartNode = NULL_FUNC, onEndNode = NULL_FUNC, onCDATA = NULL_FUNC, onError = NULL_FUNC, onComment, onQuestion, onAttention, onUnknownNS;
    var is_onComment = false, is_onQuestion = false, is_onAttention = false, is_onUnknownNS = false;

    var isAutoEntity = true; // делать "EntityDecode" всегда
    var indexStartXML = 0; // позиция на которой закончен разбор xml
    var entityDecode = xmlEntityDecode;
    var isNamespace = false;
    var returnError = '';
    var isParseStop = false; // прервать парсер
    var defaultNS = '';
    var nsmatrix = null;
    var useNS = null;
    var init = false;
    var xml_length = 0;
    var xml = ''; // string

    var stringNodePosStart = 0; // number. для получения исходной строки узла
    var stringNodePosEnd = 0; // number. для получения исходной строки узла
    var attrStartPos = 0; // number начало позиции атрибутов в строке attrString <(div^ class="xxxx" title="sssss")/>
    var attrString = ''; // строка атрибутов <(div class="xxxx" title="sssss")/>
    var attrRes = ''; // закешированный результат разбора атрибутов , null - разбор не проводился, object - хеш атрибутов, true - нет атрибутов, false - невалидный xml

    function reset() {
        if (isNamespace) {
            nsmatrix = {};
            nsmatrix.xmlns = defaultNS;
        };

        indexStartXML = 0;
        returnError = '';
        isParseStop = false;
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
        internEnabled = op.hash !== false;
        internSalt = typeof op.salt === 'number' ? op.salt : null;
        internMap = internEnabled ? op.map || new Map() : null;
    };

    this.on = function(name, cb) {
        if (cb && typeof cb !== 'function') {
            throw error('required args on(string, function||null)');
        };

        switch(name) {
            case 'startNode': case 'opentag': case 'openTag': onStartNode = cb || NULL_FUNC; break;
            case 'endNode': case 'closetag': case 'closeTag': onEndNode = cb || NULL_FUNC; break;
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
        xml_length = xml.length;

        parse();

        if (isParseStop && returnError) {
            if (returnError) {
                onError(returnError);
                returnError = '';
            };
        };

        if (indexStartXML > 0) {
            xml = indexStartXML >= xml_length ? '' : xml.slice(indexStartXML);
            indexStartXML = 0;
        };
    };

    this.end = function() {
        if (returnError) {
            onError(returnError);
        };

        returnError = '';
        attrString = '';
        init = false;
        xml_length = 0;
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
    } else {
        internEnabled = true;
        internMap = new Map();
    };

    // -----------------------------------------------------

    var nodeParseAttrResult = null; // null - кеш пустой, true - атрибутов нет, {...} - карта атрибутов
    var nodeParseAttrSize = 0; // число элементов nodeParseAttrName
    var nodeParseAttrName = ['', '', '', '', '', '', '', '', '', ''];
    var nodeParseAttrVStart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var nodeParseAttrVEnd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var nodeParseHasNS = false;
    var nodeParseName = ''; // имя ноды

    // разбор ноды <nodeName ...> или <nodeName .../>
    // на вход indexStart = xml.indexOf('<');
    // return xml.indexOf('>', ixNameStart);
    function parseNode(indexStart) {
        var ixNameStart = indexStart + 1; // позиция первого сивола имени
        var ixNameEnd = 0; // позиция последнего + 1 сивола имени
        var attrName = '';
        var attrHash = 0;
        var isBR = false;
        var iN = 0;
        var iE = 0;
        var iR = 0;

        var i = ixNameStart;
        var w = 0;

        if (i >= xml_length) {
            returnError = '#4952 invalid node'; // не полный xml
            return -1;
        };

        nodeParseAttrResult = null;
        nodeParseAttrSize = 0;
        nodeParseHasNS = false;

        w = xml.charCodeAt(i);

        if (!(w > 96  && w < 123 || w > 64 && w < 91 || w === 95 || w === 58)) { // char 95"_" 58":"
            returnError = '#4940 first char <nodeName .../>';
            isParseStop = true; // дальнейший разбор невозможен
            return -1;
        };

        while(true) {
            if (++i >= xml_length) {
                returnError = '#4950 invalid node'; // не полный xml
                return -1; // errorParse
            };

            w = xml.charCodeAt(i);

            if (w > 96 && w < 123 || w > 47 && w < 59 || w > 64 && w < 91 || w === 45 || w === 95 || w === 46) {
                continue; // символы имени тега только латиница
            };

            if (w === 62 /* ">" */) { // тег закрылся, атрибутов нет
                nodeParseName = xml.slice(ixNameStart, ixNameEnd = i);
                return i;
            };

            if (w === 32 || w === 9 || w === 10 || w === 12 || w === 13) { // \f\n\r\t\v пробел
                nodeParseName = xml.slice(ixNameStart, ixNameEnd = i);
                break;
            };

            if (w === 47 /* "/" */) {
                ixNameEnd = i;
                if (++i >= xml_length) {
                    returnError = '#2920 invalid node'; // не полный xml
                    return -1; // errorParse
                };

                w = xml.charCodeAt(i);

                if (w === 62 /* ">" */) {
                    nodeParseName = xml.slice(ixNameStart, ixNameEnd);
                    return i;
                };
                returnError = '#0320 invalid node .../>?';
                isParseStop = true; // дальнейший разбор невозможен
                return -1;
            };

            //continue;

            returnError = '#5347 invalid nodeName';
            isParseStop = true; // дальнейший разбор невозможен
            return -1;
        };

        while (true) {
            if (++i >= xml_length) {
                returnError = '#1400 invalid node'; // не полный xml
                return -1;
            }

            while (true) {
                w = xml.charCodeAt(i);
                if (w === 32 || w === 9 || w === 10 || w === 12 || w === 13) {
                    if (++i >= xml_length) {
                        returnError = '#2234 invalid node'; // не полный xml
                        return -1;
                    }
                    continue;
                };
                break;
            };

            if (w === 61) { // "="
                returnError = '#2230 invalid node';
                isParseStop = true; // дальнейший разбор невозможен
                return -1;
            };
            if (w === 47) { // "/"
                if (++i >= xml_length) {
                    returnError = '#2920 invalid node'; // не полный xml
                    return -1; // errorParse
                };
                w = xml.charCodeAt(i);
                if (w !== 62) {
                    returnError = '#2218 invalid node';
                    isParseStop = true; // дальнейший разбор невозможен
                    return -1;
                };
            };
            if (w === 62) { // ">"
                return i;
            };

            attrHash = 2166136261;
            isBR = false;
            iR = i;
            iN = i;

            if (internSalt != null) {
                attrHash = Math.imul(attrHash ^ internSalt, 16777619);
            };

            while (true) {
                attrHash = Math.imul(attrHash ^ w, 16777619);
                if (++iR >= xml_length) {
                    returnError = '#2233 invalid node'; // не полный xml
                    return -1;
                }
                w = xml.charCodeAt(iN = iR);

                if (w === 61) { // "="
                    break;
                };
                if (w === 47 || w === 62) { // "/" ">"
                    returnError = '#2219 invalid node';
                    isParseStop = true;
                    return -1;
                };
                while (w === 32 || w === 9 || w === 10 || w === 12 || w === 13) { // \f\n\r\t пробел
                    isBR = true;
                    if (++iR >= xml_length) {
                        returnError = '#2232 invalid node'; // не полный xml
                        return -1;
                    }
                    w = xml.charCodeAt(iR);
                };
                if (isBR) {
                    if (w !== 61) {
                        returnError = '#2231 invalid node';
                        isParseStop = true;
                        return -1;
                    };
                    break;
                };
            };

            if (internEnabled) {
                attrName = internMap.get(attrHash);
                if (attrName == null || attrName.length !== (iN - i)) {
                    internMap.set(attrHash, attrName = xml.slice(i, iN));
                };
            } else {
                attrName = xml.slice(i, iN);
            };

            if (isNamespace) {
                attrName = attrName;
                if (attrName === 'xmlns' || (attrName.charCodeAt(0) === 120 && attrName.slice(0, 6) === 'xmlns:')) {
                    nodeParseHasNS = true;
                };
            };

            do {
                w = xml.charCodeAt(++iR);
            } while (
                w === 32 || w === 9 || w === 10 || w === 12 || w === 13 // \f\n\r\t\v
            );

            if (iR >= xml_length) {
                returnError = '#2312 invalid node';
                return -1;
            }

            if (w === 34) { // '"'
                i = xml.indexOf('"', iR + 1);
            } else if (w === 39) {
                i = xml.indexOf('\'', iR + 1);
            } else {
                returnError = '#2311 invalid node';
                isParseStop = true;
                return -1;
            };

            if (i === -1) {
                returnError = '#5858 invalid node'; // не полный xml
                return -1;
            };

            nodeParseAttrVStart[nodeParseAttrSize] = iR + 1; // значение атрибута
            nodeParseAttrVEnd[nodeParseAttrSize] = i; // значение атрибута
            nodeParseAttrName[nodeParseAttrSize] = attrName; // имя атрибута
            nodeParseAttrSize++
        };

        return iE;
    };

    function upNSMATRIX() {
        var hasNewMatrix = false;
        var newalias = '';
        var alias = '';
        var value = '';
        var name = '';
        var j = 0;

        if (!nodeParseAttrSize) {
            return;
        };

        for (j = 0; j < nodeParseAttrSize; j += 1) {
            name = nodeParseAttrName[j];

            if (name !== 'xmlns') {
                if (name.charCodeAt(0) !== 120 || name.slice(0, 6) !== 'xmlns:') {
                    continue;
                };
                newalias = name.slice(6);
            } else {
                newalias = 'xmlns';
            };


            value = xml.slice(nodeParseAttrVStart[j], nodeParseAttrVEnd[j]);
            alias = useNS[entityDecode(value)];

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

                continue;
            };

            if (nsmatrix[newalias]) {
                if (!hasNewMatrix) {
                    nsmatrix = cloneMatrixNS(nsmatrix);
                    hasNewMatrix = true;
                };
                nsmatrix[newalias] = false;
            };
        };
    };

    function getAttrs() {
        if (nodeParseAttrResult !== null) {
            return nodeParseAttrResult;
        };

        if (nodeParseAttrSize === 0) {
            return nodeParseAttrResult = true;
        };

        var xmlnsAlias = '';
        var nsName = '';
        var iQ = 0;

        var attrs = {};
        var value = '';
        var prefx = '';
        var name = '';
        var has = false;
        var j = 0;


        if (isNamespace) {
            xmlnsAlias = nsmatrix.xmlns;
        };

        for (j = 0; j < nodeParseAttrSize; j += 1) {
            name = nodeParseAttrName[j];

            if (isNamespace) {
                iQ = name.indexOf(':');
                if (iQ !== -1) {
                    prefx = name.slice(0, iQ);
                    if (prefx === 'xmlns') {
                        continue;
                    };
                    nsName = nsmatrix[prefx];
                    if (!nsName) {
                        continue;
                    };
                    name = xmlnsAlias !== nsName ? nsName + name.slice(iQ) : name.slice(iQ + 1);
                } else {
                    if (name === 'xmlns') {
                        continue;
                    };
                };
            };

            value = xml.slice(nodeParseAttrVStart[j], nodeParseAttrVEnd[j]);
            if (isAutoEntity) {
                value = entityDecode(value);
            };

            if (name === '__proto__') {
                Object.defineProperty(target, name, {value, writable: true, enumerable: true, configurable: true});
            } else {
                attrs[name] = value;
            };

            has = true;
        };

        return nodeParseAttrResult = !has || attrs;
    };

    function getStringNode() { // вернет исходную строку узла
        return xml.slice(stringNodePosStart, stringNodePosEnd);
    };


    var parseStackMatrixNS = [];
    var parseStackNodes = [];
    var stopIndexNS = 0;


    function parse() {
        // разбор идет по элементам (тег, текст cdata, ...).
        // элемент должен быть целиком в памяти

        var _nsmatrix = null;
        var isTagStart = false;
        var isTagEnd = false;
        var stopEmit = false; // используется при разборе "namespace" . если встретился неизвестное пространство то события не генерируются
        var nodeName = '';
        var xmlns = '';
        var iU = 0;
        var iD = 0;
        var iQ = 0;
        var w = 0;
        var i = 0; // number

        returnError = ''; // сброс ошибки неудачного разбора

        while(indexStartXML < xml_length) {
            stopEmit = stopIndexNS > 0;

            // поиск начала тега
            if (xml.charCodeAt(indexStartXML) === 60) { // "<"
                i = indexStartXML;
            } else {
                i = xml.indexOf('<', indexStartXML);
                if (i === -1) { // узел не найден. повторим попытку на след. write
                    if (parseStackNodes.length) {
                        returnError = 'unexpected end parse';
                        return;
                    };
                    return;
                };
                if (indexStartXML !== i) { // все что до тега это текст
                    if (!stopEmit) {
                        onTextNode(isAutoEntity ? entityDecode(xml.slice(indexStartXML, i)) : xml.slice(indexStartXML, i));
                        if (isParseStop) {
                            return;
                        };
                    };
                    indexStartXML = i; // до этой позиции разбор завершен
                };
            };


            // ELEMENT
            // ---------------------------------------------

            if (i + 2 >= xml_length) {
                returnError = '#0318 invalid node'; // не полный xml
                return -1;
            };

            w = xml.charCodeAt(i + 1);

            if (w === 33) { // 33 == "!"
                if (i + 4 >= xml_length) {
                    returnError = '#0319 invalid node'; // не полный xml
                    return -1;
                };
                w = xml.charCodeAt(i + 2);

                // CDATA
                // ---------------------------------------------
                if (w === 91 && xml.slice(i + 3, i + 9) === 'CDATA[') { // 91 == "["
                    let indexStartCDATA = i + 9;
                    let indexEndCDATA = xml.indexOf(']]>', indexStartCDATA);
                    if (indexEndCDATA === -1) {
                        returnError = 'cdata, not found ...]]>'; // не закрыт CDATA. повторим попытку на след. write
                        return;
                    };

                    indexStartXML = indexEndCDATA + 3;

                    if (!stopEmit) {
                        onCDATA(xml.slice(indexStartCDATA, indexEndCDATA));
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
                        let commentText = xml.slice(indexStartComment, indexEndComment);
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
                        onAttention(xml.slice(i, indexStartXML)); // весь тег, так как не придумал api
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
                    onQuestion(xml.slice(i, indexStartXML)); // весь тег, так как не придумал api
                    if (isParseStop) {
                        return;
                    };
                };
                continue;
            };


            // NODE ELEMENT
            // ---------------------------------------------

            if (w === 47) { // </...
                // проверяем что тег должен быть закрыт тот-же что и открывался
                if (!parseStackNodes.length) {
                    returnError = 'close tag, requires open tag';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                nodeName = parseStackNodes.pop();
                iQ = i + 2 + nodeName.length;

                while(true) { // проверим что в закрываюшем теге нет лишнего
                    w = xml.charCodeAt(iQ);
                    if (w === 62) { // ">"
                        indexStartXML = iQ + 1;
                        break;
                    };
                    if (w === 32 || w === 9 || w === 10 || w === 12 || w === 13) { // \f\n\r\t\v
                        iQ += 1;
                        continue;
                    };
                    if (!w) {
                        parseStackNodes.push(nodeName);
                        returnError = 'unclosed tag'; // повторим попытку на след. write
                        return;
                    };
                    returnError = 'close tag, unallowable char';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                if (nodeName !== xml.slice(i + 2, i + 2 + nodeName.length)) {
                    returnError = 'close tag, not equal to the open tag';
                    isParseStop = true; // дальнейший разбор невозможен
                    return;
                };

                isTagStart = false;
                isTagEnd = true;

            } else {
                let indexEndNode = parseNode(i);
                if (indexEndNode === -1) { // error  ...> // не нашел знак закрытия тега
                    returnError = returnError || 'unclosed tag'; // повторим попытку на след. write
                    return;
                };

                isTagStart = true;
                isTagEnd = xml.charCodeAt(indexEndNode - 1) === 47;
                nodeName = nodeParseName;

                if (!isTagEnd) {
                    parseStackNodes.push(nodeName);
                };

                indexStartXML = indexEndNode + 1;
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

                if (isTagStart && nodeParseHasNS) {  // есть подозрение на xmlns //  && (nodeParseAttrResult === null)
                    upNSMATRIX();
                };

                iD = nodeName.indexOf(':');
                if (iD !== -1) {
                    xmlns = nsmatrix[nodeName.slice(0, iD)];
                    nodeName = nodeName.slice(iD + 1);

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


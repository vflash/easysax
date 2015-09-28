	/*
	new function() {
		var parser = new EasySAXParser();

		parser.ns('rss', { // or false
			rss: 'http://purl.org/rss/1.0/',
			atom: 'http://www.w3.org/2005/Atom',
			xhtml: 'http://www.w3.org/1999/xhtml',
			media: 'http://search.yahoo.com/mrss/'
		});


		parser.on('error', function(msg) {
			//console.log(msg)
		});

		parser.on('startNode', function(elem, attr, uq, tagend, getStrNode) {
			attr();
			return;
			if (tagend) {
				console.log('   '+str)
			} else {
				console.log('+  '+str)
			};
		});

		parser.on('endNode', function(elem, uq, tagstart, str) {
			return;
			if (!tagstart) console.log('-  ' + str)
		});

		parser.on('textNode', function(s, uq) {
			uq(s);
			return
			console.log('   '+s)
		});

		parser.on('cdata', function(data) {
		});


		parser.on('comment', function(text) {
			//console.log('--'+text+'--')
		});

		//parser.on('question', function() {}); // <? ... ?>
		//parser.on('attention', function() {}); // <!XXXXX zzzz="eeee">

		console.time('easysax');
		for(var z=1000;z--;) {
			parser.parse(xml)
		};
		console.timeEnd('easysax');
	};




	*/

// << ------------------------------------------------------------------------ >> //






if (typeof exports === 'object' && this == exports) {
	module.exports = EasySAXParser;
};

function EasySAXParser() {
	'use strict';

	if (!this) return null;

	var
	    TYPE_NEED_MORE_STRING = 0,
		TYPE_ERROR = 1,
		TYPE_START_NODE = 2,
		TYPE_END_NODE = 3,
		TYPE_TEXT_NODE = 4,
		TYPE_CDATA_NODE = 5,
		TYPE_COMMENT = 6,
		TYPE_QUESTION = 7,
		TYPE_ATTENTION = 8,
		TYPE_END = 9; // end of xml and no more can be added
		TYPE_STOP_PARSING = 10; // stop ask by user

	function nullFunc() {};

	var onTextNode = nullFunc, onStartNode = nullFunc, onEndNode = nullFunc, onCDATA = nullFunc, onError = nullFunc, onComment, onQuestion, onAttention;
	var is_onComment, is_onQuestion, is_onAttention;

	var state = {
		u: null,
		xml: "",
		nodestack: [],
		stacknsmatrix: [],
		//, string_node
		elem: null,
		tagend: false,
		tagstart: false,
		j: 0, i: 0,
		x: null, y: null, q: null,
		xmlns: null,
		stopIndex: 0,
		stop: null, // используется при разборе "namespace" . если встретился неизвестное пространство то события не генерируются
		_nsmatrix: null,
		closed: false, // no more xml can be added
		end: false // parse finished
	};


	var isNamespace = false, useNS , default_xmlns, xmlns
	, nsmatrix = {xmlns: xmlns}
	, hasSurmiseNS = false
	;


	this.on = function(name, cb) {
		if (typeof cb !== 'function') {
			if (cb !== null) return;
		};

		switch(name) {
			case 'error': onError = cb || nullFunc; break;
			case 'startNode': onStartNode = cb || nullFunc; break;
			case 'endNode': onEndNode = cb || nullFunc; break;
			case 'textNode': onTextNode = cb || nullFunc; break;
			case 'cdata': onCDATA = cb || nullFunc; break;

			case 'comment': onComment = cb; is_onComment = !!cb; break;
			case 'question': onQuestion = cb; is_onQuestion = !!cb; break; // <? ....  ?>
			case 'attention': onAttention = cb; is_onAttention = !!cb; break; // <!XXXXX zzzz="eeee">

		};
	};

	this.ns = function(root, ns) {
		if (!root || typeof root !== 'string' || !ns) {
			return;
		};

		var u, x = {}, ok, v, i;

		for(i in ns) {
			v = ns[i];
			if (typeof v === 'string') {
				if (root === v) ok = true;
				x[i] = v;
			};
		};

		if (ok) {
			isNamespace = true;
			default_xmlns = root;
			useNS = x;
		};
	};

	this.parse = function(xml) {
		if (state.end) {
			onError("Closed");
			return;
		}
		if (xml && typeof xml !== 'string') {
			return;
		};

		if (xml) {
			if (state.xml) {
				state.xml = state.xml.substring(state.i) + String(xml);
				state.j = state.j - state.i;
				state.i = 0;
			} else {
				state.xml = String(xml);
			}
		}

		if (isNamespace && !state.nsmatrix) {
			state.nsmatrix = {xmlns: default_xmlns};

			parse(state);

			state.nsmatrix = false;

		} else {
			parse(state);
		};

		attr_res = true;
	};

	this.close = function(xml) {
		state.closed = true;
		parse(xml);
	}

	// -----------------------------------------------------

	var xharsQuot={constructor: false, hasOwnProperty: false, isPrototypeOf: false, propertyIsEnumerable: false, toLocaleString: false, toString: false, valueOf: false
		, quot: '"'
		, QUOT: '"'
		, amp: '&'
		, AMP: '&'
		, nbsp: '\u00A0'
		, apos: '\''
		, lt: '<'
		, LT: '<'
		, gt: '>'
		, GT: '>'
		, copy: '\u00A9'
		, laquo: '\u00AB'
		, raquo: '\u00BB'
		, reg: '\u00AE'
		, deg: '\u00B0'
		, plusmn: '\u00B1'
		, sup2: '\u00B2'
		, sup3: '\u00B3'
		, micro: '\u00B5'
		, para: '\u00B6'
	};


	function rpEntities(s, d, x, z) {
		if (z) {
			return xharsQuot[z] || '\x01';
		};

		if (d) {
			return String.fromCharCode(d);
		};

		return String.fromCharCode(parseInt(x, 16));
	};

	function unEntities(s, i) {
		s = String(s);
		if (s.length > 3 && s.indexOf('&') !== -1) {
			if (s.indexOf('&gt;') !== -1) s = s.replace(/&gt;/g, '>');
			if (s.indexOf('&lt;') !== -1) s = s.replace(/&lt;/g, '<');
			if (s.indexOf('&quot;') !== -1) s = s.replace(/&quot;/g, '"');

			if (s.indexOf('&') !== -1) {
				s = s.replace(/&#(\d+);|&#x([0123456789abcdef]+);|&(\w+);/ig, rpEntities);
			};
		};

		return s;
	};

	var attr_string = ''; // строка атрибутов
	var attr_posstart = 0; //
	var attr_res; // закешированный результат разбора атрибутов , null - разбор не проводился, object - хеш атрибутов, true - нет атрибутов, false - невалидный xml

	/*
		парсит атрибуты по требованию. Важно! - функция не генерирует исключения.

		если была ошибка разбора возврашается false
		если атрибутов нет и разбор удачен то возврашается true
		если есть атрибуты то возврашается обьект(хеш)
	*/

	var RGX_ATTR_NAME = /[^\w:-]+/g;

	function getAttrs() {
		if (attr_res !== null) {
			return attr_res;
		};

		/*
		if (xxtest !== u && attr_string.indexOf(xxtest) === -1) {
			/ *
				// для ускорения
				if (getAttrs('html').type == 'html') {
					...
				};
			* /
			return true;
		};
		*/

		var u
		, res = {}
		, s = attr_string
		, i = attr_posstart
		, l = s.length
		, attr_list = hasSurmiseNS ? [] : false
		, name, value = ''
		, ok = false
		, j, w, nn, n
		, hasNewMatrix
		, alias, newalias
		;


		aa:
		for(; i < l; i++) {
			w = s.charCodeAt(i);

			if (w===32 || (w<14 && w > 8) ) { // \f\n\r\t\v
				continue
			};

			if (w < 65 || w >122 || (w>90 && w<97) ) { // ожидаем символ
				//console.log('error attr 1')
				return attr_res = false; // error. invalid char
			};

			for(j = i + 1; j < l; j++) { // проверяем все символы имени атрибута
				w = s.charCodeAt(j);

				if ( w>96 && w < 123 || w>64 && w< 91 || w > 47 && w < 59 || w === 45 || w === 95) {
					continue;
				};


				if (w !== 61) { // "=" == 61
					//console.log('error 2');
					return attr_res = false; // error. invalid char
				};

				break;
			};

			name = s.substring(i, j);
			ok = true;

			if (name === 'xmlns:xmlns') {
				//console.log('error 6')
				return attr_res = false; // error. invalid name
			};

			w = s.charCodeAt(j+1);

			if (w === 34) {  // '"'
				j = s.indexOf('"', i = j+2 );

			} else {
				if (w === 39) {
					j = s.indexOf('\'', i = j+2 );

				} else {  // "'"
					//console.log('error 3')
					return attr_res = false; // error. invalid char
				};
			};

			if (j === -1) {
				//console.log('error 4')
				return attr_res = false; // error. invalid char
			};


			if (j+1 < l) {
				w = s.charCodeAt(j+1);

				if (w > 32 || w < 9 || (w<32 && w>13)) {
					// error. invalid char
					//console.log('error 5')
					return attr_res = false;
				};
			};


			value = s.substring(i, j);
			i = j + 1; // след. семвол уже проверен потому проверять нужно следуюший

			if (isNamespace) { //
				if (hasSurmiseNS) {
					// есть подозрение что в атрибутах присутствует xmlns

					if (newalias = name === 'xmlns' ? 'xmlns' : name.charCodeAt(0) === 120 && name.substr(0, 6) === 'xmlns:' && name.substr(6) ) {
						alias = useNS[unEntities(value)];

						if (alias) {
							if (state.nsmatrix[newalias] !== alias) {
								if (!hasNewMatrix) {
									hasNewMatrix = true;
									nn = {}; for (n in state.nsmatrix) nn[n] = state.nsmatrix[n];
									state.nsmatrix = nn;
								};

								state.nsmatrix[newalias] = alias;
							};
						} else {
							if (state.nsmatrix[newalias]) {
								if (!hasNewMatrix) {
									hasNewMatrix = true;
									nn = {}; for (n in state.nsmatrix) nn[n] = state.nsmatrix[n];
									state.nsmatrix = nn;
								};

								state.nsmatrix[newalias] = false;
							};
						};

						res[name] = value;
						continue;
					};

					attr_list.push(name, value);
					continue;
				};

				w = name.length;
				while(--w) {
					if (name.charCodeAt(w) === 58) { // ':'
						if (w = state.nsmatrix[name.substring(0, w)] ) {
							res[w + name.substr(w)] = value;
						};
						continue aa;

						// 'xml:base' ???
					};
				};
			};

			res[name] = value;
		};


		if (!ok) {
			return attr_res = true;  // атрибутов нет, ошибок тоже нет
		};


		if (hasSurmiseNS)  {
			bb:

			for (i = 0, l = attr_list.length; i < l; i++) {
				name = attr_list[i++];

				w = name.length;
				while(--w) { // name.indexOf(':')
					if (name.charCodeAt(w) === 58) { // ':'
						if (w = state.nsmatrix[name.substring(0, w)]) {
							res[w + name.substr(w)] = attr_list[i];
						};
						continue bb;
						break;
					};
				};

				res[name] = attr_list[i];
			};
		};

		return attr_res = res;
	};

	function _getNextTag(state) {
		var u
		, xml = state.xml
		, i = state.i, j = state.j
		, nodestack = state.nodestack
		, stacknsmatrix = state.stacknsmatrix
		//, string_node
		, elem
		, x, y, q, w
		, xmlns
		, stopIndex = state.stopIndex
		, stop = stopIndex > 0
		, _nsmatrix
		, ok
		, closed = state.closed
		;

		var result = {
			type: TYPE_NEED_MORE_STRING,
			tagend: false,
			tagstart: false
		};

		if (xml.charCodeAt(j) === 60) { // "<"
			i = j;
		} else {
			i = xml.indexOf('<', j);
		};

		if (i === -1) { // конец разбора

			if (nodestack.length) {
				if (closed) {
					onError('end file');
					result.type = TYPE_ERROR;
				}
			} else if (closed) {
				result.type = TYPE_END;
			}

			return result;
		};

		if (j !== i && !stop) {
			result.j = i;
			result.i = i;
			ok = onTextNode(xml.substring(j, i), unEntities);
			if (ok === false)  {
				result.type = TYPE_STOP_PARSING;
				return result;
			}
		};

		w = xml.charCodeAt(i+1);

		if (w === 33) { // "!"
			w = xml.charCodeAt(i+2);
			if (w === 91 && xml.substr(i+3, 6) === 'CDATA[') { // 91 == "["
				j = xml.indexOf(']]>', i);
				if (j === -1) {
					if (closed) {
						onError('cdata');
						result.type = TYPE_ERROR;
					}
					return result;
				}

				//x = xml.substring(i+9, j);
				if (!stop) {
					ok = onCDATA(xml.substring(i+9, j), false);
					if (ok === false) {
						result.type = TYPE_STOP_PARSING;
						return result;
					}
				};


				j += 3;

				result.type = TYPE_CDATA_NODE;
				result.i = i;
				result.j = j;
				return result;
			};


			if (w === 45 && xml.charCodeAt(i+3) === 45) { // 45 == "-"
				j = xml.indexOf('-->', i);
				if (j === -1) {
					if (closed) {
						onError('expected -->');
						result.type = TYPE_ERROR;
					}
					return result;
				};


				if (is_onComment && !stop) {
					ok = onComment(xml.substring(i+4, j), unEntities);
					if (ok === false) {
						result.type = TYPE_STOP_PARSING;
						return result;
					};
				};

				j += 3;

				result.type = TYPE_COMMENT;
				result.i = i;
				result.j = j;
				return result;
			};

			j = xml.indexOf('>', i+1);
			if (j === -1) {
				if (closed) {
					onError('expected ">"');
					result.type = TYPE_ERROR;
				}
				return result;
			};

			if (is_onAttention && !stop) {
				ok = onAttention(xml.substring(i, j+1), unEntities);
				if (ok === false) {
					result.type = TYPE_STOP_PARSING;
					return result;
				};
			};

			j += 1;
			result.type = TYPE_ATTENTION;
			result.i = i;
			result.j = j;
			return result;
		} else {
			if (w === 63) { // "?"
				j = xml.indexOf('?>', i);
				if (j === -1) { // error
					if (closed) {
						onError('...?>');
						result.type = TYPE_ERROR;
					}
					return result;
				};

				if (is_onQuestion) {
					ok = onQuestion(xml.substring(i, j+2));
					if (ok === false) {
						result.type = TYPE_STOP_PARSING;
						return result;
					};
				};

				j += 2;

				result.type = TYPE_QUESTION;
				result.i = i;
				result.j = j;
				return result;
			};
		};

		j = xml.indexOf('>', i+1);

		if (j == -1) { // error
			if (closed) {
				onError('...>');
				result.type = TYPE_ERROR;
			}
			return result;
		};

		result.attr_res = true; // атрибутов нет

		//if (xml.charCodeAt(i+1) === 47) { // </...
		if (w === 47) { // </...
			result.tagstart = false;
			result.tagend = true;

			// проверяем что должен быть закрыт тотже тег что и открывался
			x = elem = nodestack.pop();
			q = i + 2 + x.length;

			//console.log()
			if (xml.substring(i+2, q) !== x) {
				if (closed) {
					onError('close tagname');
					result.type = TYPE_ERROR;
				}
				return result;
			};

			// проверим что в закрываюшем теге нет лишнего
			for(; q < j; q++) {
				w = xml.charCodeAt(q);

				if (w===32 || (w > 8 && w<14) ) {  // \f\n\r\t\v space
					result.type = TYPE_END_NODE;
					result.name = elem;
					result.i = i;
					result.j = j;
					return result;
				};

				if (closed) {
					onError('close tag');
					result.type = TYPE_ERROR;
				}
				return result;
			};

		} else {
			if (xml.charCodeAt(j-1) ===  47) { // .../>
				x = elem = xml.substring(i+1, j-1);

				result.tagstart = true;
				result.tagend = true;
			} else {
				x = elem = xml.substring(i+1, j);

				result.tagstart = true;
				result.tagend = false;
			};

			if ( !(w > 96  && w < 123 || w > 64 && w <91) ) {
				onError('first char nodeName');
				result.type = TYPE_ERROR;
				return result;
			};

			for(q = 1, y = x.length; q < y; q++) {
				w = x.charCodeAt(q);

				if ( w>96 && w < 123 || w>64 && w< 91 || w > 47 && w < 59 || w === 45 || w === 95) {
					continue;
				};

				if (w===32 || (w<14 && w > 8)) { // \f\n\r\t\v пробел
					elem = x.substring(0, q)
					result.attr_res = null; // возможно есть атирибуты
					break;
				};

				onError('invalid nodeName');
				result.type = TYPE_ERROR;
				return result;
			};

			if (!result.tagend) {
				nodestack.push(elem);
			};

			result.type = TYPE_START_NODE;
			result.name = elem;
			result.tagAndAttrs = x;
			result.attrsPos = q;
			result.i = i;
			result.j = j;
			return result;
		};

	}

	// xml - string
	function parse(state) {
		var u
		, xml = state.xml
		, nodestack = state.nodestack
		, stacknsmatrix = state.stacknsmatrix
		//, string_node
		, elem
		, tagend = false
		, tagstart = false
		, x, y, q, w
		, xmlns
		, stopIndex = state.stopIndex
		, stop
		, _nsmatrix
		, ok
		, closed = state.closed
		, node
		;

		function getStringNode() {
			return xml.substring(state.i, state.j + 1)
		};

		while(state.j !== -1) {
			stop = state.stopIndex > 0;

			node = _getNextTag(state);
			switch (node.type) {
				case TYPE_NEED_MORE_STRING:
				    return;
				case TYPE_ERROR:
				case TYPE_STOP_PARSING:
				case TYPE_END:
				    state.end = true;
					return;
				default:
					state.i = node.i;
					state.j = node.j;
					elem = node.name;
					tagend = node.tagend;
					tagstart = node.tagstart;
					x = node.tagAndAttrs;
					q = node.attrsPos;
			}

			if (isNamespace) {
				if (stop) {
					if (tagend) {
						if (!tagstart) {
							if (--state.stopIndex === 0) {
								state.nsmatrix = stacknsmatrix.pop();
							};
						};

					} else {
						state.stopIndex += 1;
					};


					state.j += 1;
					continue;
				};

				_nsmatrix = state.nsmatrix;

				if (!tagend) {
					stacknsmatrix.push(state.nsmatrix);

					if (attr_res !== true) {
						if (hasSurmiseNS = x.indexOf('xmlns', q) !== -1) {
							attr_string = x;
							attr_posstart = q;

							getAttrs();

							hasSurmiseNS = false;
						};
					};
				};


				w = elem.indexOf(':');
				if (w !== -1) {
					xmlns = state.nsmatrix[elem.substring(0, w)];
					elem = elem.substr(w+1);


				} else {
					xmlns = state.nsmatrix.xmlns;
				};


				if (!xmlns) {
					if (tagend) {
						if (tagstart) {
							state.nsmatrix = _nsmatrix;
						} else {
							state.nsmatrix = stacknsmatrix.pop();
						};
					} else {
						state.stopIndex = 1; // первый элемент для которого не определено пространство имен
						attr_res = true;
					};

					state.j += 1;
					continue;
				};

				elem = xmlns + ':' + elem;
			};

			//string_node = xml.substring(i, j+1); // текст ноды как есть


			if (tagstart) { // is_onStartNode
				attr_string = x;
				attr_posstart = q;

				ok = onStartNode(elem, getAttrs, unEntities, tagend
					, getStringNode
				);

				if (ok === false) {
					return;
				};

				attr_res = true;
			};

			if (tagend) {
				ok = onEndNode(elem, unEntities, tagstart
					, getStringNode
				);

				if (ok === false) {
					return;
				};

				if (isNamespace) {
					if (tagstart) {
						state.nsmatrix = _nsmatrix;
					} else {
						state.nsmatrix = stacknsmatrix.pop();
					};
				};
			};

			state.j += 1;
		};
	};
};

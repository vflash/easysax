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

		parser.on('startNode', function(elem, attr, uq, str, tagend) {
			attr();
			return;
			if (tagend) {
				console.log('   '+str)
			} else {
				console.log('+  '+str)
			};
		});

		parser.on('endNode', function(elem, uq, str, tagstart) {
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














function EasySAXParser(strict) {
	'use strict';

	if (!this) return null;

	function nullFunc() {};

	var is_strict = false; // более строгий контройль ошибок
	var onTextNode = nullFunc, onStartNode = nullFunc, onEndNode = nullFunc, onCDATA = nullFunc, onComment, onError, onQuestion, onAttention;
	var is_onError, is_onComment, is_onQuestion, is_onAttention;

	
	var isNamespace = false, useNS , default_xmlns, xmlns
	, nsmatrix = {xmlns: xmlns}
	, hasSurmiseNS = false
	;

	this.on = function(name, cb) {
		if (typeof cb !== 'function') {
			if (cb !== null) return;
		};

		switch(name) {
			case 'error': onError = cb; is_onError = !!cb; break;
			case 'startNode': onStartNode = cb; break;
			case 'endNode': onEndNode = cb; break;
			case 'textNode': onTextNode = cb; break;
			case 'cdata': onCDATA = cb; break;

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
		if (typeof xml !== 'string') {
			return;
		};

		if (isNamespace) {
			nsmatrix = {xmlns: default_xmlns};

			parse(xml);
			
			nsmatrix = false;

		} else {
			parse(xml);
		};

		attr_res = null;
	};

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

	var attr_string; // = ''
	var attr_posstart; // = 0
	var attr_res;
	var attr_error = is_strict ?  null : false;


	function getAttrs() {
		if (attr_res != null) return attr_res;

		var u
		, res = {}
		, s = attr_string
		, i = attr_posstart
		, l = s.length
		, attr_list = hasSurmiseNS ? [] : false
		, name, value, ok
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

			if (w < 65 || w >122 || (w<97 && w>90) ) { // ожидаем символ
				// error. invalid char
				//console.log('error 1')
				return attr_res = attr_error;
			};

			ok = false;

			for(j = i + 1; j < l; j++) {
				w = s.charCodeAt(j);

				if ( w>96 && w < 123 || w > 47 && w < 59 || w>64 && w< 91 || w === 45) {
					continue;
				};

				if (w !== 61) { // "=" == 61
					// console.log('error 2');
					// error. invalid char
					return attr_res = attr_error;
				};
				
				name = s.substring(i, j);

				w = s.charCodeAt(j+1);
				if (w === 34) {  // '"'
					j = s.indexOf('"', i = j+2 );
				} else
				if (w === 39) {
					j = s.indexOf('\'', i = j+2 );
				} else {  // "'"
					// error. invalid char
					//console.log('error 2')
					return attr_res = attr_error;
				};

				if (j === -1) {
					// error. invalid char
					//console.log('error 3')
					return attr_res = attr_error;
				};


				if (j+1 < l) {
					w = s.charCodeAt(j+1);

					if (w > 32 || w < 9 || (w<32 && w>13)) {
						// error. invalid char
						//console.log('error 4')
						return attr_res = attr_error;
					};
				};


				value = s.substring(i, j);
				ok = true;

				i = j + 1; // след. семвол уже проверен потому проверять нужно следуюший
				break;
			};

			if (!ok || name === 'xmlns:xmlns') {
				// console.log('error 6')
				// error. invalid char
				return attr_res = attr_error;
			};


			if (isNamespace) { // 
				if (hasSurmiseNS) {
					//var alias, newalias = false;

					if (newalias = name === 'xmlns' ? 'xmlns' : name.charCodeAt(0) === 120 && name.substr(0, 6) === 'xmlns:' && name.substr(6) ) {
						alias = useNS[unEntities(value)];

						if (alias) {
							if (nsmatrix[newalias] !== alias) {
								if (!hasNewMatrix) {
									hasNewMatrix = true;
									nn = {}; for (n in nsmatrix) nn[n] = nsmatrix[n];
									nsmatrix = nn;
								};

								nsmatrix[newalias] = alias;
							};
						} else {
							if (nsmatrix[newalias]) {
								if (!hasNewMatrix) {
									hasNewMatrix = true;
									nn = {}; for (n in nsmatrix) nn[n] = nsmatrix[n];
									nsmatrix = nn;
								};

								nsmatrix[newalias] = false;
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
						if (w = nsmatrix[name.substring(0, w)] ) {
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
			return attr_res = false;
		};
		

		if (hasSurmiseNS)  {
			bb: 
			for (i = 0, l = attr_list.length; i < l; i++) {
				name = attr_list[i++];

				w = name.length;
				while(--w) { // name.indexOf(':')
					if (name.charCodeAt(w) === 58) { // ':'
						if (w = nsmatrix[name.substring(0, w)]) {
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
	
	function error(msg) {
		if (is_onError) {
			onError(msg);
		};
	};


	
	// xml - string
	function parse(xml) {
		var u
		, nodestack = []
		, stacknsmatrix = []
		, string_node
		, elem
		, tagend
		, tagstart
		, j = 0, i = 0
		, x, y, q, w
		, xmlns
		, stopIndex
		, stop
		, _nsmatrix
		, ok
		;

		while(j !== -1) {
			stop = stopIndex > 0;

			if (xml.charCodeAt(j) === 60) { // "<"
				i = j;
			} else {
				i = xml.indexOf('<', j);
			};

			if (i === -1) { // конец разбора
				//j = -1;
				if (is_strict) {
					// проверить что дальше нет символов
					// if (true) error(1)
				};

				if (nodestack.length) {
					error('end file');
					return;
				};

				return;
			};

			if (j !== i && !stop) {
				ok = onTextNode(xml.substring(j, i), unEntities);
				if (ok === false) return;
			};

			w = xml.charCodeAt(i+1);
			if (w === 33) { // "!"
				w = xml.charCodeAt(i+2);
				if (w === 91 && xml.substr(i+3, 6) === 'CDATA[') { // 91 == "["
					j = xml.indexOf(']]>', i);
					if (j === -1) {
						error('cdata');
						return;
					};
					
					//x = xml.substring(i+9, j);
					if (!stop) {
						ok = onCDATA(xml.substring(i+9, j), false);
						if (ok === false) return;
					};
					

					j += 3;
					continue;
				};
				

				if (w === 45 && xml.charCodeAt(i+3) === 45) { // 45 == "-"
					j = xml.indexOf('-->', i);
					if (j === -1) {
						error('expected -->');
						return;
					};


					if (is_onComment && !stop) {
						ok = onComment(xml.substring(i+4, j), unEntities);
						if (ok === false) return;
					};

					j += 3;
					continue;
				};

				j = xml.indexOf('>', i+1);
				if (j === -1) {
					error('expected ">"');
					return;
				};

				if (is_onAttention && !stop) {
					ok = onAttention(xml.substring(i, j+1), unEntities);
					if (ok === false) return;
				};

				j += 1;
				continue;

			} else 
			if (w === 63) { // "?"
				j = xml.indexOf('?>', i);
				if (j === -1) { // error
					error('...?>');
					return;
				};
				
				if (is_onQuestion) {
					ok = onQuestion(xml.substring(i, j+2));
					if (ok === false) return;
				};

				j += 2;
				continue;
			};

			j = xml.indexOf('>', i+1);
			
			if (j == -1) { // error 
				error('...>');
				return;
			};

			if (!stop) {
				string_node = xml.substring(i, j+1);
			};

			if (xml.charCodeAt(i+1) === 47) { // </...
				x = elem = xml.substring(i+2, j);
				w = x.charCodeAt(0);
				

				tagstart = false;
				tagend = true;
			} else 
			if (xml.charCodeAt(j-1) ===  47) { // .../>
				x = elem = xml.substring(i+1, j-1);

				tagstart = true;
				tagend = true;
			} else {
				x = elem = xml.substring(i+1, j);

				tagstart = true;
				tagend = false;
			};
			
			if ( !(w > 96  && w < 123 || w > 64 && w <91) ) {
				error('first char nodeName');
				return;
			};

			attr_res = false;
			for(q = 1, y = x.length; q < y; q++) {
				w = x.charCodeAt(q);
				
				if ( w>96 && w < 123 || w > 47 && w < 59 || w>64 && w< 91 || w ===45) {
					continue;
				};

				if (w===32 || (w<14 && w > 8)) { // \f\n\r\t\v пробел
					elem = x.substring(0, q)
					attr_res = null; // возможно есть атирибуты
					break;
				};

				error('invalid nodeName');
				return;
			};


			if (tagend) {
				if (!tagstart) {
					if (nodestack.pop() !== elem) {
						error('close tag');
						return;
					};
				};
				
			} else {
				nodestack.push(elem);
			};
			


			if (isNamespace) {
				if (stop) {
					if (tagend) {
						if (!tagstart) {
							if (--stopIndex === 0) {
								nsmatrix = stacknsmatrix.pop();
							};
						};

					} else {
						stopIndex += 1;
					};


					j += 1;
					continue;
				};

				_nsmatrix = nsmatrix;

				if (!tagend) {
					stacknsmatrix.push(nsmatrix);
					
					if (attr_res !== false) {
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
					xmlns = nsmatrix[elem.substring(0, w)];
					elem = elem.substr(w+1);
					
					
				} else {
					xmlns = nsmatrix.xmlns;
				};

				
				if (!xmlns) {
					if (tagend) {
						if (tagstart) {
							nsmatrix = _nsmatrix;
						} else {
							nsmatrix = stacknsmatrix.pop();
						};
					} else {
						stopIndex = 1;
						attr_res = null;
					};

					j += 1;
					continue;
				};

				elem = xmlns + ':' + elem;
			};

			if (tagstart) { // is_onStartNode
				attr_string = x;
				attr_posstart = q;

				ok = onStartNode(elem, getAttrs, unEntities, string_node, tagend);
				if (ok === false) return;

				attr_res = null;
			};

			
			if (tagend) {
				ok = onEndNode(elem, unEntities, string_node, tagstart); //, unEntities
				if (ok === false) return;

				if (isNamespace) {
					if (tagstart) {
						nsmatrix = _nsmatrix;
					} else {
						nsmatrix = stacknsmatrix.pop();
					};
				};
			};

			j += 1;
		}; 
	};
};


if (typeof exports === 'object' && this == exports) {
	module.exports = EasySAXParser;
};




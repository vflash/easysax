var EasySax = require("../easysax.js");

var atomParser = new function() {
	var u
	, unids = {}
	, context // = 'root'

	, cnxStack // = []
	, unidstack // = []
	, unidnext // = 0

	, text
	, xhtml 
	, item
	, items
	, feed
	;


	function reset() { // сброс значений
		var _feed = feed;
		text = '';
		xhtml = '';
		items = [];
		item = {};
		feed = {items: items};
		

		unids = {};
		cnxStack = [];
		unidstack = [];
		unidnext = 0;

		context = 'root';

		return _feed;
	};

	reset();


	function onError(msg) {
		//console.log('errro: ' + msg);
	};

	function onTextNode(x, uq) {
		switch(context) {
			case 'TEXT':
				text += uq(x);
				break;

			case 'XHTML':
				xhtml += x;
				break;
		};
	};

	function onCDATA(x) {
		switch(context) {
			case 'TEXT':
				text += x;
				break;

			case 'XHTML':
				xhtml += '<![CDATA[' + x + ']]>';
				break;
		};
	};

	function onStartNode(elem, attr, uq, str, tagend){
		var unid = unidnext++, v;
		//var attrs = attr();  // --all

		unidstack.push(unid);
		cnxStack.push(context);

		if (context === 'XHTML') {
			if (elem === 'xhtml:script') {
				context = null;
				return;
			};

			xhtml += str;
			return;
		};


		if (!context || context === 'TEXT') return;
		


		switch(context) {
			//case 'TEXT': return;

			case 'root':
				if (elem === 'atom:feed') {
					unids.root = unid;
					return;
				};


				if (elem === 'atom:title') {
					context = 'TEXT';
					unids.rootTitle = unid;
					return;
				};
				
				if (elem === 'atom:link' && attr().type == 'text/html') {
					v = attr();
					if (v.type === 'text/html' || (!v.type && !feed.link) ) {
						feed.link = String(v.href).trim();
					};

					context = null;
					return;
				};

				if (elem === 'atom:entry') {
					unids.item = unid;
					context = 'item';
					return;
				};
				break;

			case 'item':
				if (elem === 'atom:title') {
					unids.itemTitle = unid;
					context = 'TEXT';
					return;
				};
				

				if (elem === 'atom:link') {
					v = attr();
					if (v.type === 'text/html' || (!v.type && !item.link)) {
						item.link = String(v.href).trim();
					};

					context = null;
					return;
				};


				if (elem === 'atom:content' && attr().type == 'xhtml') {
					unids.itemDescriptionXHTML = unid;
					context = 'XHTML';	
					return;
				};

				if ((elem === 'atom:content' || elem === 'atom:summary') && attr().type == 'html') {
					context = 'TEXT';	
					unids.itemDescription = unid;
					return
				};

				if (elem === 'atom:summary' && (attr().type === 'text' || !attr().type) ) {
					context = 'TEXT';	
					unids.itemSummaryText = unid;
					return;
				};


				if (elem === 'atom:published') {
					unids.itemPublished = unid;
					context = 'TEXT';
					return;
					
				};

				if (elem === 'atom:id') {
					unids.itemID = unid;
					context = 'TEXT';
					return;
				};

				break;
		};
		

		context = null;
	};

	function html_entities(a) {return ecm[a]};

	function onEndNode(elem, uq, str, tagstart){

		var unid = unidstack.pop(unid), x;
		context = cnxStack.pop(context);
		//console.log(context)

		if (context === 'XHTML') {
			if (!tagstart) xhtml += str;
			return;
		};


		switch(unid) {
			case unids.root:
				break;

			case unids.rootTitle:
				feed.title = String(text).trim();
				text = '';
				break;


			case unids.item:
				if (item.guid) {
					feed.streamed = true;
				};

				items.push(item);
				item = {};
				break;

			case unids.itemTitle:
				item.title = String(text).trim();
				text = '';
				break;


			case unids.itemDescriptionXHTML:
				item.desc = String(xhtml).trim();
				xhtml = '';
				break;
			
			case unids.itemDescription:
				//item.desc = text.substring(0, 70);
				item.desc = String(text).trim();
				text = '';
				break;

			case unids.itemSummaryText:
				if (!item.desc) item.desc = String(text).trim().replace(/[&<>]/g, html_entities);
				text = '';
				break;

			case unids.itemPublished:
				x = +new Date(text);
				if (x != x) {
					x = +new Date();
				};

				item.utime = Math.floor(x/1000);

				text = '';
				break;
			
			case unids.itemID:
				item.guid = String(text).trim();
				text = '';
				break;
			
		};
	};

	var parser = new EasySax();

	parser.ns('atom', {
		'http://www.w3.org/2005/Atom': 'atom',
		//'http://search.yahoo.com/mrss/': 'media',
		'http://www.w3.org/1999/xhtml': 'xhtml'
	});

	parser.on('error', onError);
	parser.on('startNode', onStartNode);
	parser.on('endNode', onEndNode);
	parser.on('textNode', onTextNode);
	parser.on('cdata', onCDATA);


	function atomParser(xml) {
		parser.parse(xml);

		return reset();
	};
	
	return atomParser;
};


if (typeof exports === 'object' && this == exports) {
	module.exports = atomParser;
};

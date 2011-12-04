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
		var attrs = attr();

		unidstack.push(unid);
		cnxStack.push(context);

		if (context === 'XHTML') {
			if (elem === 'script') {
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
				if (elem === 'feed') {
					unids.root = unid;
					return;
				};


				if (elem === 'title') {
					context = 'TEXT';
					unids.rootTitle = unid;
					return;
				};
				
				if (elem === 'link' && attr().type == 'text/html') {
					feed.link = attr().href;
					context = null;
					return;
				};

				if (elem === 'entry') {
					unids.item = unid;
					context = 'item';
					return;
				};
				break;

			case 'item':
				if (elem === 'title') {
					unids.itemTitle = unid;
					context = 'TEXT';
					return;
				};
				
				if (elem === 'content' && attr().type == 'xhtml') {
					unids.itemDescriptionXHTML = unid;
					context = 'XHTML';	
					return;
				};

				if (elem === 'link' && attr().type == 'text/html') {
					item.link = attr().href;
					context = null;
					return;
				};
				

				if ((elem === 'content' || elem === 'summary') && attr().type == 'html') {
					context = 'TEXT';	
					unids.itemDescription = unid;
					return
				};

				if (elem === 'published') {
					unids.itemPublished = unid;
					context = 'TEXT';
					return;
					
				};
				
				if (elem === 'id') {
					unids.itemID = unid;
					context = 'TEXT';
					return;
				};

				break;
		};
		

		context = null;
	};

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
				feed.title = text;
				text = '';
				break;


			case unids.item:
				if (item.id) {
					items.push(item);
				};

				item = {};
				break;

			case unids.itemTitle:
				item.title = text;
				text = '';
				break;


			case unids.itemDescriptionXHTML:
				item.desc = xhtml;
				xhtml = '';
				break;
			
			case unids.itemDescription:
				item.desc = text.substring(0, 70);
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
				item.id = text;
				text = '';
				break;
			
		};
	};

	var parser = new EasySax();

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

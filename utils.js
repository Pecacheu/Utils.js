//This work is licensed under a GNU General Public License, v3.0. Visit http://gnu.org/licenses/gpl-3.0-standalone.html for details.
//Javscript Utils (version 8.05 Beta), functions by http://github.com/Pecacheu unless otherwise stated.

var utils = {};

//User-Agent-based Mobile device detection:
utils.mobile = ('orientation' in window || navigator.userAgent.match(/Mobi/i));

//It's useful for any canvas-style webpage to have the page dimensions on hand.
//Function by: http://w3schools.com/jsref/prop_win_innerheight.asp
utils.updateSize = function() {
	utils.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	utils.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

//Get predicted width of text given CSS font style.
utils.textWidth = function(text, font) {
	const canvas = window.textWidthCanvas || (window.textWidthCanvas = document.createElement('canvas')),
	context = canvas.getContext('2d'); context.font = font; return context.measureText(text).width;
}

//Add a getter/setter pair to an existing object:
utils.addProp = function(obj, name, getter, setter) {
	const t={}; if(getter) t.get=getter; if(setter) t.set=setter;
	Object.defineProperty(obj, name, t);
}

//Remove "empty" elements like 0, false, " ",
//undefined, and NaN from an array. Set 'keepZero'
//to true to keep elements that are set to '0'.
//Useful in combination with Array.split.
//Function by: Pecacheu & http://stackoverflow.com/users/5445/cms
Array.prototype.clean = function(keepZero) {
	for(let i=0,e,l=this.length; i<l; i++) {
		e=this[i]; if(utils.isBlank(e) || e === false ||
		!keepZero && e === 0) { this.splice(i,1); i--; l--; }
	} return this;
}

//Remove first instance of item from array. Returns false if not found.
Array.prototype.remove = function(item) {
	const ind = this.indexOf(item); if(ind == -1) return false;
	this.splice(ind,1); return true;
}

//No idea why this isn't built-in, but it's not.
Math.cot = function(x) {return 1/Math.tan(x)}

//Check if string, array, or other object is empty or not.
utils.isBlank = function(s) {
	if(s == null) return true;
	if(typeof s == 'string') return !/\S/.test(s);
	if(typeof s == 'object') {
		if(typeof s.length == 'number') return s.length === 0;
		return Object.keys(s).length === 0;
	}
	return false;
}

//Finds first empty (undefined) slot in array.
utils.firstEmpty = function(arr) {
	const len = arr.length;
	for(let i=0; i<len; i++) if(arr[i] == null) return i;
	return len;
}

//Like 'firstEmpty', but uses letters a-Z instead.
utils.firstEmptyChar = function(obj) {
	const keys = Object.keys(obj), len = keys.length;
	for(let i=0; i<len; i++) if(obj[keys[i]] == null) return keys[i];
	return utils.numToChar(len);
}

//Converts a number into letters (upper and lower) from a to Z.
utils.numToChar = function(num) {
	if(num<=25) return String.fromCharCode(num+97);
	else if(num>=26 && num<=51) return String.fromCharCode(num+39);
	let mVal, fVal;
	if(num<2756) { mVal=utils.rstCount(Math.floor(num/52)-1,52); fVal=utils.rstCount(num,52); }
	else if(num<143364) { mVal=utils.rstCount(Math.floor((num-52)/2704)-1,52); fVal=utils.rstCount(num-52,2704)+52; }
	else if(num<7454980) { mVal=utils.rstCount(Math.floor((num-2756)/140608)-1,52); fVal=utils.rstCount(num-2756,140608)+2756; }
	else return false; //More than "ZZZZ"? No. Just, no.
	return utils.numToChar(mVal)+utils.numToChar(fVal);
}

//Use this to reset your counter each time 'maxVal' is reached.
utils.rstCount = function(val, maxVal) { while(val >= maxVal) val -= maxVal; return val; }
//This alternate method doesn't always work due to inaccuracy of trig functions:
//function squareWave(x,p) {a=p/2; return Math.round(-(2*a/Math.PI)*Math.atan(utils.cot(x*Math.PI/p))+a)}

//Merges two (or more) objects,
//giving the last one precedence.
//Function by: https://gist.github.com/padolsey/272905
utils.merge = function(target, source /*, source2, ... */) {
	if(typeof target !== 'object') target = {};
	for(let property in source) {
		if(source.hasOwnProperty(property)) {
		let sourceProperty = source[property];
			if(typeof sourceProperty === 'object') {
				target[property] = utils.merge(target[property], sourceProperty);
				continue;
			}
			target[property] = sourceProperty;
		}
	}
	for(let a=2,l=arguments.length; a<l; a++) utils.merge(target, arguments[a]);
	return target;
}

//Returns 0 if a is negative, or a otherwise.
utils.pos = function(a) {
	if(a < 0) return 0; else return a;
}

//Keeps value within max/min bounds.
utils.bounds = function(val, min, max) {
	if(typeof val != 'number') return min;
	if(val>max) return max; if(val<min) return min; return val;
}

//Values in range lower to upper are translated to range from 0 to 1.
utils.section = function(input, lower, upper) {
	return (utils.range(input, lower, upper) - lower) / (upper - lower);
}

//"Normalizes" a value so that it ranges from low -> high,
//but unlike utils.range, this function retains input's offset.
//This can be used to easily clip angles, either RAD or DEG, to a certian range.
utils.normalize = function(val, min, max) {
	let cycle = Math.abs(max-min);
	if(val < min) while(val < min) val += cycle;
	else while(val >= max) val -= cycle;
	return val;
}

//Finds and removes all instances of 'remStr' string contained
//within 'inStr', and retuns the resulting string.
utils.cutStr = function(inStr, remStr) {
	let str = inStr, fnd; while((fnd=str.indexOf(remStr)) != -1) {
		str = str.slice(0, fnd)+str.slice(fnd+remStr.length);
	}
	return str;
}

//Polyfill for String.trim()
//Function by: http://www.w3schools.com/
if(!String.prototype.trim) String.prototype.trim = function(str) {
	if(str.trim) return str.trim(); return str.replace(/^\s+|\s+$/gm,'');
}

//Given CSS property value 'prop', returns object with
//space-seperated values from the property string.
utils.parseCSS = function(prop) {
	const pArr={}, pKey="", keyNum=0; prop=prop.trim();
	function parseInner(str) {
		if(str.indexOf(',') !== -1) {
			const arr = utils.clean(str.split(','));
			for(let i=0, l=arr.length; i<l; i++) arr[i]=arr[i].trim();
			return arr;
		}
		return str.trim();
	}
	while(prop.length > 0) {
		if(prop[0] == '(' && prop.indexOf(')') !== -1 && pKey) {
			let end=prop.indexOf(')'), pStr=prop.substring(1, end);
			pArr[pKey] = parseInner(pStr);
			pKey = ""; prop = prop.substring(end+1);
		} else if(prop.search(/[#!\w]/) == 0) {
			if(pKey) { pArr[keyNum] = pKey; keyNum++; }
			let end=prop.search(/[^#!\w-%]/); if(end==-1) end=prop.length;
			pKey = prop.substring(0, end); prop = prop.substring(end);
		} else {
			prop = prop.substring(1);
		}
	}
	if(pKey) pArr[keyNum] = pKey; return pArr;
}

//Rebuilds CSS string from a parseCSS object.
utils.buildCSS = function(propArr) {
	const keyArr=Object.keys(propArr), l=keyArr.length; let pStr='', i=0;
	while(i<l) { const k = keyArr[i], v = propArr[keyArr[i]]; i++;
	if(0<=Number(k)) pStr += v+" "; else pStr += k+"("+v+") "; }
	return pStr.substring(0, pStr.length-1);
}

//Create a CSS class and append it to the current document. Fill 'propList' object
//with keys and values repersenting the CSS properties you want to add to the class.
utils.addClass = function(className, propList) {
	let style, str=''; const keys = Object.keys(propList);
	if(document.styleSheets.length > 0) style = document.styleSheets[0]; else {
		style = document.createElement('style');
		style.appendChild(document.createTextNode(''));
		document.head.appendChild(style);
	}
	for(let i=0,l=keys.length; i<l; i++) str += keys[i]+":"+propList[keys[i]]+";";
	style.insertRule("."+className+"{"+str+"}", 1);
}

//Create a CSS selector and append it to the current document.
utils.addId = function(idName, propList) {
	let style, str=''; const keys = Object.keys(propList);
	if(document.styleSheets.length > 0) style = document.styleSheets[0]; else {
		style = document.createElement('style');
		style.appendChild(document.createTextNode(''));
		document.head.appendChild(style);
	}
	for(let i=0,l=keys.length; i<l; i++) str += keys[i]+":"+propList[keys[i]]+";";
	style.insertRule("#"+idName+"{"+str+"}", 1);
}

//Create a CSS keyframe and append it to the current document.
utils.addKeyframe = function(name, content) {
	let style; if(document.styleSheets.length > 0) style = document.styleSheets[0]; else {
		style = document.createElement('style');
		style.appendChild(document.createTextNode(''));
		document.head.appendChild(style);
	}
	style.insertRule("@keyframes "+name+"{"+content+"}", 1);
}

//Remove a CSS class from all stylesheets in the current document.
utils.removeClass = function(className) {
	for(let s=0,style,rList,j=document.styleSheets.length; s<j; s++) {
		style = document.styleSheets[s]; rList = style.rules;
		for(key in rList) if(rList[key].type == 1 && rList[key]
		.selectorText == "."+className) style.removeRule(key);
	} //rule.type #1 = CSSStyleRule
}

//Converts HEX color to RGB.
//Function by: https://github.com/Pecacheu and others
utils.hexToRgb = function(hex) {
	let raw = parseInt(hex.substr(1), 16);
	return [(raw >> 16) & 255, (raw >> 8) & 255, raw & 255];
}

//Generates a random interger somewhere between min and max.
utils.rand = function(min, max) { return Math.floor(Math.random() * (max-min+1) + min); }

//Convert a url query string into a JavaScript object:
//Function by: Pecacheu (From Pecacheu's Apache Test Server)
utils.fromQuery = function(string) {
	function parse(params, pairs) {
		const pair = pairs[0], spl = pair.indexOf('='),
		key = decodeURIComponent(pair.substr(0,spl)),
		value = decodeURIComponent(pair.substr(spl+1));
		//Handle multiple parameters of the same name:
		if(params[key] == null) params[key] = value;
		else if(typeof params[key] == 'array') params[key].push(value);
		else params[key] = [params[key],value];
		return pairs.length == 1 ? params : parse(params, pairs.slice(1));
	} return string.length == 0 ? {} : parse({}, string.split('&'));
}

//Convert an object into a url query string:
utils.toQuery = function(obj) {
	let str = ''; if(typeof obj != 'object') return encodeURIComponent(obj);
	for(let key in obj) {
		let val = obj[key]; if(typeof val == 'object') val = JSON.stringify(val);
		str += '&'+key+'='+encodeURIComponent(val);
	} return str.slice(1);
}

//Various methods of centering objects using JavaScript.
//obj: Object to center.
//only: 'x' for only x axis centering, 'y' for only y axis.
//type: 'calc', 'trans', 'move', or null for different centering methods.
utils.centerObj = function(obj, only, type) {
	if(!obj.style.position) obj.style.position = "absolute";
	if(type == 'calc') { //Efficient, but Only Responsive for Changes in Page Size:
		if(!only || only == "x") obj.style.left = "calc(50% - "+(obj.clientWidth/2)+"px)";
		if(!only || only == "y") obj.style.top = "calc(50% - "+(obj.clientHeight/2)+"px)";
	} else if(type == 'move') { //Original, Not Responsive:
		if(!only || only == "x") obj.style.left = (utils.width/2)-(obj.clientWidth/2)+"px";
		if(!only || only == "y") obj.style.top = (utils.height/2)-(obj.clientHeight/2)+"px";
	} else if(type == 'trans') { //More Efficient:
		let trans = utils.cutStr(obj.style.transform, "translateX(-50%)");
		trans = utils.cutStr(trans, "translateY(-50%)");
		if(!only || only == "x") { obj.style.left = "50%"; trans += "translateX(-50%)"; }
		if(!only || only == "y") { obj.style.top = "50%"; trans += "translateY(-50%)"; }
		if(trans) obj.style.transform = trans;
	} else { //Largest Browser Support for Responsive Centering:
		let cont = document.createElement("div"); obj.parentNode.appendChild(cont);
		cont.style.display = "table"; cont.style.position = "absolute"; cont.style.top = 0;
		cont.style.left = 0; cont.style.width = "100%"; cont.style.height = "100%";
		obj.parentNode.removeChild(obj); cont.appendChild(obj); obj.style.display = "table-cell";
		if(!only || only == "x") { obj.style.textAlign = "center"; }
		if(!only || only == "y") { obj.style.verticalAlign = "middle"; }
		obj.style.position = "relative";
	}
}

//Loads a file at the address via HTML object tag. Callback
//is fired with either recieved data, or 'false' if unsucessful.
utils.loadFile = function(path, callback, timeout) {
	const obj = document.createElement('object'); obj.data = path;
	obj.style.position = 'fixed'; obj.style.opacity = 0;
	let tmr = setTimeout(function() {
		document.body.removeChild(obj);
		tmr = null; callback(false);
	}, timeout||4000);
	obj.onload = function() {
		const data = obj.contentDocument.documentElement.outerHTML;
		if(tmr) clearTimeout(tmr); document.body.removeChild(obj);
		callback(data);
	}
	document.body.appendChild(obj);
}

//Loads a file at the address from a JSONP-enabled server. Callback
//is fired with either recieved data, or 'false' if unsucessful.
utils.loadJSONP = function(path, callback, timeout) {
	const script = document.createElement('script'), id = utils.firstEmptyChar(utils.lJSONCall);
	script.type = 'application/javascript'; script.src = path+'&callback=utils.lJSONCall.'+id;
	let tmr = setTimeout(function() { delete utils.lJSONCall[id]; callback(false); }, timeout||4000);
	utils.lJSONCall[id] = function(data) {
		if(tmr) clearTimeout(tmr); delete utils.lJSONCall[id]; callback(data);
	}
	document.head.appendChild(script); document.head.removeChild(script);
}; utils.lJSONCall = [];

//Loads a file and returns it's contents using HTTP GET.
//Callback parameters: (data, err)
//err: non-zero on error. Standard HTTP error codes.
//queryData: Optional, object of url querry data key/value pairs.
//contentType: Optional, sets content type header.
//Returns: false if AJAX not supported, true otherwise.
utils.loadAjax = function(path, callback, queryData, contentType) {
	//Obtain HTTP Object:
	let http; if(window.XMLHttpRequest) { //Chrome, Safari, Firefox, Edge:
		try {http = new XMLHttpRequest()} catch(e) {return e}
	} else if(window.ActiveXObject) { //IE6 and older:
		try {http = new ActiveXObject("Msxml2.XMLHTTP")} catch(e) {
		try {http = new ActiveXObject("Microsoft.XMLHTTP")} catch(e) {return e}}
	} else return false;
	//Open & Set HTTP Headers:
	http.open("GET", path, true);
	if(contentType) http.setRequestHeader("Content-type", contentType);
	http.onreadystatechange = function(event) { //Handle state change:
		if(event.target.readyState === XMLHttpRequest.DONE) {
			if(event.target.status == 200) callback(event.target.response, 0);
			else callback("", event.target.status);
		}
	}
	http.send(queryData?utils.toQuery(queryData):null); //Send Request
	return true;
}

//Converts from degrees to radians, so you can convert back for given stupid library.
//Function by: The a**hole who invented radians.
utils.rad = function(deg) { return deg * Math.PI / 180; }

//Converts from radians to degrees, so you can work in degrees.
//Function by: The a**hole who invented radians.
utils.deg = function(rad) { return rad * 180 / Math.PI; }

//I figued the following formula out on my own when I was like 5, so I'm very proud of it...

//Pecacheu's ultimate unit translation formula:
//This Version -- Bounds Checking: NO, Rounding: NO, Max/Min Switching: NO, Easing: YES
utils.mapValues = function(input, minIn, maxIn, minOut, maxOut, easeFunc) {
	if(!easeFunc) easeFunc = function(t) { return t; }
	return (easeFunc((input-minIn)/(maxIn-minIn))*(maxOut-minOut))+minOut;
}

//JavaScript Easing Library, CREATED BY: http://github.com/gre

/*Easing Functions - inspired from http://gizma.com/easing/
only considering the t value for the range [0,1] => [0,1]*/
Easing = {
	//no easing, no acceleration
	linear:function(t) { return t },
	//accelerating from zero velocity
	easeInQuad:function(t) { return t*t },
	//decelerating to zero velocity
	easeOutQuad:function(t) { return t*(2-t) },
	//acceleration until halfway, then deceleration
	easeInOutQuad:function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	//accelerating from zero velocity
	easeInCubic:function(t) { return t*t*t },
	//decelerating to zero velocity
	easeOutCubic:function(t) { return (--t)*t*t+1 },
	//acceleration until halfway, then deceleration
	easeInOutCubic:function(t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	//accelerating from zero velocity
	easeInQuart:function(t) { return t*t*t*t },
	//decelerating to zero velocity
	easeOutQuart:function(t) { return 1-(--t)*t*t*t },
	//acceleration until halfway, then deceleration
	easeInOutQuart:function(t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	//accelerating from zero velocity
	easeInQuint:function(t) { return t*t*t*t*t },
	//decelerating to zero velocity
	easeOutQuint:function(t) { return 1+(--t)*t*t*t*t },
	//acceleration until halfway, then deceleration
	easeInOutQuint:function(t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};
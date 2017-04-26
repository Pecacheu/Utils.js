//This work is licensed under a GNU General Public License, v3.0. Visit http://gnu.org/licenses/gpl-3.0-standalone.html for details.
//Javscript Utils (version 7.68), functions by http://github.com/Pecacheu unless otherwise stated.

var utils = {};

//Get predicted width of text given CSS font style.
utils.textWidth = function(text, font) {
	const canvas = window.textWidthCanvas || (window.textWidthCanvas = document.createElement('canvas')),
	context = canvas.getContext('2d'); context.font = font; return context.measureText(text).width;
}

//User-Agent-based Mobile device detection:
utils.mobile = ('orientation' in window || navigator.userAgent.match(/Mobi/i));

//Add a getter/setter pair to an existing object:
utils.addProp = function(obj, name, getter, setter) {
	const t={}; if(getter) t.get=getter; if(setter) t.set=setter;
	Object.defineProperty(obj, name, t);
}

//Remove empty/undefined elements from array.
//Useful in combination with Array.split.
//Function by: Pecacheu & Others.
Array.prototype.clean = function() {
	for(var i=0; i<this.length; i++) {
		if(!this[i] || (this[i].length && this[i]
		.length === 0)) { this.splice(i,1); i--; }
	}
	return this;
}

//Remove first instance of item from array. Returns false if not found.
Array.prototype.remove = function(item) {
	const ind = this.indexOf(item); if(ind == -1) return false;
	this.splice(ind,1); return true;
}

//Merges two (or more) objects,
//giving the last one precedence.
//Function by: https://gist.github.com/padolsey/272905
utils.merge = function(target, source /*, source2, ... */) {
	if(typeof target !== 'object') target = {};
	for(var property in source) {
		if(source.hasOwnProperty(property)) {
		var sourceProperty = source[property];
			if(typeof sourceProperty === 'object') {
				target[property] = utils.merge(target[property], sourceProperty);
				continue;
			}
			target[property] = sourceProperty;
		}
	}
	for(var a=2,l=arguments.length; a<l; a++) utils.merge(target, arguments[a]);
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
	var cycle = Math.abs(max-min);
	if(val < min) while(val < min) val += cycle;
	else while(val >= max) val -= cycle;
	return val;
}

//Finds and removes all instances of 'remStr' string contained
//within 'inStr', and retuns the resulting string.
utils.cutStr = function(inStr, remStr) {
	var str = inStr, fnd; while((fnd=str.indexOf(remStr)) != -1) {
		str = str.slice(0, fnd)+str.slice(fnd+remStr.length);
	}
	return str;
}

//Same as String.trim() function, but with better browser support.
//Function by: http://www.w3schools.com/
utils.trim = function(str) {
	if(str.trim) return str.trim();
	return str.replace(/^\s+|\s+$/gm,'');
}

//Same as String.indexOf(), but returns false when not found.
utils.indexOf = function(str, fStr) {
	if(typeof str != "string" || typeof fStr != "string") return false;
	var i = str.indexOf(fStr); if(i != -1) return i;
	return false;
}

//Given CSS property 'prop', returns object with
//space-seperated values from the property string.
utils.parseCSS = function(prop) {
	var pArr={}, pKey="", keyNum=0; prop=prop.trim();
	function parseInner(str) {
		if(utils.indexOf(str, ',')) {
			var arr = utils.clean(str.split(','));
			for(var i=0, l=arr.length; i<l; i++) arr[i]=arr[i].trim();
			return arr;
		}
		return str.trim();
	}
	while(prop.length > 0) {
		if(prop[0] == '(' && utils.indexOf(prop, ')') && pKey) {
			var end=utils.indexOf(prop, ')'), pStr=prop.substring(1, end);
			pArr[pKey] = parseInner(pStr);
			pKey = ""; prop = prop.substring(end+1);
		} else if(prop.search(/[#!\w]/) == 0) {
			if(pKey) { pArr[keyNum] = pKey; keyNum++; }
			var end=prop.search(/[^#!\w-%]/); if(end==-1) end=prop.length;
			pKey = prop.substring(0, end); prop = prop.substring(end);
		} else {
			prop = prop.substring(1);
		}
	}
	if(pKey) pArr[keyNum] = pKey; return pArr;
}

//Rebuilds CSS string from a parseCSS object.
utils.buildCSS = function(propArr) {
	var keyArr=Object.keys(propArr), pStr="", i=0, l=keyArr.length;
	while(i<l) { var k = keyArr[i], v = propArr[keyArr[i]]; i++;
	if(0<=Number(k)) pStr += v+" "; else pStr += k+"("+v+") "; }
	return pStr.substring(0, pStr.length-1);
}

//No idea why this isn't built-in, but it's not.
utils.cot = function(x) {return 1/Math.tan(x)}

//Remove "empty" elements like 0, false, "",
//undefined, and NaN from an array. Set 'keepZero'
//to true to keep elements that are set to '0' or 'false'.
//Function by: http://stackoverflow.com/users/5445/cms
utils.clean = function(arr, keepZero) {
	var newArr = [];
	for(var i=0, l=arr.length; i<l; i++) {
		if((keepZero && (arr[i] === 0 || arr[i] === false)) ||
		(arr[i] && !utils.isBlank(arr[i]))) newArr.push(arr[i]);
	} return newArr;
}

//Check if string is empty (contains only whitespace) or not.
utils.isBlank = function(str) { return typeof str == "string" && !/\S/.test(str); }

//Finds first empty (undefined) slot in array.
utils.firstEmpty = function(arr) {
	for(var i=0, l=arr.length; i<l; i++) {
		if(typeof arr[i] == "undefined") return i;
	} return arr.length;
}

//Like 'firstEmpty', but uses letters a-Z instead.
utils.firstEmptyChar = function(obj) {
	var keys=Object.keys(obj);
	for(var i=0, l=keys.length; i<l; i++) {
		if(typeof obj[keys[i]] == "undefined") return keys[i];
	} return utils.numToChar(keys.length);
}

//Converts a number into letters (upper and lower) from a to Z.
utils.numToChar = function(num) {
	if(num<=25) return String.fromCharCode(num+97);
	else if(num>=26 && num<=51) return String.fromCharCode(num+39);
	var mVal, fVal;
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

//Get child nodes of element without anoying those "ghost elements".
utils.getChildren = function(object) {
	var nRaw = object.childNodes, nodes = [];
	for(var i=0, l=nRaw.length; i<l; i++) { if(nRaw[i].nodeType != 3) nodes.push(nRaw[i]); }
	return nodes;
}

//Loads a JSONP-enabled file at the address. Callback 'callback'
//is fired with either recieved data, or 'false' if unsucessful.
utils.loadJSON = function(webAddr, timeout, callback) {
	var loaded=false,cnt=utils.firstEmptyChar(utils.lJSONCall),script=document.createElement('script');
	script.type = 'application/javascript'; script.onload = function() {loaded = true};
	if(cnt === false) { callback(false); return; }
	utils.lJSONCall[cnt] = function(data) { delete utils.lJSONCall[cnt]; callback(data); };
	setTimeout(function() {if(!loaded) {delete utils.lJSONCall[cnt]; callback(false)}}, timeout);
	script.src = webAddr+"&callback=utils.lJSONCall."+cnt;
	document.head.appendChild(script); document.head.removeChild(script);
}; utils.lJSONCall = [];

//Create a CSS class and append it to the current document. Fill 'propList' object
//with keys and values repersenting the CSS properties you want to add to the class.
utils.addClass = function(className, propList) {
	var style, keys = Object.keys(propList), str="";
	if(document.styleSheets.length > 0) style = document.styleSheets[0];
	else { style = document.createElement('style');
	style.appendChild(document.createTextNode("")); document.head.appendChild(style); }
	for(var i=0, l=keys.length; i<l; i++) str += keys[i]+":"+propList[keys[i]]+";";
	style.insertRule("."+className+"{"+str+"}", 1);
}

//Create a CSS selector and append it to the current document.
utils.addId = function(idName, propList) {
	var style, keys = Object.keys(propList), str="";
	if(document.styleSheets.length > 0) style = document.styleSheets[0];
	else { style = document.createElement('style');
	style.appendChild(document.createTextNode("")); document.head.appendChild(style); }
	for(var i=0, l=keys.length; i<l; i++) str += keys[i]+":"+propList[keys[i]]+";";
	style.insertRule("#"+idName+"{"+str+"}", 1);
}

//Create a CSS keyframe and append it to the current document.
utils.addKeyframe = function(name, content) {
	var style; if(document.styleSheets.length > 0) style = document.styleSheets[0];
	else { style = document.createElement('style');
	style.appendChild(document.createTextNode("")); document.head.appendChild(style); }
	style.insertRule("@keyframes "+name+"{"+content+"}", 1);
}

//Remove a CSS class from all stylesheets in the current document.
utils.removeClass = function(className) {
	for(var s=0,j=document.styleSheets.length; s<j; s++) {
		var style = document.styleSheets[s], rList = style.rules;
		for(key in rList) if(rList[key].type == 1 && rList[key]
		.selectorText == "."+className) style.removeRule(key);
	} //rule.type #1 = CSSStyleRule
}

//Converts HEX color to RGB.
//Function by: https://github.com/Pecacheu and others
utils.hexToRgb = function(hex) {
	var raw = parseInt(hex.substr(1), 16);
	return [(raw >> 16) & 255, (raw >> 8) & 255, raw & 255];
}

//Generates a random interger somewhere between min and max.
utils.rand = function(min, max) { return Math.floor(Math.random() * (max-min+1) + min); }

//Convert a url query string into a JavaScript object:
//Function by: Pecacheu (From Apache Test Server)
utils.fromQuery = function(string) {
	function parse(params, pairs) {
		var pair = pairs[0], parts = pair.split('='),
		key = decodeURIComponent(parts[0]),
		value = decodeURIComponent(parts.slice(1).join('='));
		//Handle multiple parameters of the same name:
		if(typeof params[key] == "undefined") params[key] = value;
		else params[key] = [].concat(params[key], value);
		return pairs.length == 1 ? params : parse(params, pairs.slice(1));
	} return string.length == 0 ? {} : parse({}, string.substr(1).split('&'));
}

//Convert an object into a url query string:
utils.toQuery = function(obj) {
	var str = ""; if(typeof obj != "object")
	return encodeURIComponent(obj);
	for(var key in obj) { var val = obj[key];
		if(typeof val == "object") val = JSON.stringify(val);
		str += "&"+key+"="+encodeURIComponent(val);
	} return str.slice(1);
}

//It's useful for any canvas-style webpage to have the page dimensions on hand.
//Function by: http://w3schools.com/jsref/prop_win_innerheight.asp
utils.updateSize = function() {
	utils.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	utils.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

//Various methods of centering objects using JavaScript.
utils.centerObj = function(obj, only, useOld) {
	if(!obj.style.position) obj.style.position = "absolute";
	if(useOld == "calc") { //Efficient, but Only Responsive for Changes in Page Size:
		if(!only || only == "x") obj.style.left = "calc(50% - "+(obj.clientWidth/2)+"px)";
		if(!only || only == "y") obj.style.top = "calc(50% - "+(obj.clientHeight/2)+"px)";
	} else if(useOld == "move") { //Original, Not Responsive:
		if(!only || only == "x") obj.style.left = (utils.width/2)-(obj.clientWidth/2)+"px";
		if(!only || only == "y") obj.style.top = (utils.height/2)-(obj.clientHeight/2)+"px";
	} else if(useOld == "trans") { //More Efficient:
		var trans = utils.cutStr(obj.style.transform, "translateX(-50%)");
		trans = utils.cutStr(trans, "translateY(-50%)");
		if(!only || only == "x") { obj.style.left = "50%"; trans += "translateX(-50%)"; }
		if(!only || only == "y") { obj.style.top = "50%"; trans += "translateY(-50%)"; }
		if(trans) obj.style.transform = trans;
	} else { //Largest Browser Support for Responsive Centering:
		var cont = document.createElement("div"); obj.parentNode.appendChild(cont);
		cont.style.display = "table"; cont.style.position = "absolute"; cont.style.top = 0;
		cont.style.left = 0; cont.style.width = "100%"; cont.style.height = "100%";
		obj.parentNode.removeChild(obj); cont.appendChild(obj); obj.style.display = "table-cell";
		if(!only || only == "x") { obj.style.textAlign = "center"; }
		if(!only || only == "y") { obj.style.verticalAlign = "middle"; }
		obj.style.position = "relative";
	}
}

//Loads a file and returns it's contents using HTTP GET.
//Callback parameters: (data, err)
//err: non-zero on error. Standard HTTP error codes.
//queryData: Optional, object of url querry data key/value pairs.
//contentType: Optional, sets content type header.
//Returns: false if AJAX not supported, true otherwise.
utils.loadAjax = function(path, callback, queryData, contentType) {
	//Obtain HTTP Object:
	var http; if(window.XMLHttpRequest) { //Chrome, Safari, Firefox, Edge:
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

//Pointless Extra Centering Method:
/*var cont = document.createElement("div"); obj.parentNode.appendChild(cont);
cont.style.position = "absolute"; cont.style.width = "100%"; cont.style.height = "100%";
obj.parentNode.removeChild(obj); cont.appendChild(obj);
if(!only || only == "x") { obj.style.left = "50%"; obj.style.marginLeft = obj.style.marginRight = "-25%"; }
if(!only || only == "y") { obj.style.top = "50%"; obj.style.marginTop = obj.style.marginBottom = "-25%"; }
obj.style.textAlign = "center"; obj.style.width = "50%"; obj.style.height = "50%";
if(only == "x") { obj.style.height = "100%"; } else if(only == "y") { obj.style.width = "100%"; }*/

//Converts from degrees to radians, so you can convert back for given stupid library.
//Function by: The a**hole who invented radians.
utils.rad = function(deg) { return deg * Math.PI / 180; }

//Converts from radians to degrees, so you can work in degrees.
//Function by: The a**hole who invented radians.
utils.deg = function(rad) { return rad * 180 / Math.PI; }

//I figued this formula out on my own when I was like 5, so I'm very proud of it...

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
	linear: function (t) { return t },
	//accelerating from zero velocity
	easeInQuad: function (t) { return t*t },
	//decelerating to zero velocity
	easeOutQuad: function (t) { return t*(2-t) },
	//acceleration until halfway, then deceleration
	easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	//accelerating from zero velocity
	easeInCubic: function (t) { return t*t*t },
	//decelerating to zero velocity
	easeOutCubic: function (t) { return (--t)*t*t+1 },
	//acceleration until halfway, then deceleration
	easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	//accelerating from zero velocity
	easeInQuart: function (t) { return t*t*t*t },
	//decelerating to zero velocity
	easeOutQuart: function (t) { return 1-(--t)*t*t*t },
	//acceleration until halfway, then deceleration
	easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	//accelerating from zero velocity
	easeInQuint: function (t) { return t*t*t*t*t },
	//decelerating to zero velocity
	easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
	//acceleration until halfway, then deceleration
	easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};
//https://github.com/Pecacheu/Utils.js; MIT License

'use strict';
const utils = {VER:'v8.5.7'};

function UtilRect(t,b,l,r) {
	if(!(this instanceof UtilRect)) return new UtilRect(t,b,l,r);
	const f=Number.isFinite; let tt=0,bb=0,ll=0,rr=0;
	utils.define(this,'x',				()=>ll,		v=>{f(v)?(rr+=v-ll,ll=v):0});
	utils.define(this,'y',				()=>tt,		v=>{f(v)?(bb+=v-tt,tt=v):0});
	utils.define(this,'top',			()=>tt,		v=>{tt=f(v)?v:0});
	utils.define(this,['bottom','y2'],	()=>bb,		v=>{bb=f(v)?v:0});
	utils.define(this,'left',			()=>ll,		v=>{ll=f(v)?v:0});
	utils.define(this,['right','x2'],	()=>rr,		v=>{rr=f(v)?v:0});
	utils.define(this,['width','w'],	()=>rr-ll,	v=>{rr=v>=0?ll+v:0});
	utils.define(this,['height','h'],	()=>bb-tt,	v=>{bb=v>=0?tt+v:0});
	utils.define(this,'centerX',		()=>ll/2+rr/2);
	utils.define(this,'centerY',		()=>tt/2+bb/2);
	if(t instanceof DOMRect || t instanceof UtilRect) tt=t.top, bb=t.bottom, ll=t.left, rr=t.right;
	else tt=t, bb=b, ll=l, rr=r;
}

//Check if rect contains point, other rect, or Element
UtilRect.prototype.contains = function(x,y) {
	if(x instanceof Element) return this.contains(x.boundingRect);
	if(x instanceof UtilRect) return x.x >= this.x && x.x2 <= this.x2 && x.y >= this.y && x.y2 <= this.y2;
	return x >= this.x && x <= this.x2 && y >= this.y && y <= this.y2;
}

//Check if rect overlaps rect or Element
UtilRect.prototype.overlaps = function(r) {
	if(r instanceof Element) return this.overlaps(r.boundingRect);
	if(!(r instanceof UtilRect)) return 0; let x,y;
	if(r.x2-r.x >= this.x2-this.x) x = this.x >= r.x && this.x <= r.x2 || this.x2 >= r.x && this.x2 <= r.x2;
	else x = r.x >= this.x && r.x <= this.x2 || r.x2 >= this.x && r.x2 <= this.x2;
	if(r.y2-r.y >= this.y2-this.y) y = this.y >= r.y && this.y <= r.y2 || this.y2 >= r.y && this.y2 <= r.y2;
	else y = r.y >= this.y && r.y <= this.y2 || r.y2 >= this.y && r.y2 <= this.y2;
	return x&&y;
}

//Get distance from this rect to point, other rect, or Element
UtilRect.prototype.dist = function(x,y) {
	if(x instanceof Element) return this.dist(x.boundingRect); let n=(x instanceof UtilRect);
	y=Math.abs((n?x.centerY:y)-this.centerY), x=Math.abs((n?x.centerX:x)-this.centerX);
	return Math.sqrt(x*x+y*y);
}

//Expand (or contract if negative) a UtilRect by num of pixels.
//Useful for using UtilRect objects as element hitboxes. Returns self for chaining.
UtilRect.prototype.expand = function(by) {
	this.top -= by; this.left -= by; this.bottom += by;
	this.right += by; return this;
}

//Get touch by id, returns null if none found.
if(window.TouchList) TouchList.prototype.get = function(id) {
	for(let k in this) if(this[k].identifier == id) return this[k]; return 0;
};

(() => { //Utils Library

//Cookie Parsing
utils.setCookie = (name,value,exp,secure) => {
	let c=encodeURIComponent(name)+'='+(value==null?'':encodeURIComponent(value))+';path=/';
	if(exp != null) {
		if(!(exp instanceof Date)) exp = new Date(exp);
		c+=';expires='+exp.toUTCString();
	}
	if(secure) c+=';secure'; document.cookie=c;
}
utils.remCookie = name => {
	document.cookie = encodeURIComponent(name)+'=;expires='+new Date(0).toUTCString();
}
utils.getCookie = name => {
	const n1 = encodeURIComponent(name), n2 = ' '+n1, cl = document.cookie.split(';');
	for(let i=0,l=cl.length,c,eq,sub; i<l; ++i) {
		c = cl[i]; eq = c.indexOf('='); sub = c.substr(0,eq);
		if(sub == n1 || sub == n2) return decodeURIComponent(c.substr(eq+1));
	}
}

//Wrap a function so that it always has a preset argument list when called.
//In the called function, 'this' is set to the caller's arguments, granting access to both.
Function.prototype.wrap = function(/*...*/) {
	const f=this, a=arguments; return function() {f.apply(arguments,a)}
}

//Deep (recursive) Object.create.
//Copies down to given sub levels. All levels if undefined.
utils.copy = (o, sub) => {
	if(sub===0 || typeof o != 'object') return o;
	sub=sub>0?sub-1:null; let o2;
	if(Array.isArray(o)) o2=new Array(o.length),
		o.forEach((v,i) => {o2[i]=utils.copy(v,sub)});
	else {o2={};for(let k in o) o2[k]=utils.copy(o[k],sub)}
	return o2;
}

//UserAgent-based Mobile device detection.
utils.deviceInfo = ua => {
	if(!ua) ua = navigator.userAgent; const d = {};
	if(!ua.startsWith("Mozilla/5.0 ")) return d;
	let o = ua.indexOf(')'), o2 = ua.indexOf(' ',o+2), o3 = ua.indexOf(')',o2+1);
	o3 = o3==-1?o2+1:o3+2; let os = d.rawOS = ua.substring(13,o);
	if(os.startsWith("Windows NT ")) {
		d.os = "Windows"; let vs = os.indexOf(';',12), ts = os.indexOf(';',vs+1)+2, te = os.indexOf(';',ts);
		d.type = os.substring(ts,te==-1?undefined:te)+" PC"; d.version = os.substring(11,vs).replace(/.0$/,'');
	} else if(os.startsWith("Linux; Android ")) {
		d.os = "Android"; let ds = os.indexOf(';',16), te = os.indexOf(' Build',ds+3);
		d.type = os.substring(ds+2, te==-1?undefined:te);
		d.version = os.substring(15,ds).replace(/.0$/,'');
	} else if(os.startsWith("iPhone; CPU iPhone OS ")) {
		d.os = "iOS"; d.type = "iPhone";
		d.version = os.substring(22, os.indexOf(' ',23)).replace(/_/g,'.');
	} else if(os.startsWith("Macintosh; Intel Mac OS X ")) {
		d.os = "MacOS"; d.type = "Macintosh";
		d.version = os.substr(26).replace(/_/g,'.');
	} else if(os.startsWith("X11; ")) {
		let ds = os.indexOf(';',6), ts = os.indexOf(';',ds+3);
		d.os = "Linux "+os.substring(5,ds); d.type = os.substring(ds+2,ts);
		d.version = os.substr(ts+5);
	}
	d.engine = ua.substring(o+2,o2); d.browser = ua.substring(o3);
	d.mobile = !!ua.match(/Mobi/i); return d;
}

utils.device = utils.deviceInfo();
utils.mobile = utils.device.mobile;

//Generates modified input field for css skinning on unsupported browsers. This is a JavaScript
//fallback for when css 'appearance:none' doesn't work. For Mobile Safari, this is usually
//needed with 'datetime-local', 'select-one', and 'select-multiple' input types.
utils.skinnedInput = el => {
	const cont = utils.mkDiv(null,el.className), is = el.style, type = el.type; el.className += ' isSub';
	if(type == 'datetime-local' || type == 'select-one' || type == 'select-multiple') { //Datetime or Select:
		is.opacity = 0; is.top = '-100%'; el.siT = utils.mkEl('span',cont,'isText');
		utils.mkEl('span',cont,'isArrow',{borderTopColor:getComputedStyle(el).color});
		let si=siChange.bind(el); el.addEventListener('change',si); el.forceUpdate=si; si();
	}
	el.replaceWith(cont); cont.appendChild(el);
	//Append StyleSheet:
	if(!document.isStyles) { document.isStyles = true; utils.mkEl('style',document.body,null,null,'.isSub {'+
		'width:100% !important; height:100% !important; border:none !important; display:inline-block !important;'+
		'position:relative !important; box-shadow:none !important; margin:0 !important; padding:initial !important;'+
	'} .isText {'+
		'display:inline-block; height:100%; max-width:95%;'+
		'overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'+
	'} .isArrow {'+
		'width:0; height:0; display:inline-block; float:right; top:38%; position:relative;'+
		'border-left:3px solid transparent; border-right:3px solid transparent;'+
		'border-top:6px solid #000; vertical-align:middle;'+
	'}'); }
}
function siChange() {
	switch(this.type) {
		case 'datetime-local': this.siT.textContent = utils.formatDate(utils.fromDateTimeBox(this)); break;
		case 'select-one': this.siT.textContent = selBoxLabel(this); break;
		case 'select-multiple': this.siT.textContent = mulBoxLabel(this);
	}
}

function selBoxLabel(sb) {
	const op = sb.options; if(op.selectedIndex != -1) return op[op.selectedIndex].label;
	return "No Options Selected";
}
function mulBoxLabel(sb) {
	const op = sb.options; let str = ''; for(let i=0,l=op.length; i<l; ++i)
	if(op[i].selected) str += (str?', ':'')+op[i].label; return str||"No Options Selected";
}

//Turns your boring <input> into a mobile-friendly number entry field with max/min & negative support.
//Optional 'decMax' parameter is maximum precision of decimal allowed. (ex. 3 would give precision of 0.001)
//Use field.onnuminput as your oninput function, and get the number value with field.num
//On mobile, use star key for decimal point and pound key for negative.
utils.numField = (f, min, max, decMax) => {
	if(min == null) min=-2147483648; if(max == null) max=2147483647;
	f.setAttribute('pattern',"\\d*"); f.type=(utils.mobile||decMax)?'tel':'number';
	f.ns=f.value=(f.num=Number(f.value)||0).toString();
	f.addEventListener('keydown',e => {
		let k=e.key, kn=(k.length==1)?Number(k):null, dAdd=f.ns.startsWith('-')?f.num != min:f.num != max,
		old=f.ns, len=f.ns.length, dec=f.ns.indexOf('.');
		if(kn || kn == 0) { if(dec == -1 || len-dec < decMax+1) f.ns += k; } //Number
		else if(decMax && dAdd && (k == '.' || k == '*') && dec == -1) f.ns += '.'; //Decimal
		else if(k == 'Backspace' || k == 'Delete') f.ns = f.ns.substr(0,len-1); //Backspace
		else if(min < 0 && (k == '-' || k == '#') && !len) f.ns='-'; //Negative
		else if(k == 'ArrowUp') f.ns = (f.num+(f.step||1)).toString(); //Up
		else if(k == 'ArrowDown') f.ns = (f.num-(f.step||1)).toString(); //Down
		len=f.ns.length, dec=f.ns.indexOf('.');
		if(dec != -1 && len-dec > decMax+1) len=(f.ns=f.ns.substr(0,dec+decMax+1)).length;
		let n=Number(f.ns)||0;
		if(n > max) n=max, f.ns=n.toString(); else if(n < min) n=min, f.ns=n.toString();
		let nOld=f.num, neg=f.ns.startsWith('-'); f.num=n;
		if(f.onnuminput && f.onnuminput(n) === false) f.ns=old, f.num=nOld;
		else f.value = (neg&&!n?'-':'')+n+(dec!=-1&&n%1==0?'.0':'');
		e.preventDefault();
	});
	f.addEventListener('input',() => {f.set(f.value)});
	f.set=n => {
		let dec,neg; if(typeof n=='string') dec=n.endsWith('.')&&decMax, neg=(n=='0-')&&min<0;
		n=Number(n)||0; if(!decMax) n=Math.floor(n); if(n > max) n=max; if(n < min) n=min;
		f.value=neg?'-0':(f.num=n)+(dec?'.0':''); f.ns=neg?'-':n+(dec?'.':'');
		if(f.onnuminput) f.onnuminput(n);
	}
	return f;
}

//Turns your boring <input> into a mobile-friendly currency entry field, optionally with custom currency symbol.
//Use field.onnuminput as your oninput function, and get the number value with field.num
//On mobile, use star key for decimal point.
utils.costField = (f, sym) => {
	if(!sym) sym='$'; f.setAttribute('pattern',"\\d*"); f.type='tel';
	f.value=utils.formatCost(f.num=Number(f.value)||0,sym); f.ns=f.num.toString();
	f.addEventListener('keydown',e => {
		let k=e.key, kn=(k.length==1)?Number(k):null, len=f.ns.length,
		old=f.ns, dec=f.ns.indexOf('.');
		if(kn || kn == 0) { if(dec == -1 || len-dec < 3) f.ns += k; } //Number
		else if((k == '.' || k == '*') && dec == -1) f.ns += '.', dec=len; //Decimal
		else if(k == 'Backspace' || k == 'Delete') f.ns = f.ns.substr(0,len-1); //Backspace
		else if(k == 'ArrowUp') f.ns = (f.num+1).toString(); //Up
		else if(k == 'ArrowDown' && f.num >= 1) f.ns = (f.num-1).toString(); //Down
		let n=Number(f.ns)||0; if(!n && dec == -1) f.ns=''; let nOld=f.num; f.num=n;
		if(f.onnuminput && f.onnuminput(n) === false) f.ns=old, f.num=nOld;
		else f.value=utils.formatCost(n,sym);
		e.preventDefault();
	});
	f.addEventListener('input',() => {f.set(f.value)});
	f.set=n => {
		let dec; if(typeof n=='string') {
			dec=n.endsWith('.'); if(dec) n=n.substr(0,n.length-1);
			if(n.startsWith(sym)) n=n.substr(sym.length);
		}
		f.num=n=Math.floor((Number(n)||0)*100)/100;
		f.value=utils.formatCost(n,sym), f.ns=n+(dec?'.':'');
		if(f.onnuminput) f.onnuminput(n);
	}
	return f;
}

//Format Number as currency. Uses '$' by default.
utils.formatCost = (n, sym) => {
	if(!sym) sym='$'; if(!n) return sym+'0.00';
	const p = n.toFixed(2).split('.');
	return sym+p[0].split('').reverse().reduce((a,n,i) =>
	n=='-'?n+a:n+(i&&!(i%3)?',':'')+a,'')+'.'+p[1];
}

//Convert value from 'datetime-local' input to Date object.
utils.fromDateTimeBox = el => {
	const v=el.value; if(!v) return new Date();
	return new Date(v.replace(/-/g,'/').replace(/T/g,' '));
}

//Convert Date object into format to set 'datetime-local'
//input value, optionally including seconds if 'sec' is true.
utils.toDateTimeBox = (d, sec) => {
	return d.getFullYear()+'-'+fixed2(d.getMonth()+1)+'-'+fixed2(d.getDate())+'T'+
	fixed2(d.getHours())+':'+fixed2(d.getMinutes())+(sec?':'+fixed2(d.getSeconds()):'');
}

utils.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fixed2(n) {return n<=9?'0'+n:n}

//Format Date object into human-readable string.
//opt:
//	sec: True to include seconds
//	ms: True or 3 to include milliseconds (requires sec), 2 or 1 to limit precision
//	h24: True to use 24-hour time
//	time: True to show time only, false to show date only, null to show both
//	suf: False to drop date suffix (1st, 2nd, etc.)
//	year: False to hide year, or a number to show year only if it differs from given year
//	df: True to put date first instead of time
utils.formatDate = (d,opt={}) => {
	let t='',yy,dd;
	if(d==null || !d.getDate || !((yy=d.getFullYear())>1969)) return "[Invalid Date]";
	if(opt.time==null||opt.time) {
		let h=d.getHours(),pm=''; if(!opt.h24) {pm=' AM'; if(h>=12) pm=' PM',h-=12; if(!h) h=12}
		t=h+':'+fixed2(d.getMinutes())+(opt.sec?':'+fixed2(d.getSeconds())
			+(opt.ms?(d.getMilliseconds()/1000).toFixed(Number.isFinite(opt.ms)?opt.ms:3).substr(1):''):'');
		t+=pm; if(opt.time) return t;
	}
	dd=d.getDate();
	dd=utils.months[d.getMonth()]+' '+((opt.suf==null||opt.suf)?utils.suffix(dd):dd);
	if((opt.year==null||opt.year) && opt.year!==yy) dd=dd+', '+yy;
	return opt.df?dd+(t&&' '+t):(t&&t+' ')+dd;
}

//Add appropriate suffix to number. (ex. 31st, 12th, 22nd)
utils.suffix = n => {
	let j=n%10, k=n%100;
	if(j==1 && k!=11) return n+"st";
	if(j==2 && k!=12) return n+"nd";
	if(j==3 && k!=13) return n+"rd";
	return n+"th";
}

//Virtual Page Navigation
let H=history;
utils.goBack = H.back.bind(H);
utils.goForward = H.forward.bind(H);
utils.go = (url,st) => {H.pushState(st,'',url||location.pathname),doNav(st)}
addEventListener('popstate', (e) => doNav(e.state));
addEventListener('load', () => setTimeout(doNav.wrap(H.state),1));
function doNav(s) {if(utils.onNav) utils.onNav.call(null,s)}

//Create element with parent, className, style object, and innerHTML string.
//(Just remember the order PCSI!) Use null to leave a value blank.
utils.mkEl = (t,p,c,s,i) => {
	const e=document.createElement(t);
	if(c!=null) e.className=c; if(i!=null) e.innerHTML=i;
	if(s && typeof s=='object') {
		let k=Object.keys(s),i=0,l=k.length;
		for(; i<l; ++i) e.style[k[i]]=s[k[i]];
	}
	if(p!=null) p.appendChild(e); return e;
}
utils.mkDiv = (p,c,s,i) => utils.mkEl('div',p,c,s,i);
utils.addText = (el, text) => el.appendChild(document.createTextNode(text));

//Get predicted width of text given CSS font style.
utils.textWidth = (txt, font) => {
	const c=window.TWCanvas||(window.TWCanvas=utils.mkEl('canvas')),
	ctx=c.getContext('2d'); ctx.font=font; return ctx.measureText(txt).width;
}

//Add a getter/setter pair to an existing object:
utils.define = (obj, name, get, set) => {
	const t={}; if(get) t.get=get; if(set) t.set=set;
	if(Array.isArray(name)) for(let i=0,l=name.length; i<l; ++i) Object.defineProperty(obj, name[i] ,t);
	else Object.defineProperty(obj, name, t);
}

//It's useful for any canvas-style app to have the page dimensions on hand.
utils.define(utils, 'w', ()=>innerWidth);
utils.define(utils, 'h', ()=>innerHeight);

/*Set a nested/recursive property in an object, even if the higher levels don't exist. Useful for defining settings in a complex config object.
obj: Object to set property in
path: String (dot separated) or array defining the path to the property
val: Value to set
onlyNull: True to set value only if it doesn't exist*/
utils.setPropSafe = (obj, path, val, onlyNull=false) => {
	if(typeof path=='string') path=path.split('.');
	let li=path.length-1;
	path.each(p => {typeof obj[p]=='object'?obj=obj[p]:obj=obj[p]={}},0,li);
	li=path[li]; if(!onlyNull || obj[li]==null) return obj[li]=val;
	return obj[li];
}

/*Gets a nested/recursive property in an object, returning undefined if it or any higher level doesn't exist. Useful for reading settings from a complex config object.
obj: Object to read property from
path: String (dot separated) or array defining the path to the property*/
utils.getPropSafe = (obj, path) => {
	if(typeof path=='string') path=path.split('.');
	try {path.each(p => {obj=obj[p]}); return obj} catch(_) {}
}

//Remove 'empty' elements like 0, false, ' ', undefined, and NaN from array.
//Often useful in combination with Array.split. Set 'keepZero' to true to keep '0's.
//Function by: Pecacheu & https://stackoverflow.com/users/5445/cms
Array.prototype.clean = function(kz) {
	for(let i=0,e,l=this.length; i<l; ++i) {
		e=this[i]; if(utils.isBlank(e) || e === false ||
		!kz && e === 0) this.splice(i--,1),l--;
	} return this;
}

//Remove first instance of item from array. Returns false if not found.
//Use a while loop to remove all instances.
Array.prototype.remove = function(itm) {
	const i=this.indexOf(itm); if(i==-1) return false;
	this.splice(i,1); return true;
}

//Calls fn on each index of array.
//fn: Callback function(element, index, length)
//st: Start index, optional. If negative, relative to end of array.
//en: End index, optional. If negative, relative to end of array.
//If fn returns '!', it will remove the element from the array.
//Otherwise, if fn returns any non-null value,
//the loop is broken and the value is returned by each.
NodeList.prototype.each = HTMLCollection.prototype.each = Array.prototype.each = function(fn,st,en) {
	let l=this.length,i=st<0?l+st:(st||0),r; if(en!=null) l=en<0?l+en:en;
	for(; i<l; ++i) if((r=fn(this[i],i,l))==='!') {
		this instanceof HTMLCollection?this[i].remove():this.splice(i,1); i--,l--;
	} else if(r!=null) return r;
}

//Get an element's index in its parent. Returns -1 if the element has no parent.
utils.define(Element.prototype,'index',function() {
	const p=this.parentElement; if(!p) return -1;
	return Array.prototype.indexOf.call(p.children, this);
});

//Insert child at index:
Element.prototype.insertChildAt = function(el, i) {
	if(i<0) i=0; if(i >= this.children.length) this.appendChild(el);
	else this.insertBefore(el, this.children[i]);
}

//Get element bounding rect as UtilRect object:
utils.boundingRect = e => new UtilRect(e.getBoundingClientRect());
utils.define(Element.prototype,'boundingRect',function() {return utils.boundingRect(this)});

//No idea why this isn't built-in, but it's not.
Math.cot = x => 1/Math.tan(x);

//Check if string, array, or other object is empty.
utils.isBlank = s => {
	if(s == null) return true;
	if(typeof s == 'string') return !/\S/.test(s);
	if(typeof s == 'object') {
		if(typeof s.length == 'number') return s.length === 0;
		return Object.keys(s).length === 0;
	}
	return false;
}

//Finds first empty (undefined) slot in array.
utils.firstEmpty = arr => {
	const len = arr.length;
	for(let i=0; i<len; ++i) if(arr[i] == null) return i;
	return len;
}

//Like 'firstEmpty', but uses letters a-Z instead.
utils.firstEmptyChar = obj => {
	const keys = Object.keys(obj), len = keys.length;
	for(let i=0; i<len; ++i) if(obj[keys[i]] == null) return keys[i];
	return utils.numToChar(len);
}

//Converts a number into letters (upper and lower) from a to Z.
utils.numToChar = n => {
	if(n<=25) return String.fromCharCode(n+97);
	else if(n>=26 && n<=51) return String.fromCharCode(n+39);
	let mVal, fVal;
	if(n<2756) { mVal=rstCount(Math.floor(n/52)-1,52); fVal=rstCount(n,52); }
	else if(n<143364) { mVal=rstCount(Math.floor((n-52)/2704)-1,52); fVal=rstCount(n-52,2704)+52; }
	else if(n<7454980) { mVal=rstCount(Math.floor((n-2756)/140608)-1,52); fVal=rstCount(n-2756,140608)+2756; }
	else return false; //More than "ZZZZ"? No. Just, no.
	return utils.numToChar(mVal)+utils.numToChar(fVal);
}

//Use this to reset your counter each time 'maxVal' is reached.
function rstCount(val, maxVal) { while(val >= maxVal) val -= maxVal; return val; }
//This alternate method doesn't always work due to inaccuracy of trig functions:
//function squareWave(x,p) {a=p/2; return Math.round(-(2*a/Math.PI)*Math.atan(utils.cot(x*Math.PI/p))+a)}

//Semi-recursively merges two (or more) objects, giving the last precedence.
//If both objects contain a property at the same index, and both are Arrays/Objects, they are merged.
utils.merge = function(o/*, src1, src2...*/) {
	for(let a=1,al=arguments.length,n,oP,nP; a<al; ++a) {
		n = arguments[a]; for(let k in n) {
			oP = o[k]; nP = n[k]; if(oP && nP) { //Conflict.
				if(oP.length >= 0 && nP.length >= 0) { //Both Array-like.
					for(let i=0,l=nP.length,ofs=oP.length; i<l; ++i) oP[i+ofs] = nP[i]; continue;
				} else if(typeof oP == 'object' && typeof nP == 'object') { //Both Objects.
					for(let pk in nP) oP[pk] = nP[pk]; continue;
				}
			}
			o[k] = nP;
		}
	}
	return o;
}

//Keeps value within max/min bounds. Also handles NaN or null.
utils.bounds = (n, min=0, max=1) => {
	if(!(n>=min)) return min; if(!(n<=max)) return max; return n;
}

//'Normalizes' a value so that it ranges from min to max, but unlike utils.bounds,
//this function retains input's offset. This can be used to normalize angles.
utils.norm = utils.normalize = (n, min=0, max=1) => {
	const c = Math.abs(max-min);
	if(n < min) while(n < min) n += c; else while(n >= max) n -= c;
	return n;
}

//Finds and removes all instances of 'rem' contained within s.
utils.cutStr = (s, rem) => {
	let fnd; while((fnd=s.indexOf(rem)) != -1) {
		s = s.slice(0, fnd)+s.slice(fnd+rem.length);
	}
	return s;
}

//Cuts text out of 'data' from first instance of 'startString' to next instance of 'endString'.
//(data,startString,endString[,index[,searchStart]])
//index: Optional object. index.s and index.t will be set to start and end indexes.
utils.dCut = (d, ss, es, sd, st) => {
	let is = d.indexOf(ss,st?st:undefined)+ss.length, it = d.indexOf(es,is);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.substring(is,it);
}
utils.dCutToLast = (d, ss, es, sd, st) => {
	let is = d.indexOf(ss,st?st:undefined)+ss.length, it = d.lastIndexOf(es);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.substring(is,it);
}
utils.dCutLast = (d, ss, es, sd, st) => {
	let is = d.lastIndexOf(ss,st?st:undefined)+ss.length, it = d.indexOf(es,is);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.substring(is,it);
}

//Polyfill for String.trim()
//Function by: https://w3schools.com
if(!String.prototype.trim) String.prototype.trim = function() {return this.replace(/^\s+|\s+$/gm,'')}

//Given CSS property value 'prop', returns object with
//space-separated values from the property string.
utils.parseCSS = prop => {
	const pArr={}, pKey="", keyNum=0; prop=prop.trim();
	function parseInner(str) {
		if(str.indexOf(',') !== -1) {
			const arr = utils.clean(str.split(','));
			for(let i=0, l=arr.length; i<l; ++i) arr[i]=arr[i].trim();
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
			if(pKey) pArr[keyNum++] = pKey;
			let end=prop.search(/[^#!\w-%]/); if(end==-1) end=prop.length;
			pKey = prop.substring(0, end); prop = prop.substring(end);
		} else {
			prop = prop.substring(1);
		}
	}
	if(pKey) pArr[keyNum] = pKey; return pArr;
}

//Rebuilds CSS string from a parseCSS object.
utils.buildCSS = propArr => {
	const keyArr=Object.keys(propArr), l=keyArr.length; let pStr='', i=0;
	while(i<l) {
		const k=keyArr[i], v=propArr[keyArr[i]]; ++i;
		if(0<=Number(k)) pStr+=v+' '; else pStr+=`${k}(${v}) `;
	}
	return pStr.substring(0, pStr.length-1);
}

function defaultStyle() {
	const ss=document.styleSheets;
	for(let s=0,j=ss.length; s<j; ++s) try { ss[s].cssRules; return ss[s]; } catch(e) {}
	let ns=utils.mkEl('style',document.head); utils.addText(ns,''); return ns.sheet;
}
function toKey(k) {
	return k.replace(/[A-Z]/g, s => '-'+s.toLowerCase());
}

//Create a CSS class and append it to the current document. Fill 'propList' object
//with key/value pairs representing the properties you want to add to the class.
utils.addClass = (className, propList) => {
	const style = defaultStyle(), keys = Object.keys(propList); let str='';
	for(let i=0,l=keys.length; i<l; ++i) str += toKey(keys[i])+":"+propList[keys[i]]+";";
	style.addRule("."+className,str);
}

//Create a CSS selector and append it to the current document.
utils.addId = (idName, propList) => {
	const style = defaultStyle(), keys = Object.keys(propList); let str='';
	for(let i=0,l=keys.length; i<l; ++i) str += toKey(keys[i])+":"+propList[keys[i]]+";";
	style.addRule("#"+idName,str);
}

//Create a CSS keyframe and append it to the current document.
utils.addKeyframe = (name, content) => {
	defaultStyle().addRule("@keyframes "+name,content);
}

//Remove a specific css selector (including the '.' or '#') from all stylesheets in the current document.
utils.removeSelector = name => {
	for(let s=0,style,rList,j=document.styleSheets.length; s<j; ++s) {
		style = document.styleSheets[s]; try { rList=style.cssRules; } catch(e) { continue; }
		for(let key in rList) if(rList[key].type == 1 && rList[key].selectorText == name) style.removeRule(key);
	}
}

//Shorthand way to get element by id/class name, within a parent element (defaults to document).
//(class[,parent])
utils.getId = (c,p) => (p?p:document)['getElementById'](c);
utils.getClassList = (c,p) => (p?p:document)['getElementsByClassName'](c);
utils.getClassFirst = (c,p) => (c=utils.getClassList(c,p),c.length>0?c[0]:0);
utils.getClassOnly = (c,p) => (c=utils.getClassList(c,p),c.length==1?c[0]:0);

//Converts HEX color to 24-bit RGB.
//Function by: https://github.com/Pecacheu and others
utils.hexToRgb = hex => {
	const c = parseInt(hex.substr(1), 16);
	return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

//Generates random integer from min to max.
utils.rand = (min, max, res, ease) => {
	res=res||1; max*=res,min*=res; let r=Math.random();
	return Math.round((ease?ease(r):r)*(max-min)+min)/res;
}

//Parses a url query string into an Object.
//Function by: Pecacheu (From Pecacheu's Apache Test Server)
utils.fromQuery = str => {
	if(str.startsWith('?')) str = str.substr(1);
	function parse(params, pairs) {
		const pair = pairs[0], spl = pair.indexOf('='),
		key = decodeURIComponent(pair.substr(0,spl)),
		value = decodeURIComponent(pair.substr(spl+1));
		//Handle multiple parameters of the same name:
		if(params[key] == null) params[key] = value;
		else if(typeof params[key] == 'array') params[key].push(value);
		else params[key] = [params[key],value];
		return pairs.length == 1 ? params : parse(params, pairs.slice(1));
	} return str.length == 0 ? {} : parse({}, str.split('&'));
}

//Converts an object into a url query string.
utils.toQuery = obj => {
	let str = ''; if(typeof obj != 'object') return encodeURIComponent(obj);
	for(let key in obj) {
		let val = obj[key]; if(typeof val == 'object') val = JSON.stringify(val);
		str += '&'+key+'='+encodeURIComponent(val);
	} return str.slice(1);
}

//Various methods of centering objects using JavaScript.
//obj: Object to center.
//only: 'x' for only x axis centering, 'y' for only y axis, null for both.
//type: 'calc', 'trans', 'move', or null, modes explained below.
utils.center = (obj, only, type) => {
	let os=obj.style;
	if(!os.position) os.position="absolute";
	if(type == 'calc') { //Responsive, but only if object size is static
		if(!only || only == "x") os.left=`calc(50% - ${obj.clientWidth/2}px)`;
		if(!only || only == "y") os.top=`calc(50% - ${obj.clientHeight/2}px)`;
	} else if(type == 'move') { //Not responsive
		if(!only || only == "x") os.left=`${utils.w/2 - obj.clientWidth/2}px`;
		if(!only || only == "y") os.top=`${utils.h/2 - obj.clientHeight/2}px`;
	} else if(type == 'trans') { //Responsive, doesn't create container
		let trans = utils.cutStr(os.transform, "translateX(-50%)");
		trans = utils.cutStr(trans, "translateY(-50%)");
		if(!only || only == "x") os.left="50%", trans+="translateX(-50%)";
		if(!only || only == "y") os.top="50%", trans+="translateY(-50%)";
		if(trans) os.transform=trans;
	} else { //Responsive, largest browser support
		let cont=utils.mkEl("div", obj.parentNode, null, {display:'table',
			position:'absolute', top:0, left:0, width:'100%', height:'100%'});
		cont.appendChild(obj); os.display="table-cell";
		if(!only || only == "x") os.textAlign="center";
		if(!only || only == "y") os.verticalAlign="middle";
		os.position="relative";
	}
}

//Loads a file and returns its contents using HTTP GET.
//Callback parameters: (err, data, req)
//err: Non-zero on error. Standard HTTP error codes.
//data: Response text.
//req: Full XMLHttpRequest object.
//meth: Optional HTTP method, default is GET.
//body: Optional body content.
//hd: Optional header list.
utils.loadAjax = (path, cb, meth, body, hd) => {
	let R; try {R=new XMLHttpRequest()} catch(e) {return cb(e)}
	if(hd) for(let k in hd) R.setRequestHeader(k,hd[k]);
	R.open(meth||'GET',path); R.onreadystatechange = () => {
		let s=R.status||-1;
		if(R.readyState == R.DONE) cb(s==200?0:s, R.response, R);
	}
	R.send(body||undefined);
}

//Good fallback for loadAjax. Loads a file at the address via HTML object tag.
//Callback is fired with either received data, or 'false' if unsuccessful.
utils.loadFile = (path, cb, timeout) => {
	const obj = utils.mkEl('object', document.body, null, {position:'fixed', opacity:0});
	obj.data = path;
	let tmr = setTimeout(() => {
		obj.remove(); tmr = null; cb(false);
	}, timeout||4000);
	obj.onload = () => {
		if(!tmr) return; clearTimeout(tmr);
		cb(obj.contentDocument.documentElement.outerHTML);
		obj.remove();
	}
}

//Loads a file at the address from a JSONP-enabled server. Callback
//is fired with either received data, or 'false' if unsuccessful.
utils.loadJSONP = (path, cb, timeout) => {
	const script = utils.mkEl('script', document.head), id = utils.firstEmptyChar(utils.lJSONCall);
	script.type = 'application/javascript';
	script.src = path+(path.indexOf('?')==-1?'?':'&')+'callback=utils.lJSONCall.'+id;
	let tmr = setTimeout(() => { delete utils.lJSONCall[id]; cb(false); }, timeout||4000);
	utils.lJSONCall[id] = data => {
		if(tmr) clearTimeout(tmr); delete utils.lJSONCall[id]; cb(data);
	}
	document.head.removeChild(script);
}; utils.lJSONCall = [];

//Downloads a file from a link.
utils.dlFile = (fn,uri) => {
	return fetch(uri).then(r => { if(r.status != 200) throw "Code "+r.status; return r.blob(); })
		.then(b => { utils.dlData(fn,b); });
}
//Downloads a file generated from a Blob or ArrayBuffer.
utils.dlData = (fn,d) => {
	let o,e=utils.mkEl('a',document.body,null,{display:'none'});
	if(typeof d=='string') o=d; else {
		if(!(d instanceof Blob)) d=Blob(d); o=URL.createObjectURL(d);
	}
	e.href=o,e.download=fn; e.click(); e.remove(); URL.revokeObjectURL(o);
}

//Converts from radians to degrees, so you can work in degrees.
//Function by: The a**hole who invented radians.
utils.deg = rad => rad*180/Math.PI;

//Converts from degrees to radians, so you can convert back for given stupid library.
//Function by: The a**hole who invented radians.
utils.rad = deg => deg*Math.PI/180;

//Pecacheu's ultimate unit translation formula!
//This Version -- Bounds Checking: NO, Rounding: NO, Max/Min Switching: NO, Easing: YES
utils.map = (input, minIn, maxIn, minOut, maxOut, ease) => {
	let i=(input-minIn)/(maxIn-minIn); return ((ease?ease(i):i)*(maxOut-minOut))+minOut;
}

//setTimeout but async
utils.delay = ms => new Promise(r => setTimeout(r,ms));

})(); //End of Utils Library

//JavaScript Easing Library. By: https://github.com/gre & https://gizma.com/easing
//'t' should be between 0 and 1
const Easing = {
	//no easing, no acceleration
	linear:t => t,
	//accelerating from zero velocity
	easeInQuad:t => t*t,
	//decelerating to zero velocity
	easeOutQuad:t => t*(2-t),
	//acceleration until halfway, then deceleration
	easeInOutQuad:t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
	//accelerating from zero velocity
	easeInCubic:t => t*t*t,
	//decelerating to zero velocity
	easeOutCubic:t => (--t)*t*t+1,
	//acceleration until halfway, then deceleration
	easeInOutCubic:t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
	//accelerating from zero velocity
	easeInQuart:t => t*t*t*t,
	//decelerating to zero velocity
	easeOutQuart:t => 1-(--t)*t*t*t,
	//acceleration until halfway, then deceleration
	easeInOutQuart:t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
	//accelerating from zero velocity
	easeInQuint:t => t*t*t*t*t,
	//decelerating to zero velocity
	easeOutQuint:t => 1+(--t)*t*t*t*t,
	//acceleration until halfway, then deceleration
	easeInOutQuint:t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
}
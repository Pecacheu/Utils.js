//https://github.com/Pecacheu/Utils.js; GNU GPL v3

'use strict';
const utils = {VER:'v8.7.8'},
_uNJS = typeof global!='undefined';

//Node.js compat
let UtilRect, P=(typeof window=='undefined')?
	[{}, {back:()=>{},forward:()=>{}}, class{}, class{}, class{}, class{}, ()=>{}]:
	[window, history, DOMRect, HTMLCollection, Element, NodeList, addEventListener];

(() => { //Utils Library

const [window, history, DOMRect, HTMLCollection,
	Element, NodeList, addEventListener] = P;

//Add getter/setter to object
utils.define = (obj, name, get, set) => {
	const t={}; if(get) t.get=get; if(set) t.set=set;
	if(Array.isArray(name)) for(let n of name) Object.defineProperty(obj,n,t);
	else Object.defineProperty(obj,name,t);
}
//Define prop in object prototype
utils.proto = (obj, name, val, st) => {
	const t={value:val}; if(!st) obj=obj.prototype;
	if(Array.isArray(name)) for(let n of name) Object.defineProperty(obj,n,t);
	else Object.defineProperty(obj,name,t);
}

//Cookies! (Yum)
utils.setCookie = (key,value,exp,secure) => {
	let c=`${encodeURIComponent(key)}=${value==null?'':encodeURIComponent(value)};path=/`;
	if(exp != null) {
		if(exp === -1) exp=new Date(Number.MAX_SAFE_INTEGER/10);
		if(exp instanceof Date) c+=';expires='+exp.toUTCString();
		else c+=';max-age='+exp;
	}
	if(secure) c+=';secure';
	if(_uNJS) return c;
	document.cookie=c;
}
utils.remCookie = key => {
	let c=encodeURIComponent(key)+'=;max-age=0';
	if(_uNJS) return c;
	document.cookie=c;
}
utils.getCookies = ckStr => {
	if(ckStr == null) ckStr=document.cookie;
	if(!ckStr) return {};
	let l=ckStr.split('; '),c,e,d={};
	for(c of l) {
		e=c.indexOf('=');
		d[decodeURIComponent(c.slice(0,e))]=decodeURIComponent(c.slice(e+1));
	}
	return d;
}
utils.getCookie = (key, ckStr) => {
	if(ckStr == null) ckStr=document.cookie;
	key=encodeURIComponent(key)+'=';
	let l=ckStr.split('; '),c;
	for(c of l) if(c.startsWith(key))
		return decodeURIComponent(c.slice(key.length));
}

//Wrap a function so that it always has a preset argument list when called
//In the called function, 'this' is set to the caller's arguments, granting access to both
utils.proto(Function, 'wrap', function(/*...*/) {
	const f=this, a=arguments; return function() {return f.apply(arguments,a)}
})

//Deep (recursive) Object.create
//Copies down to given sub levels. All levels if undefined
utils.copy = (o, sub) => {
	if(sub===0 || typeof o != 'object') return o;
	sub=sub>0?sub-1:null; let o2;
	if(Array.isArray(o)) o2=new Array(o.length),
		o.forEach((v,i) => {o2[i]=utils.copy(v,sub)});
	else {o2={};for(let k in o) o2[k]=utils.copy(o[k],sub)}
	return o2;
}

//UserAgent-based Mobile device detection
utils.deviceInfo = ua => {
	const d={}; if(!ua) ua=navigator.userAgent;
	if(!ua.startsWith("Mozilla/5.0 ")) return d;
	let o=ua.indexOf(')'), os=d.rawOS=ua.slice(13,o), o2,o3;
	if(os.startsWith("Windows")) {
		o2=os.split('; '), d.os = "Windows";
		d.type = o2.indexOf('WOW64')!=-1?'x64 PC; x86 Browser':o2.indexOf('x64')!=-1?'x64 PC':'x86 PC';
		o2=os.indexOf("Windows NT "), d.version = os.slice(o2+11,os.indexOf(';',o2+12));
	} else if(os.startsWith("iP")) {
		o2=os.indexOf("OS"), d.os = "iOS", d.type = os.slice(0,os.indexOf(';'));
		d.version = os.slice(o2+3, os.indexOf(' ',o2+4)).replace(/_/g,'.');
	} else if(os.startsWith("Macintosh;")) {
		o2=os.indexOf(" Mac OS X"), d.os = "MacOS", d.type = os.slice(11,o2)+" Mac";
		d.version = os.slice(o2+10).replace(/_/g,'.');
	} else if((o2=os.indexOf("Android"))!=-1) {
		d.os = "Android", d.version = os.slice(o2+8, os.indexOf(';',o2+9));
		o2=os.lastIndexOf(';'), o3=os.indexOf(" Build",o2+2);
		d.type = os.slice(o2+2, o3==-1?undefined:o3);
	} else if(os.startsWith("X11;")) {
		os=os.slice(5).split(/[;\s]+/), o2=os.length;
		d.os = (os[0]=="Linux"?'':"Linux ")+os[0];
		d.type = os[o2-2], d.version = os[o2-1];
	}
	if(o2=Number(d.version)) d.version=o2;
	o2=ua.indexOf(' ',o+2), o3=ua.indexOf(')',o2+1), o3=o3==-1?o2+1:o3+2;
	d.engine = ua.slice(o+2,o2), d.browser = ua.slice(o3);
	d.mobile = !!ua.match(/Mobi/i); return d;
}

if(!_uNJS) {
	utils.device = utils.deviceInfo();
	utils.mobile = utils.device.mobile;
}

//Get touch by id, returns null if none found
if(window.TouchList) utils.proto(TouchList, 'get', function(id) {
	for(let k in this) if(this[k].identifier == id) return this[k]; return 0;
})

const R_NFZ=/\.0*$/;

/*Turns your boring <input> into a mobile-friendly number entry field with max/min & negative support!
min: Min value, default min safe int
max: Max value, default max safe int
decMax: Max decimal precision (eg. 3 is 0.001), default 0
sym: If a symbol (eg. '$') is given, uses currency mode
Tips:
- Use field.onnuminput in place of oninput, get number value with field.num
- On mobile, use star key for decimal point and pound key for negative
- You can set field.step in order to change the up/down arrow step size
- Use field.setRange to change min, max, and decMax*/
utils.numField=(f, min, max, decMax, sym) => {
	const RM=RegExp(`[,${sym?RegExp.escape(sym):''}]`,'g');
	f.type=(utils.mobile||decMax||sym)?'tel':'number';
	f.setAttribute('pattern',"\\d*");
	if(!f.step) f.step=1;
	f.addEventListener('keydown',e => {
		if(e.ctrlKey) return;
		let k=e.key, kn=k.length===1&&Number.isFinite(Number(k)),
			ns=f.ns, len=ns.length, dec=ns.indexOf('.');

		if(k==='Tab' || k==='Enter') return;
		else if(kn) {if(dec===-1 || len-dec < decMax+1) ns+=k} //Number
		else if(k==='.' || k==='*') {if(decMax && dec==-1
				&& f.num!=max && (min>=0 || f.num!=min)) { //Decimal
			if(!len && min>0) ns=Math.floor(min)+'.';
			else ns+='.';
		}} else if(k==='Backspace' || k==='Delete') { //Backspace
			if(min>0 && f.num===min && ns.endsWith('.')) ns='';
			else ns=ns.slice(0,-1);
		} else if(k==='-' || k==='#') {if(min<0 && !len) ns='-'} //Negative
		else if(k==='ArrowUp') ns=null, f.set(f.num+Number(f.step)); //Up
		else if(k==='ArrowDown') ns=null, f.set(f.num-Number(f.step)); //Down

		if(ns !== null && ns !== f.ns) {
			len=ns.length, dec=ns.indexOf('.');
			let neg=ns==='-'||ns==='-.', s=neg?'0':ns+(ns.endsWith('.')?'0':''),
				nr=Number(s), n=Math.min(max,Math.max(min,nr));
			if(!kn || !ns || f.num !== n || (dec!==-1 && len-dec < decMax+1)) {
				f.ns=ns, f.num=n;
				f.value = sym ? neg?sym+'-0.00':utils.formatCost(n,sym):
					(ns[0]==='-'?'-':'')+Math.floor(Math.abs(n))
					+(dec!==-1?ns.slice(dec)+(R_NFZ.test(ns)?'0':''):'');
				if(f.onnuminput) f.onnuminput.call(f);
			}
		}
		e.preventDefault();
	});
	function numRng(n) {
		if(typeof n==='string') n=n.replace(RM,'');
		n=Math.min(max,Math.max(min,Number(n)||0));
		return decMax?Number(n.toFixed(decMax)):Math.round(n);
	}
	f.set=n => {
		f.num = numRng(n);
		f.ns = f.num.toString();
		f.value = sym?utils.formatCost(f.num,sym):f.ns;
		f.ns=f.ns.replace(/^(-?)0+/,'$1');
		if(f.onnuminput) f.onnuminput.call(f);
	}
	f.setRange=(nMin, nMax, nDecMax) => {
		min=nMin==null ? Number.MIN_SAFE_INTEGER : nMin;
		max=nMax==null ? Number.MAX_SAFE_INTEGER : nMax;
		decMax=nDecMax==null ? sym?2:0 : nDecMax;
		if(numRng(f.num) !== f.num) f.set(f.num);
	}
	f.addEventListener('input',() => f.set(f.value));
	f.addEventListener('paste',e => {f.set(e.clipboardData.getData('text')); e.preventDefault()});
	f.setRange(min, max, decMax);
	return f;
}

//Auto-resizing textarea, dynamically scales lineHeight based on input
//Use `el.set(value)` to set value & update size
//By Rick Kukiela @ StackOverflow
utils.autosize = (el, maxRows=5, minRows=1) => {
	el.set=v => {el.value=v,cb()};
	let s=el.style;
	s.maxHeight=s.resize='none', s.minHeight=0, s.height='auto';
	el.setAttribute('rows',minRows);
	function cb() {
		if(el.scrollHeight===0) return setTimeout(cb,1); //Still loading
		el.setAttribute('rows',1);
		//Override style
		let cs=getComputedStyle(el);
		s.setProperty('overflow','hidden','important');
		s.width=el.innerRect.w+'px', s.boxSizing='content-box', s.borderWidth=s.paddingInline=0;
		//Calc scroll height
		let pad=parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
		lh=cs.lineHeight==='normal' ? parseFloat(cs.height) : parseFloat(cs.lineHeight),
		rows=Math.round((Math.round(el.scrollHeight) - pad)/lh);
		//Undo overrides & apply
		s.overflow=s.width=s.boxSizing=s.borderWidth=s.paddingInline='';
		el.setAttribute('rows',utils.bounds(rows, minRows, maxRows));
	}
	el.addEventListener('input',cb);
}

//Format Number as currency. Uses '$' by default
utils.formatCost = (n, sym='$') => {
	if(!n) return sym+'0.00';
	const p=n.toFixed(2).split('.');
	return sym+p[0].split('').reverse().reduce((a,n,i) =>
		n=='-'?n+a:n+(i&&!(i%3)?',':'')+a,'')+'.'+p[1];
}

//Convert Number to fixed-length
//Set radix to 16 for HEX
utils.fixedNum = function(n,len,radix=10) {
	let s=Math.abs(n).toString(radix).toUpperCase();
	return (n<0?'-':'')+(radix==16?'0x':radix==2?'0b':'')+'0'.repeat(Math.max(len-s.length,0))+s;
}

utils.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fixed2(n) {return n<=9?'0'+n:n}

//Set 'datetime-local' or 'date' input from JS Date object or string, adjusting for local timezone
utils.setDateTime = (el, date) => {
	if(!(date instanceof Date)) date=new Date(date);
	el.value = new Date(date.getTime() - date.getTimezoneOffset()*60000).
		toISOString().slice(0, el.type==='date'?10:19);
}
//Get value of 'datetime-local' or 'date' input as JS Date
utils.getDateTime = el => new Date(el.value+(el.type==='date'?'T00:00':''));

//Format Date object into human-readable string
//opt:
//	sec: True to include seconds
//	ms: True or 3 to include milliseconds (requires sec), 2 or 1 to limit precision
//	h24: True to use 24-hour time
//	time: True to show time only, false to show date only, null to show both
//	suf: False to drop date suffix (1st, 2nd, etc.)
//	year: False to hide year, or a number to show year only if it differs from given year
//	df: True to put date first instead of time
utils.formatDate = (d, opt={}) => {
	let t='',yy,dd;
	if(d==null || !d.getDate || !((yy=d.getFullYear())>1969)) return "[Invalid Date]";
	if(opt.time==null||opt.time) {
		let h=d.getHours(),pm=''; if(!opt.h24) {pm=' AM'; if(h>=12) pm=' PM',h-=12; if(!h) h=12}
		t=h+':'+fixed2(d.getMinutes())+(opt.sec?':'+fixed2(d.getSeconds())
			+(opt.ms?(d.getMilliseconds()/1000).toFixed(Number.isFinite(opt.ms)?opt.ms:3).slice(1):''):'');
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

//Create element of type with parent, className, style object, and innerHTML string
//(Just remember the order PCSI!) Use null to leave any parameter blank
utils.mkEl = (t,p,c,s,i) => {
	const e=document.createElement(t);
	if(c!=null) e.className=c; if(i!=null) e.innerHTML=i;
	if(s && typeof s=='object') for(let k in s) {
		if(k in e.style) e.style[k]=s[k]; else e.style.setProperty(k,s[k]);
	}
	if(p!=null) p.appendChild(e); return e;
}
utils.mkDiv = (p,c,s,i) => utils.mkEl('div',p,c,s,i);
utils.addText = (el, text) => el.appendChild(document.createTextNode(text));

//Get predicted width of text given CSS font style
utils.textWidth = (txt, font) => {
	const c=window.TWCanvas||(window.TWCanvas=utils.mkEl('canvas')),
	ctx=c.getContext('2d'); ctx.font=font; return ctx.measureText(txt).width;
}

//It's useful for any canvas-style app to have the page dimensions on hand
utils.define(utils, 'w', ()=>innerWidth);
utils.define(utils, 'h', ()=>innerHeight);

/*Set a nested/recursive property in an object, even if the higher levels don't exist. Useful for defining settings in a complex config object
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

/*Gets a nested/recursive property in an object, returning undefined if it or any higher level doesn't exist. Useful for reading settings from a complex config object
obj: Object to read property from
path: String (dot separated) or array defining the path to the property*/
utils.getPropSafe = (obj, path) => {
	if(typeof path=='string') path=path.split('.');
	try {for(let p of path) obj=obj[p]; return obj} catch(_) {}
}

//Remove 'empty' elements like 0, false, ' ', undefined, and NaN from array
//Often useful in combination with Array.split. Set 'keepZero' to true to keep '0's
//Function by: Pecacheu & https://stackoverflow.com/users/5445/cms
utils.proto(Array, 'clean', function(kz) {
	for(let i=0,e,l=this.length; i<l; ++i) {
		e=this[i]; if(utils.isBlank(e) || e === false ||
		!kz && e === 0) this.splice(i--,1),l--;
	} return this;
})

//Remove first instance of item from array. Returns false if not found
//Use a while loop to remove all instances
utils.proto(Array, 'remove', function(itm) {
	const i=this.indexOf(itm); if(i==-1) return false;
	this.splice(i,1); return true;
})

//Calls fn on each index of array
//fn: Callback function(element, index, length)
//st: Start index, optional. If negative, relative to end of array
//en: End index, optional. If negative, relative to end of array
//If fn returns '!', it will remove the element from the array
//Otherwise, if fn returns any non-null value,
//the loop is broken and the value is returned by each
function each(fn,st,en) {
	let l=this.length,i=Math.max(st<0?l+st:(st||0),0),r;
	if(en!=null) l=Math.min(en<0?l+en:en,l);
	for(; i<l; ++i) if((r=fn(this[i],i,l))==='!') {
		this instanceof HTMLCollection?this[i].remove():this.splice(i,1); --i,--l;
	} else if(r!=null) return r;
}

//Adds async support to each
//pe: true (default) to enable parallel async execution
async function eachAsync(fn,st,en,pe=true) {
	let l=this.length,i=st=Math.max(st<0?l+st:(st||0),0),n,r=[];
	if(en!=null) l=Math.min(en<0?l+en:en,l);
	for(; i<l; ++i) {
		n=fn(this[i],i,l);
		if(!pe) { n=await n; if(n!=='!' && n!=null) return n; }
		r.push(n);
	}
	if(pe) r=await Promise.all(r);
	for(i=st,n=0; i<l; ++i,++n) if(r[n]==='!') {
		this instanceof HTMLCollection?this[i].remove():this.splice(i,1); --i,--l;
	} else if(r[n]!=null) return r[n];
}
[Array,HTMLCollection,NodeList].forEach(p => {utils.proto(p,'each',each), utils.proto(p,'eachAsync',eachAsync)});

const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', B64URL=B64.replace('+/','-_'),
B64F={43:62,47:63,48:52,49:53,50:54,51:55,52:56,53:57,54:58,55:59,56:60,57:61,65:0,66:1,67:2,68:3,69:4,70:5,71:6,72:7,73:8,
	74:9,75:10,76:11,77:12,78:13,79:14,80:15,81:16,82:17,83:18,84:19,85:20,86:21,87:22,88:23,89:24,90:25,97:26,98:27,99:28,
	100:29,101:30,102:31,103:32,104:33,105:34,106:35,107:36,108:37,109:38,110:39,111:40,112:41,113:42,114:43,115:44,116:45,
	117:46,118:47,119:48,120:49,121:50,122:51,45:62,95:63};

//Polyfill for Uint8Array.toBase64
if(!('toBase64' in Uint8Array.prototype)) utils.proto(Uint8Array, 'toBase64', function(opt) {
	let l=this.byteLength, br=l%3, b=opt&&opt.alphabet==='base64url'?B64URL:B64, i=0,str='',chk; l-=br;
	for(; i<l; i+=3) {
		chk = (this[i]<<16)|(this[i+1]<<8)|this[i+2];
		str += b[(chk&16515072)>>18] + b[(chk&258048)>>12] + b[(chk&4032)>>6] + b[chk&63];
	}
	if(br==1) {
		chk = this[l];
		str += b[(chk&252)>>2] + b[(chk&3)<<4];
		if(!opt || !opt.omitPadding) str += '=';
	} else if(br==2) {
		chk = (this[l]<<8)|this[l+1];
		str += b[(chk&64512)>>10] + b[(chk&1008)>>4] + b[(chk&15)<<2];
		if(!opt || !opt.omitPadding) str += '==';
	}
	return str;
})

function b64Char(s,i) {
	s=B64F[s.charCodeAt(i)];
	if(s==null) throw "Bad char at "+i;
	return s;
}

//Polyfill for Uint8Array.fromBase64
if(!('fromBase64' in Uint8Array)) utils.proto(Uint8Array, 'fromBase64', str => {
	let l=str.length, i=l-1;
	for(; i>=0; --i) if(str.charCodeAt(i)!==61) break;
	l=i+1,i=0; let br=l%4; l-=br; if(br==1) throw "Bad b64 len";
	let arr=new Uint8Array(l*3/4+(br?br-1:0)), b=-1,chk;
	for(; i<l; i+=4) {
		chk = (b64Char(str,i)<<18)|(b64Char(str,i+1)<<12)|(b64Char(str,i+2)<<6)|b64Char(str,i+3);
		arr[++b]=chk>>16, arr[++b]=chk>>8, arr[++b]=chk;
	}
	if(br==2) {
		arr[++b] = (b64Char(str,i)<<2)|(b64Char(str,i+1)>>4);
	} else if(br==3) {
		chk = (b64Char(str,i)<<10)|(b64Char(str,i+1)<<4)|(b64Char(str,i+2)>>2);
		arr[++b]=chk>>8, arr[++b]=chk;
	}
	return arr;
},1)

const R_ESC1=/[|\\{}()[\]^$+*?.]/g, R_ESC2=/-/g;

//Polyfill for RegExp.escape by https://github.com/sindresorhus
if(!('escape' in RegExp)) utils.proto(RegExp, 'escape', s => {
	return s.replace(R_ESC1,'\\$&').replace(R_ESC2,'\\x2d');
},1)

//Get an element's index in its parent. Returns -1 if the element has no parent
utils.define(Element.prototype, 'index', function() {
	const p=this.parentElement; if(!p) return -1;
	return Array.prototype.indexOf.call(p.children, this);
})

//Insert child at index
utils.proto(Element, 'insertChildAt', function(el, i) {
	if(i<0) i=0; if(i >= this.children.length) this.appendChild(el);
	else this.insertBefore(el, this.children[i]);
})

//Get element bounding rect as UtilRect object
utils.boundingRect=e => new UtilRect(e.getBoundingClientRect());
utils.innerRect=e => {
	let r=e.getBoundingClientRect(), s=getComputedStyle(e);
	return new UtilRect(r.top+parseFloat(s.paddingTop)+parseFloat(s.borderTopWidth),
		r.bottom-parseFloat(s.paddingBottom)-parseFloat(s.borderBottomWidth),
		r.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),
		r.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth));
};
utils.define(Element.prototype,'boundingRect',function() {return utils.boundingRect(this)});
utils.define(Element.prototype,'innerRect',function() {return utils.innerRect(this)});

//No idea why this isn't built-in, but it's not
Math.cot = x => 1/Math.tan(x);

//Check if string, array, or other object is empty
utils.isBlank = s => {
	if(s == null) return true;
	if(typeof s == 'string') return !/\S/.test(s);
	if(typeof s == 'object') {
		if(typeof s.length == 'number') return s.length === 0;
		return Object.keys(s).length === 0;
	}
	return false;
}

//Finds first empty (undefined) slot in array
utils.firstEmpty = arr => {
	const len = arr.length;
	for(let i=0; i<len; ++i) if(arr[i] == null) return i;
	return len;
}

//Like 'firstEmpty', but uses letters a-Z instead
utils.firstEmptyChar = obj => {
	const keys = Object.keys(obj), len = keys.length;
	for(let i=0; i<len; ++i) if(obj[keys[i]] == null) return keys[i];
	return utils.numToChar(len);
}

//Converts a number into letters (upper and lower) from a to Z
utils.numToChar = n => {
	if(n<=25) return String.fromCharCode(n+97);
	else if(n>=26 && n<=51) return String.fromCharCode(n+39);
	let mVal, fVal;
	if(n<2756) { mVal=rstCount(Math.floor(n/52)-1,52); fVal=rstCount(n,52); }
	else if(n<143364) { mVal=rstCount(Math.floor((n-52)/2704)-1,52); fVal=rstCount(n-52,2704)+52; }
	else if(n<7454980) { mVal=rstCount(Math.floor((n-2756)/140608)-1,52); fVal=rstCount(n-2756,140608)+2756; }
	else return false; //More than "ZZZZ"? No. Just, no
	return utils.numToChar(mVal)+utils.numToChar(fVal);
}

//Use this to reset your counter each time 'maxVal' is reached
function rstCount(val, maxVal) { while(val >= maxVal) val -= maxVal; return val; }

//Semi-recursively merges two (or more) objects, giving the last precedence
//If both objects contain a property at the same index, and both are Arrays/Objects, they are merged
utils.merge = function(o/*, src1, src2...*/) {
	for(let a=1,al=arguments.length,n,oP,nP; a<al; ++a) {
		n = arguments[a]; for(let k in n) {
			oP = o[k]; nP = n[k]; if(oP && nP) { //Conflict
				if(oP.length >= 0 && nP.length >= 0) { //Both Array-like
					for(let i=0,l=nP.length,ofs=oP.length; i<l; ++i) oP[i+ofs] = nP[i]; continue;
				} else if(typeof oP == 'object' && typeof nP == 'object') { //Both Objects
					for(let pk in nP) oP[pk] = nP[pk]; continue;
				}
			}
			o[k] = nP;
		}
	}
	return o;
}

//Keeps value within max/min bounds. Also handles NaN or null
utils.bounds = (n, min=0, max=1) => {
	if(!(n>=min)) return min; if(!(n<=max)) return max; return n;
}

//'Normalizes' a value so that it ranges from min to max, but unlike utils.bounds,
//this function retains input's offset. This can be used to normalize angles
utils.norm = utils.normalize = (n, min=0, max=1) => {
	const c = Math.abs(max-min);
	if(n < min) while(n < min) n += c; else while(n >= max) n -= c;
	return n;
}

//Finds and removes all instances of 'rem' contained within s
utils.cutStr = (s, rem) => {
	let fnd; while((fnd=s.indexOf(rem)) != -1) {
		s = s.slice(0, fnd)+s.slice(fnd+rem.length);
	}
	return s;
}

//Cuts text out of 'data' from first instance of 'startString' to next instance of 'endString'
//(data,startString,endString[,index[,searchStart]])
//index: Optional object. index.s and index.t will be set to start and end indexes
utils.dCut = (d, ss, es, sd, st) => {
	let is = d.indexOf(ss,st?st:undefined)+ss.length, it = d.indexOf(es,is);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.slice(is,it);
}
utils.dCutToLast = (d, ss, es, sd, st) => {
	let is = d.indexOf(ss,st?st:undefined)+ss.length, it = d.lastIndexOf(es);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.slice(is,it);
}
utils.dCutLast = (d, ss, es, sd, st) => {
	let is = d.lastIndexOf(ss,st?st:undefined)+ss.length, it = d.indexOf(es,is);
	if(sd) sd.s=is,sd.t=it; return (is < ss.length || it <= is)?'':d.slice(is,it);
}

//Given CSS property value 'prop', returns object with
//space-separated values from the property string
utils.parseCSS = prop => {
	let pArr={}, pKey="", keyNum=0; prop=prop.trim();
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
			let end=prop.indexOf(')'), pStr=prop.slice(1,end);
			pArr[pKey] = parseInner(pStr);
			pKey = ""; prop = prop.slice(end+1);
		} else if(prop.search(/[#!\w]/) == 0) {
			if(pKey) pArr[keyNum++] = pKey;
			let end=prop.search(/[^#!\w-%]/); if(end==-1) end=prop.length;
			pKey = prop.slice(0,end); prop = prop.slice(end);
		} else prop = prop.slice(1);
	}
	if(pKey) pArr[keyNum] = pKey; return pArr;
}

//Rebuilds CSS string from a parseCSS object
utils.buildCSS = propArr => {
	const keyArr=Object.keys(propArr), l=keyArr.length; let pStr='', i=0;
	while(i<l) {
		const k=keyArr[i], v=propArr[keyArr[i]]; ++i;
		if(0<=Number(k)) pStr+=v+' '; else pStr+=`${k}(${v}) `;
	}
	return pStr.slice(0,-1);
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
//with key/value pairs representing the properties you want to add to the class
utils.addClass = (className, propList) => {
	const style = defaultStyle(), keys = Object.keys(propList); let str='';
	for(let i=0,l=keys.length; i<l; ++i) str += toKey(keys[i])+":"+propList[keys[i]]+";";
	style.addRule("."+className,str);
}

//Create a CSS selector and append it to the current document
utils.addId = (idName, propList) => {
	const style = defaultStyle(), keys = Object.keys(propList); let str='';
	for(let i=0,l=keys.length; i<l; ++i) str += toKey(keys[i])+":"+propList[keys[i]]+";";
	style.addRule("#"+idName,str);
}

//Create a CSS keyframe and append it to the current document
utils.addKeyframe = (name, content) => {
	defaultStyle().addRule("@keyframes "+name,content);
}

//Remove a specific css selector (including the '.' or '#') from all stylesheets in the current document
utils.removeSelector = name => {
	for(let s=0,style,rList,j=document.styleSheets.length; s<j; ++s) {
		style = document.styleSheets[s]; try { rList=style.cssRules; } catch(e) { continue; }
		for(let key in rList) if(rList[key].constructor.name == "CSSStyleRule"
			&& rList[key].selectorText == name) style.deleteRule(key);
	}
}

//Converts HEX color to 24-bit RGB
utils.hexToRgb = hex => {
	const c = parseInt(hex.slice(1),16);
	return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

//By mjackson @ GitHub
utils.rgbToHsl = (r,g,b) => {
	r /= 255, g /= 255, b /= 255;
	let max=Math.max(r,g,b), min=Math.min(r,g,b), h,s,l=(max+min)/2;
	if(max===min) h=s=0; //Achromatic
	else {
		let d=max-min;
		s=l>.5 ? d/(2-max-min) : d/(max+min);
		switch(max) {
			case r: h=(g-b)/d + (g<b?6:0); break;
			case g: h=(b-r)/d + 2; break;
			case b: h=(r-g)/d + 4;
		}
		h /= 6;
	}
	return [h*360, s*100, l*100];
}

//Generates random integer from min to max
utils.rand = (min, max, res, ease) => {
	res=res||1; max*=res,min*=res; let r=Math.random();
	return Math.round((ease?ease(r):r)*(max-min)+min)/res;
}

//Parses a url query string into an Object
utils.fromQuery = str => {
	if(str.startsWith('?')) str=str.slice(1);
	function parse(pl, pairs) {
		const pair=pairs[0], spl=pair.indexOf('='),
			key=decodeURIComponent(pair.slice(0,spl)),
			val=decodeURIComponent(pair.slice(spl+1));
		//Handle multiple params of the same name
		if(pl[key] == null) pl[key] = val;
		else if(Array.isArray(pl[key])) pl[key].push(val);
		else pl[key] = [pl[key],val];
		return pairs.length===1 ? pl : parse(pl, pairs.slice(1));
	}
	return str ? parse({}, str.split('&')) : {};
}

//Converts an object into a url query string
utils.toQuery = obj => {
	let str='',key,val;
	if(typeof obj !== 'object') return encodeURIComponent(obj);
	for(key in obj) {
		val = obj[key];
		if(typeof val === 'object' && val != null) val = JSON.stringify(val);
		str += '&'+key+'='+encodeURIComponent(val);
	}
	return str.slice(1);
}

//Various methods of centering objects using JavaScript
//obj: Object to center
//only: 'x' for only x axis centering, 'y' for only y axis, null for both
//type: 'trans' or null, modes explained below
utils.center = (obj, only, type) => {
	let os=obj.style;
	if(type == 'trans') { //Responsive, doesn't create container
		if(!os.position) os.position='absolute';
		let trans=utils.cutStr(os.transform, 'translateX(-50%)');
		trans=utils.cutStr(trans, 'translateY(-50%)');
		if(!only || only == 'x') os.left='50%', trans+='translateX(-50%)';
		if(!only || only == 'y') os.top='50%', trans+='translateY(-50%)';
		if(trans) os.transform=trans;
	} else { //New flexbox method
		let cont=utils.mkDiv(obj.parentNode, null, {display:'flex', top:0, left:0});
		cont.appendChild(obj), cont=cont.style;
		if(!only || only == 'x') cont.justifyContent='center', cont.width='100%';
		if(!only || only == 'y') cont.alignItems='center',
			cont.height='100%', cont.position='absolute';
	}
}

//Loads a file and returns its contents using HTTP GET
//Callback parameters: (err, data, req)
//err: Non-zero on error. Standard HTTP error codes
//data: Response text
//req: Full XMLHttpRequest object
//meth: Optional HTTP method, default is GET
//body: Optional body content
//hd: Optional header list
utils.loadAjax = (path, cb, meth, body, hd) => {
	let R; try {R=new XMLHttpRequest()} catch(e) {return cb(e)}
	if(hd) for(let k in hd) R.setRequestHeader(k,hd[k]);
	R.open(meth||'GET',path); R.onreadystatechange = () => {
		let s=R.status||-1;
		if(R.readyState == R.DONE) cb(s==200?0:s, R.response, R);
	}
	R.send(body||undefined);
}

//Good fallback for loadAjax. Loads a file at the address via HTML object tag
//Callback is fired with either received data, or 'false' if unsuccessful
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
//is fired with either received data, or 'false' if unsuccessful
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

//Downloads a file from a link
utils.dlFile = (fn,uri) => {
	return fetch(uri).then(r => { if(r.status != 200) throw "Code "+r.status; return r.blob(); })
		.then(b => { utils.dlData(fn,b); });
}
//Downloads a file generated from a Blob or ArrayBuffer
utils.dlData = (fn,d) => {
	let o,e=utils.mkEl('a',document.body,null,{display:'none'});
	if(typeof d=='string') o=d; else {
		if(!(d instanceof Blob)) d=Blob(d); o=URL.createObjectURL(d);
	}
	e.href=o,e.download=fn; e.click(); e.remove(); URL.revokeObjectURL(o);
}

//Converts from radians to degrees, so you can work in degrees
//Function by: The a**hole who invented radians
utils.deg = rad => rad*180/Math.PI;

//Converts from degrees to radians, so you can convert back for given stupid library
//Function by: The a**hole who invented radians
utils.rad = deg => deg*Math.PI/180;

//Pecacheu's ultimate unit translation formula!
//This Version -- Bounds Checking: NO, Rounding: NO, Max/Min Switching: NO, Easing: YES
utils.map = (input, minIn, maxIn, minOut, maxOut, ease) => {
	let i=(input-minIn)/(maxIn-minIn); return ((ease?ease(i):i)*(maxOut-minOut))+minOut;
}

//setTimeout but async
utils.delay = ms => new Promise(r => setTimeout(r,ms));

UtilRect = function(t,b,l,r) {
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
utils.proto(UtilRect, 'contains', function(x,y) {
	if(x instanceof Element) return this.contains(x.boundingRect);
	if(x instanceof UtilRect) return x.x >= this.x && x.x2 <= this.x2 && x.y >= this.y && x.y2 <= this.y2;
	return x >= this.x && x <= this.x2 && y >= this.y && y <= this.y2;
})

//Check if rect overlaps rect or Element
utils.proto(UtilRect, 'overlaps', function(r) {
	if(r instanceof Element) return this.overlaps(r.boundingRect);
	if(!(r instanceof UtilRect)) return 0; let x,y;
	if(r.x2-r.x >= this.x2-this.x) x = this.x >= r.x && this.x <= r.x2 || this.x2 >= r.x && this.x2 <= r.x2;
	else x = r.x >= this.x && r.x <= this.x2 || r.x2 >= this.x && r.x2 <= this.x2;
	if(r.y2-r.y >= this.y2-this.y) y = this.y >= r.y && this.y <= r.y2 || this.y2 >= r.y && this.y2 <= r.y2;
	else y = r.y >= this.y && r.y <= this.y2 || r.y2 >= this.y && r.y2 <= this.y2;
	return x&&y;
})

//Get distance from this rect to point, other rect, or Element
utils.proto(UtilRect, 'dist', function(x,y) {
	if(x instanceof Element) return this.dist(x.boundingRect); let n=(x instanceof UtilRect);
	y=Math.abs((n?x.centerY:y)-this.centerY), x=Math.abs((n?x.centerX:x)-this.centerX);
	return Math.sqrt(x*x+y*y);
})

//Expand (or contract if negative) a UtilRect by num of pixels
//Useful for using UtilRect objects as element hitboxes. Returns self for chaining
utils.proto(UtilRect, 'expand', function(by) {
	this.top -= by; this.left -= by; this.bottom += by;
	this.right += by; return this;
})

})();

//JavaScript Easing Library by: https://github.com/gre & https://gizma.com/easing
//t should be between 0 and 1
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

//Node.js compat
if(_uNJS && !global.utils) {
	let os = import('os').then(m => os=m);

	//Get list of system IPs
	utils.getIPs = () => {
		const ip=[], fl=os.networkInterfaces();
		for(let k in fl) fl[k].forEach(f => {
			if(!f.internal && f.family == 'IPv4' && f.mac != '00:00:00:00:00:00' && f.address) ip.push(f.address);
		});
		return ip.length?ip:0;
	}

	//Get system OS, arch, and CPU info
	utils.getOS = () => {
		let sysOS, arch, cpu;
		switch(os.platform()) {
			case 'win32': sysOS="Windows"; break;
			case 'darwin': sysOS="MacOS"; break;
			case 'linux': sysOS="Linux"; break;
			default: sysOS=os.platform();
		}
		switch(os.arch()) {
			case 'ia32': arch="32-bit"; break;
			case 'x64': arch="64-bit"; break;
			case 'arm': arch="ARM"; break;
			default: arch=os.arch();
		}
		cpu=os.cpus()[0].model;
		return [sysOS, arch, cpu];
	}

	global.utils=utils;
	global.UtilRect=UtilRect;
	global.Easing=Easing;
}
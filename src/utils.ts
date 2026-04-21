//https://github.com/Pecacheu/Utils.js; GNU GPL v3

//Node.js compat
//@ts-ignore
type P = [typeof document, typeof HTMLCollection];
//@ts-expect-error
const IsNode=typeof window==='undefined', P:P=IsNode?[{}, class{}]:[document, HTMLCollection];

//-------------------------------------------- Types --------------------------------------------

declare global {
export interface Array<T> {
	/** Remove 'empty' elements like 0, false, ' ', undefined, and NaN from array.
	Often useful in combination with Array.split
	@param keepZero Keep `0`s */
	clean(keepZero?: boolean): this;
	/** Remove first instance of item from array. Use a while loop to remove all instances
	@returns true if found */
	remove(itm: T): boolean;
	/** Calls `fn` on each index of array

	If fn returns `!`, it will remove the element from the array.
	Otherwise, if fn returns any non-null value, the loop is
	broken and the value is returned by each
	@param fn: Callback function(itm, idx, len)
	@param st: Start index. If negative, relative to end
	@param en: End index. If negative, relative to end */
	each: <R>(fn: (itm: T, idx: number, len: number) => R | "!",
	st?: number, en?: number) => (R | undefined);
	/** Adds async support to `Array.each`
	@param pe: Enable parallel async execution */
	eachAsync: <R>(fn: (itm: T, idx: number, len: number) => R | "!",
	st?: number, en?: number, pe?: boolean) => Promise<R | undefined>;
	/** Find first `undefined` or `null` slot in array */
	firstEmpty(): number;
	//Polyfill
	at(idx: number): T | undefined;
}

export interface Function {
	/** Wrap a function so that it always has a preset argument list when called.
	In the called function, `this` is set to the caller's arguments, granting access to both */
	wrap<A extends any[], R>(this: (this: any, ...args: A) => R, ...args: A): (this: any, ...args: any[]) => R;
}

export interface Math {
	/** Cotangent */
	cot(x: number): number;
}

export interface RegExpConstructor {
	/** Escapes regex syntax characters */
	escape(s: string): string;
}

interface Base64Opts {
	alphabet?: 'base64'|'base64url';
	omitPadding?: boolean;
}
export interface Uint8ArrayConstructor {
	fromBase64(str: string, opts: Base64Opts): Uint8Array;
}
export interface Uint8Array {
	toBase64(opts: Base64Opts): string;
}
}

export interface AnyMap {[k: string]: any};
export interface StringMap {[k: string]: string};
export interface QueryMap {[k: string]: true | string | string[]};

//-------------------------------------------- Extensions --------------------------------------------

export namespace utils {
const [document, HTMLCollection] = P;

/** Current library version */
export const VER = "v9.1.0";

/** Whether the environment is Node.js or Browser */
export const isNode = IsNode;

/** Import modules only in Node.js, otherwise return empty list */
export const importNode = async (...mods: string[]) => (IsNode ? Promise.all(mods.map(i => import(i))) : []) as any[];

//==== Objects ====

/** Add getter and/or setter for `name` to `obj` */
export function define(obj: Object, name: string | string[],
get?: () => any | null, set?: (v: any) => void | null) {
	const t = {get: get||undefined, set: set||undefined};
	if(Array.isArray(name)) for(const n of name) Object.defineProperty(obj,n,t);
	else Object.defineProperty(obj,name,t);
}

/** Define immutable, non-enumerable property or method in object prototype
@param isStat Define static property directly on object
@param isWrite Make property writable */
export function proto(obj: Object, name: string, val: any, isStat?: boolean, isWrite?: boolean) {
	const t = {value: val, writable: !!isWrite};
	if(!isStat) obj = (obj as any).prototype;
	if(Array.isArray(name)) for(const n of name) Object.defineProperty(obj,n,t);
	else Object.defineProperty(obj,name,t);
}

/** Deep (recursive) Object.create
@param sub Copy down to given sub-levels, defaults to all */
export function copy<T>(obj: T, sub?: number) {
	if(sub === 0 || typeof obj !== 'object') return obj;
	sub = sub!>0?sub!-1:undefined;
	let o2: AnyMap;
	if(Array.isArray(obj)) {
		o2 = new Array(obj.length);
		obj.forEach((v,i) => o2[i] = copy(v,sub));
	} else {
		o2 = {};
		for(let k in obj) o2[k] = copy(obj[k],sub);
	}
	return o2 as T;
}

/** Recursively merges two (or more) objects, giving the last precedence

If both objects contain a property at the same index, and both are Arrays/Objects, they are merged */
export function merge(dest: AnyMap, ...src: AnyMap[]) {
	let oP: any, nP: any;
	for(const s of src) for(const key in s) {
		oP = dest[key], nP = s[key];
		if(oP && nP) { //Conflict
			if(oP.length >= 0 && nP.length >= 0) { //Both Array-like
				Array.prototype.push.apply(oP, nP); continue;
			} else if(typeof oP === 'object' && typeof nP === 'object') { //Both Objects
				merge(oP, nP); continue;
			}
		}
		dest[key] = nP;
	}
	return dest;
}

/** Safely set nested property in object, even if the higher levels don't exist.
Useful for defining settings in a complex config object
@param path Dot-separated string or array defining the path to the property
@param val Value to set
@param onlyNull Don't overwrite existing values
@returns True if successful */
export function setProp(obj: AnyMap, path: string | string[], val: any, onlyNull=false) {
	if(typeof path === 'string') path = path.split('.');
	let i=0, l=path.length-1, o=obj;
	for(; i<l; ++i) {
		o = o[path[i]!];
		if(!o || typeof o !== 'object') {
			if(onlyNull) return false;
			o = obj[path[i]!] = {};
		}
	}
	const p = path.at(-1)!;
	if(onlyNull && o[p] != null) return false;
	o[p] = val; return true;
}

/** Safely get nested property in object. Useful for reading config settings
@param path Dot-separated string or array defining the path to the property
@returns Value or `undefined` if it or any level doesn't exist */
export function getProp(obj: AnyMap, path: string | string[]): any {
	if(typeof path === 'string') path = path.split('.');
	try {
		for(const p of path) obj=obj[p];
		return obj;
	} catch(_) {}
}

//==== Arrays ====

//By Pecacheu & https://stackoverflow.com/users/5445/cms
proto(Array, 'clean', function(this: any[], kz: boolean) {
	for(let i=0, l=this.length, e: any; i<l; ++i) {
		e=this[i];
		if(isBlank(e) || e===false || !kz && e===0) this.splice(i--,1),--l;
	}
	return this;
});

proto(Array, 'remove', function(this: any[], itm: any) {
	const i=this.indexOf(itm); if(i===-1) return false;
	this.splice(i,1); return true;
});

proto(Array, 'firstEmpty', function(this: any[]) {
	const l = this.length;
	for(let i=0; i<l; ++i) if(this[i] == null) return i;
	return l;
});

function each(this: any[], fn: (itm: any, idx: number, len: number) => any, st?: number, en?: number) {
	let l=this.length, i=Math.max(st!<0?l+st!:(st||0),0), r: any;
	if(en!=null) l=Math.min(en<0?l+en:en,l);
	for(; i<l; ++i) if((r=fn(this[i],i,l))==='!') {
		this instanceof HTMLCollection?this[i].remove():this.splice(i,1);
		--i,--l;
	} else if(r!=null) return r;
}
async function eachAsync(this: any[], fn: (itm: any, idx: number, len: number) => any, st?: number, en?: number, pe=true) {
	let l=this.length,i=st=Math.max(st!<0?l+st!:(st||0),0), n: any, r=[];
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

proto(Array, 'each', each);
proto(Array, 'eachAsync', eachAsync);

//==== Numbers ====

//JS Math w/ BigInt support
type Num = number | bigint;
const BI=typeof BigInt==='undefined'?(n: Num)=>n:BigInt, B0=BI(0);
export const abs = (x: Num) => typeof x==='bigint'?(x<B0?-x:x):Math.abs(x);
export const min = (...args: Num[]) => {let v:Num,m:Num|undefined; for(v of args) v>m!||(m=v); return m!}
export const max = (...args: Num[]) => {let v:Num,m:Num|undefined; for(v of args) v<m!||(m=v); return m!}

/** Degrees <-> Radians */
export const deg = (rad: number) => rad*180/Math.PI;
export const rad = (deg: number) => deg*Math.PI/180;
Math.cot = x => 1/Math.tan(x);

/** Convert Number to fixed-length
@param radix Set to `16` for Hex or `2` for Binary */
export function fixedNum(n: Num, len: Num, radix=10) {
	if(typeof len==='bigint') len=Number(len);
	let s=abs(n).toString(radix).toUpperCase();
	return (n<0?'-':'')+(radix==16?'0x':radix==2?'0b':'')+'0'.repeat(Math.max(len-s.length,0))+s;
}

/** Truncate n to range `[min,max]`. Also handles NaN or null */
export const bounds = <T extends Num>(n: T, min: T=0 as T, max: T=1 as T) => n>=min?n<=max?n:max:min;

/** Normalize n to the range `[min,max)`, keeping offset.
Behaves similar to modulus operator, but min doesn't have to be 0 */
export function norm<T extends Num>(n: T, min: T=0 as T, max: T=1 as T): T {
	let r = max-min;
	//@ts-expect-error
	return ((n + abs(min))%r+r)%r+min;
}

/** Pecacheu's ultimate unit translation formula! */
export function map(input: number, minIn: number,
maxIn: number, minOut: number, maxOut: number, ease?: Ease) {
	let i = (input-minIn)/(maxIn-minIn);
	return ((ease?ease(i):i)*(maxOut-minOut))+minOut;
}

/** Convert HEX color to 24-bit RGB */
export function hexToRgb(hex: string) {
	const c = parseInt(hex.slice(1), 16);
	return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

//By mjackson @ GitHub
/** Convert R,G,B to H,S,L values */
export function rgbToHsl(r: number, g: number, b: number) {
	r /= 255, g /= 255, b /= 255;
	let max=Math.max(r,g,b), min=Math.min(r,g,b), h,s,l=(max+min)/2;
	if(max===min) h=s=0; //Achromatic
	else {
		let d=max-min;
		s=l>.5 ? d/(2-max-min) : d/(max+min);
		switch(max) {
			case r: h=(g-b)/d + (g<b?6:0); break;
			case g: h=(b-r)/d + 2; break;
			default: h=(r-g)/d + 4;
		}
		h /= 6;
	}
	return [h*360, s*100, l*100];
}

/** Generate random number from min to max
@param res Minimum step between min and max (1 by default for ints)
@param bias Bias the results using an Ease function */
export function rand(min: number, max: number, res=1, bias?: Ease) {
	max*=res,min*=res; let r=Math.random();
	return Math.round((bias?bias(r):r)*(max-min)+min)/res;
}

/** Format Number as currency. Uses `$` by default */
export function formatCost(num: number, sym='$') {
	if(!num) return sym+'0.00';
	const p=num.toFixed(2).split('.');
	return sym+(p[0]!).split('').reverse().reduce((a,n,i) =>
		n=='-'?n+a:n+(i&&!(i%3)?',':'')+a,'')+'.'+p[1];
}

//JavaScript Easing Library by: https://github.com/gre & https://gizma.com/easing
//t should be between 0 and 1
export type Ease = (t: number) => number;
export const Easing: {[k: string]: Ease} = {
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

//==== Polyfills ====

//Polyfill for RegExp.escape by https://github.com/sindresorhus
const R_ESC1=/[|\\{}()[\]^$+*?.]/g, R_ESC2=/-/g;
if(!('escape' in RegExp)) proto(RegExp, 'escape', (s: string) => {
	return s.replace(R_ESC1,'\\$&').replace(R_ESC2,'\\x2d');
}, true);

const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', B64URL=B64.replace('+/','-_'),
B64F={43:62,47:63,48:52,49:53,50:54,51:55,52:56,53:57,54:58,55:59,56:60,57:61,65:0,66:1,67:2,68:3,69:4,70:5,71:6,72:7,73:8,
	74:9,75:10,76:11,77:12,78:13,79:14,80:15,81:16,82:17,83:18,84:19,85:20,86:21,87:22,88:23,89:24,90:25,97:26,98:27,99:28,
	100:29,101:30,102:31,103:32,104:33,105:34,106:35,107:36,108:37,109:38,110:39,111:40,112:41,113:42,114:43,115:44,116:45,
	117:46,118:47,119:48,120:49,121:50,122:51,45:62,95:63};

//Polyfill for Uint8Array.toBase64
if(!('toBase64' in Uint8Array.prototype)) proto(Uint8Array, 'toBase64', function(this: Uint8Array, opt: any) {
	let l=this.byteLength, br=l%3, b=opt&&opt.alphabet==='base64url'?B64URL:B64,
	i=0,str='',chk: number; l-=br;
	for(; i<l; i+=3) {
		chk = (this[i]!<<16) | (this[i+1]!<<8) | this[i+2]!;
		str += b[(chk&16515072)>>18]! + b[(chk&258048)>>12] + b[(chk&4032)>>6] + b[chk&63];
	}
	if(br===1) {
		chk = this[l]!
		str += b[(chk&252)>>2]! + b[(chk&3)<<4];
		if(!opt || !opt.omitPadding) str += '=';
	} else if(br===2) {
		chk = (this[l]!<<8) | this[l+1]!
		str += b[(chk&64512)>>10]! + b[(chk&1008)>>4] + b[(chk&15)<<2];
		if(!opt || !opt.omitPadding) str += '==';
	}
	return str;
});

function b64Char(s: string, i: number) {
	const n = B64F[s.charCodeAt(i) as keyof typeof B64F];
	if(n==null) throw "Bad char at "+i;
	return n;
}

//Polyfill for Uint8Array.fromBase64
if(!('fromBase64' in Uint8Array)) proto(Uint8Array, 'fromBase64', (str: string) => {
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
}, true);

if(!('at' in Array.prototype)) proto(Array, 'at', function(this: any[], idx: number) {
	const l=this.length, i=idx<0?l+idx:idx;
	if(i>=0 && i<l) return this[i];
});

//==== Utility ====

proto(Function, 'wrap', function(this: any, ...args: any[]) {
	const f=this; return function() {return f.apply(arguments, args)}
}, false, true);

const R_ES = /\S/;

/** Check if string, array, or object is empty.
Returns false for all other types */
export function isBlank(s: any) {
	if(s == null) return true;
	if(typeof s === 'string') return !R_ES.test(s);
	if(typeof s === 'object') {
		if(typeof s.length === 'number') return s.length === 0;
		return Object.keys(s).length === 0;
	}
	return false;
}

/** setTimeout but async */
export const delay = (ms: number): Promise<void> => new Promise(r => setTimeout(r,ms));

//-------------------------------------------- DOM Model --------------------------------------------

export interface UserAgentInfo {
	os?: string;
	rawOS?: string;
	type?: string;
	version?: string;
	browser?: string;
	engine?: string;
	mobile?: boolean;
}

/** UserAgent-based Mobile device detection
@param ua User Agent string; defaults to navigator.userAgent */
export function deviceInfo(ua?: string) {
	if(!ua) ua = navigator.userAgent;
	const d: UserAgentInfo = {};
	if(!ua.startsWith("Mozilla/5.0 ")) return d;
	let o = ua.indexOf(')'), os: any = d.rawOS=ua.slice(13,o), o2: any, o3: any;
	if(os.startsWith("Windows")) {
		o2=os.split('; '), d.os = "Windows";
		d.type = o2.indexOf('WOW64')!==-1?'x64 PC; x86 Browser':o2.indexOf('x64')!==-1?'x64 PC':'x86 PC';
		o2=os.indexOf("Windows NT "), d.version = os.slice(o2+11,os.indexOf(';',o2+12));
	} else if(os.startsWith("iP")) {
		o2=os.indexOf("OS"), d.os = "iOS", d.type = os.slice(0,os.indexOf(';'));
		d.version = os.slice(o2+3, os.indexOf(' ',o2+4)).replace(/_/g,'.');
	} else if(os.startsWith("Macintosh;")) {
		o2=os.indexOf(" Mac OS X"), d.os = "MacOS", d.type = os.slice(11,o2)+" Mac";
		d.version = os.slice(o2+10).replace(/_/g,'.');
	} else if((o2=os.indexOf("Android"))!==-1) {
		d.os = "Android", d.version = os.slice(o2+8, os.indexOf(';',o2+9));
		o2=os.lastIndexOf(';'), o3=os.indexOf(" Build",o2+2);
		d.type = os.slice(o2+2, o3===-1?undefined:o3);
	} else if(os.startsWith("X11;")) {
		os=os.slice(5).split(/[;\s]+/), o2=os.length;
		d.os = (os[0]==="Linux"?'':"Linux ")+os[0];
		d.type = os[o2-2], d.version = os[o2-1];
	}
	if(o2=Number(d.version)) d.version=o2;
	o2=ua.indexOf(' ',o+2), o3=ua.indexOf(')',o2+1), o3=o3===-1?o2+1:o3+2;
	d.engine = ua.slice(o+2,o2), d.browser = ua.slice(o3);
	d.mobile = !!ua.match(/Mobi/i);
	return d;
}

//==== Cookies! (Yum) ====

/** Set a cookie
@param val Leave blank to unset
@param exp Optional expiry; Set to `-1` for max
@param secure Only allow in HTTPS context */
export function setCookie(key: string, val?: string, exp?: Date | number, secure?: boolean) {
	let c=`${encodeURIComponent(key)}=${val==null?'':encodeURIComponent(val)};path=/`;
	if(val) {
		if(exp != null) {
			if(exp === -1) exp=new Date(9e14);
			if(exp instanceof Date) c+=';expires='+exp.toUTCString();
			else c+=';max-age='+exp;
		}
		if(secure) c+=';secure';
	}
	if(!IsNode) document.cookie = c;
	return c;
}

/** Get a cookie
@param ckStr String to parse; defaults to document.cookie */
export function getCookie(key: string, ckStr?: string) {
	if(ckStr == null) ckStr=document.cookie;
	key=encodeURIComponent(key)+'=';
	let l=ckStr!.split('; '), c: string;
	for(c of l) if(c.startsWith(key))
		return decodeURIComponent(c.slice(key.length));
}

/** Delete a cookie */
export function remCookie(key: string) {
	let c=encodeURIComponent(key)+'=;max-age=0';
	if(!IsNode) document.cookie = c;
	return c;
}

/** Get a list of all cookies
@param ckStr String to parse; defaults to document.cookie */
export function getCookies(ckStr?: string) {
	if(ckStr == null) ckStr=document.cookie;
	if(!ckStr) return {};
	let c,e;
	const d: StringMap = {};
	for(c of ckStr.split('; ')) {
		e=c.indexOf('=');
		d[decodeURIComponent(c.slice(0,e))] = decodeURIComponent(c.slice(e+1));
	}
	return d;
}

//==== Query ====

/** Parse a URL query string into an Object

If a key has no value, it is set to `true`.
If multiple keys with the same name are found, they are combined into an array
@param sep Key separator, defaults to `&` */
export function fromQuery(query: string, sep='&') {
	if(query.startsWith('?')) query=query.slice(1);
	let data: QueryMap = {}, q: string, p: any, k: string, v: any;
	for(q of query.split(sep)) {
		p=q.indexOf('=');
		if(p===-1) k=q, v=true;
		else k=decodeURIComponent(q.slice(0,p)), v=decodeURIComponent(q.slice(p+1));
		if(k in data) {
			p = data[k];
			if(Array.isArray(p)) p.push(v);
			else data[k] = [p,v];
		} else data[k] = v;
	}
	return data;
}

function valToQs(k: string, v: any) {
	if(v === true) return k;
	if(typeof v !== 'string') v=JSON.stringify(v);
	return `${k}=${encodeURIComponent(v)}`;
}

/** Convert Object into a URL query string
@param sep Key separator, defaults to `&` */
export function toQuery(data: QueryMap, sep='&') {
	let q=[], k: string, v: any;
	for(k in data) {
		v=data[k], k=encodeURIComponent(k);
		if(Array.isArray(v)) for(const n of v) q.push(valToQs(k,n));
		else q.push(valToQs(k,v));
	}
	return q.join(sep);
}

//==== Dates ====

export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fixed2(n: number) {return n<=9?'0'+n:n}

export interface DateFormatOpts {
	/** Include seconds */
	sec?: boolean;
	/** True or `3` to include milliseconds (requires sec), `2` or `1` to limit precision */
	ms?: boolean | number;
	/** Use 24-hour time */
	h24?: boolean;
	/** Show time only, false to show date only, null to show both */
	time?: boolean;
	/** Add date suffix (1st, 2nd, etc.), default true */
	suf?: boolean;
	/** Show year (default true), or a number to show year only if it differs from given year */
	year?: boolean | number;
	/** Put date first instead of time */
	df?: boolean;
	/** Date & time separator; defaults to `' '` */
	sep?: string;
}

/** Format Date object into human-readable string */
export function formatDate(d?: Date, opt: DateFormatOpts={}) {
	let t='', yy: number, dd: any;
	if(d==null || !d.getDate || !((yy=d.getFullYear())>1969)) return "[Invalid Date]";
	if(opt.time==null || opt.time) {
		let h=d.getHours(),pm=''; if(!opt.h24) {pm=' AM'; if(h>=12) pm=' PM',h-=12; if(!h) h=12}
		t=h+':'+fixed2(d.getMinutes())+(opt.sec?':'+fixed2(d.getSeconds())+(opt.ms?(d.getMilliseconds()
			/1000).toFixed(Number.isFinite(opt.ms)?opt.ms as number:3).slice(1):''):'');
		t+=pm; if(opt.time) return t;
	}
	dd=d.getDate();
	dd=months[d.getMonth()]+' '+((opt.suf==null||opt.suf)?suffix(dd):dd);
	if((opt.year==null||opt.year) && opt.year!==yy) dd=dd+', '+yy;
	return opt.df?dd+(t&&(opt.sep||' ')+t):(t&&t+(opt.sep||' '))+dd;
}

/** Add suffix to number (eg. 31st, 12th, 22nd) */
export function suffix(n: number) {
	let j=n%10, k=n%100;
	if(j==1 && k!=11) return n+"st";
	if(j==2 && k!=12) return n+"nd";
	if(j==3 && k!=13) return n+"rd";
	return n+"th";
}
}
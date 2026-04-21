//https://github.com/Pecacheu/Utils.js; GNU GPL v3

import { utils as U } from './utils.js';
import type * as UT from './utils.js';
export type * from './utils.js';

//-------------------------------------------- Types --------------------------------------------

declare global {
export interface HTMLCollection {
	each: <R>(fn: (itm: Element, idx: number, len: number) => R | "!",
	st?: number, en?: number) => (R | undefined);
	eachAsync: <R>(fn: (itm: Element, idx: number, len: number) => R | "!",
	st?: number, en?: number, pe?: boolean) => Promise<R | undefined>;
}
export interface NodeList {
	each: <R>(fn: (itm: Node, idx: number, len: number) => R | "!",
	st?: number, en?: number) => (R | undefined);
	eachAsync: <R>(fn: (itm: Node, idx: number, len: number) => R | "!",
	st?: number, en?: number, pe?: boolean) => Promise<R | undefined>;
}

export interface TouchList {
	/** Get touch by id, if it exists */
	get(id: number): Touch | undefined;
}

export interface Element {
	/** Get an element's index in its parent. Returns -1 if the element has no parent */
	index: number;
	/** Insert child at index */
	insertChildAt(el: Element, i: number): void;
	/** Get element bounding rect as UtilRect object */
	boundingRect: ext.UtilRect;
	/** Get element inner rect (excluding border and padding) as UtilRect object */
	innerRect: ext.UtilRect;
}
}

export interface NumField extends HTMLInputElement {
	num: number;
	ns: string | null;
	set: (num: number | string) => void;
	setRange: (min?: number, max?: number, decMax?: number) => void;
	onnuminput?: (this: GlobalEventHandlers, ev?: Event) => any;
}

export interface TextArea extends HTMLTextAreaElement {
	set: (val: string) => void;
}

//-------------------------------------------- Extensions --------------------------------------------

namespace ext {
if(window.TouchList) U.proto(TouchList, 'get', function(this: any, id: number) {
	for(const t of this) if(t.identifier === id) return t;
});

U.define(Element.prototype, 'index', function(this: any) {
	const p=this.parentElement; if(!p) return -1;
	return Array.prototype.indexOf.call(p.children, this);
});


U.proto(Element, 'insertChildAt', function(this: any, el: Element, i: number) {
	if(i<0) i=0; if(i >= this.children.length) this.appendChild(el);
	else this.insertBefore(el, this.children[i]);
});

/** Get element bounding rect as UtilRect object */
export const boundingRect = (e: Element) => new UtilRect(e.getBoundingClientRect());

/** Get element inner rect (excluding border and padding) as UtilRect object */
export function innerRect(e: Element) {
	let r=e.getBoundingClientRect(), s=getComputedStyle(e);
	return new UtilRect(r.top+parseFloat(s.paddingTop)+parseFloat(s.borderTopWidth),
		r.bottom-parseFloat(s.paddingBottom)-parseFloat(s.borderBottomWidth),
		r.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),
		r.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth));
};

U.define(Element.prototype, 'boundingRect', function(this: any) {return boundingRect(this)});
U.define(Element.prototype, 'innerRect', function(this: any) {return innerRect(this)});

export const device = U.deviceInfo(), mobile = device.mobile;

//-------------------------------------------- DOM Model --------------------------------------------

//==== General ====

/** Better class for bounding boxes */
export class UtilRect {
	x!: number; left!: number;
	y!: number; top!: number;
	x2!: number; right!: number;
	y2!: number; bottom!: number;
	w!: number; width!: number;
	h!: number; height!: number;
	centerX!: number; centerY!: number;

	constructor(t: number | DOMRect | UtilRect, b?: number, l?: number, r?: number) {
		const f=Number.isFinite; let tt=0,bb=0,ll=0,rr=0;
		U.define(this,'x',			()=>ll,		v=>{f(v)?(rr+=v-ll,ll=v):0});
		U.define(this,'y',			()=>tt,		v=>{f(v)?(bb+=v-tt,tt=v):0});
		U.define(this,'top',			()=>tt,		v=>{tt=f(v)?v:0});
		U.define(this,['bottom','y2'],()=>bb,		v=>{bb=f(v)?v:0});
		U.define(this,'left',			()=>ll,		v=>{ll=f(v)?v:0});
		U.define(this,['right','x2'],	()=>rr,		v=>{rr=f(v)?v:0});
		U.define(this,['width','w'],	()=>rr-ll,	v=>{rr=v>=0?ll+v:0});
		U.define(this,['height','h'],	()=>bb-tt,	v=>{bb=v>=0?tt+v:0});
		U.define(this,'centerX',		()=>ll/2+rr/2);
		U.define(this,'centerY',		()=>tt/2+bb/2);
		if(t instanceof DOMRect || t instanceof UtilRect)
			tt=t.top, bb=t.bottom, ll=t.left, rr=t.right;
		else tt=t, bb=b!, ll=l!, rr=r!;
	}

	/** Check if rect contains point, other rect, or Element */
	contains(x: number | UtilRect | Element, y?: number): boolean {
		if(x instanceof Element) return this.contains(x.boundingRect);
		if(x instanceof UtilRect) return x.x >= this.x && x.x2 <= this.x2 && x.y >= this.y && x.y2 <= this.y2;
		return x >= this.x && x <= this.x2 && y! >= this.y && y! <= this.y2;
	}

	/** Check if rect overlaps rect or Element */
	overlaps(r: UtilRect | Element): boolean {
		if(r instanceof Element) return this.overlaps(r.boundingRect);
		if(!(r instanceof UtilRect)) return false;
		let x: any, y: any;
		if(r.x2-r.x >= this.x2-this.x) x = this.x >= r.x && this.x <= r.x2 || this.x2 >= r.x && this.x2 <= r.x2;
		else x = r.x >= this.x && r.x <= this.x2 || r.x2 >= this.x && r.x2 <= this.x2;
		if(r.y2-r.y >= this.y2-this.y) y = this.y >= r.y && this.y <= r.y2 || this.y2 >= r.y && this.y2 <= r.y2;
		else y = r.y >= this.y && r.y <= this.y2 || r.y2 >= this.y && r.y2 <= this.y2;
		return x&&y;
	}

	/** Get distance from this rect to point, other rect, or Element */
	dist(x: number | UtilRect | Element, y?: number): number {
		if(x instanceof Element) return this.dist(x.boundingRect);
		const n = x instanceof UtilRect;
		y = Math.abs((n?(x as UtilRect).centerY:y as number)-this.centerY),
		x = Math.abs((n?(x as UtilRect).centerX:x as number)-this.centerX);
		return Math.sqrt(x*x+y*y);
	}

	/** Expand (or contract if negative) a UtilRect by num of pixels. Useful for using UtilRect objects as element hitboxes
	@returns self for chaining */
	expand(by: number) {
		this.top -= by, this.left -= by, this.bottom += by, this.right += by;
		return this;
	}
}

const R_CTR = /translate(?:x|y)?\(.+?\)/gi;

/** Center element with JS

Modes:
- `trans`: Uses transform: translate. Responsive, no container
- Default: New flexbox method
@param only `x` for only x axis centering, `y` for only y axis, null for both */
export function center(el: HTMLElement, only?: "x" | "y", mode?: "trans") {
	const os = el.style;
	if(mode == 'trans') {
		if(!os.position) os.position='absolute';
		let tr = os.transform.replace(R_CTR,'').trim();
		if(!only || only === 'x') os.left='50%', tr+=' translateX(-50%)';
		if(!only || only === 'y') os.top='50%', tr+=' translateY(-50%)';
		os.transform=tr;
	} else {
		const cont = mkDiv(el.parentNode, null, {display:'flex', top:0, left:0}), cs = cont.style;
		cont.appendChild(el);
		if(!only || only === 'x') cs.justifyContent='center', cs.width='100%';
		if(!only || only === 'y') cs.alignItems='center',
			cs.height='100%', cs.position='absolute';
	}
}

//==== Arrays ====

[HTMLCollection, NodeList].forEach(p => {
	U.proto(p, 'each', Array.prototype.each);
	U.proto(p, 'eachAsync', Array.prototype.eachAsync);
});

//==== Navigation ====

/** Called when a virtual navigation event occurs, including on page load */
export let onNav: (state: any) => void;

/** Generate a virtual navigation event, updating the URL bar
@param state Optional data given to `onNav` whenever the user returns to this history entry */
export function go(url: string | URL, state?: any) {
	history.pushState(state, '', url), doNav(state);
}

addEventListener('popstate', e => doNav(e.state));
addEventListener('load', () => setTimeout(() => doNav(history.state),1));
function doNav(s: any) {if(onNav) onNav.call(null,s)}

//==== DOM Creation ====

/** Create elements with ease! Just remember **PCSI** - Parent, class, style, innerHTML */
export function mkEl<K extends keyof HTMLElementTagNameMap>(tag: K, parent?: Node | null, cls?: string | null,
style?: CSSStyleDeclaration | UT.AnyMap | null, inner?: string | null): HTMLElementTagNameMap[K] {
	const e = document.createElement(tag);
	if(cls != null) e.className = cls;
	if(inner != null) e.innerHTML = inner;
	if(style && typeof style === 'object') for(const k in style) {
		if(k in e.style) (e.style as any)[k] = (style as any)[k];
		else e.style.setProperty(k, (style as any)[k]);
	}
	if(parent != null) parent.appendChild(e);
	return e;
}

/** Shorthand for `mkEl` with div tag */
export const mkDiv = (parent?: Node | null, cls?: string | null, style?: CSSStyleDeclaration | UT.AnyMap | null,
	inner?: string | null) => mkEl('div', parent, cls, style, inner);

/** Add text node to the DOM */
export const addText = (parent: Node, text: string) => parent.appendChild(document.createTextNode(text));

//==== CSS ====

let TWCanvas: HTMLCanvasElement;

/** Get predicted width of text w/ given CSS font style */
export function textWidth(txt: string, font: string) {
	const c = TWCanvas||(TWCanvas=mkEl('canvas')), ctx = c.getContext('2d')!;
	ctx.font = font; return ctx.measureText(txt).width;
}

const R_SK = /[A-Z]/g, R_SR=(s: string) => '-'+s.toLowerCase();
function defSty() {
	for(const s of document.styleSheets as any) try {s.cssRules; return s} catch(e) {}
	//let ns=mkEl('style',document.head); addText(ns,''); return ns.sheet!;
	return mkEl('style', document.head).sheet;
}

/** Create a CSS rule and append it to the current document
@param sel CSS selector, eg. `.class` or `#id` */
export function addCSS(sel: string, style: CSSStyleDeclaration | UT.AnyMap, sheet?: CSSStyleSheet) {
	if(!sheet) sheet=defSty(); let k,s=[];
	for(k in style) s.push(`${k.replace(R_SK, R_SR)}:${(style as UT.AnyMap)[k]}`);
	sheet!.insertRule(`${sel}{${s.join(';')}}`);
}

/** Remove a CSS selector from **all** stylesheets */
export function remCSS(sel: string) {
	let s,rl;
	for(s of document.styleSheets as any) {
		try {rl=s.cssRules} catch(e) {continue}
		for(let i=0,l=rl.length; i<l; ++i) if(rl[i] instanceof CSSStyleRule
			&& rl[i].selectorText===sel) s.deleteRule(i);
	}
}

//==== Inputs ====

const R_NFZ=/\.0*$/;

/** Turns your boring <input> into a mobile-friendly number entry field with max/min & negative support!

Tips:
- Use `field.onnuminput` in place of oninput, get number value with field.num
- On mobile, use star key for decimal point and pound key for negative
- You can set `field.nStep` in order to change the up/down arrow step size
- Use `field.setRange` to change min, max, and decMax

@param min Min value, default min safe int
@param max Max value, default max safe int
@param decMax Max decimal precision (eg. 3 is 0.001), default 0
@param sym If a symbol (eg. '$') is given, uses currency mode */
export function numField(field: HTMLInputElement, min?: number, max?: number, decMax?: number, sym?: string) {
	const f = field as NumField, RM = RegExp(`[,${sym?RegExp.escape(sym):''}]`, 'g');
	f.type = (mobile||decMax||sym)?'tel':'number';
	f.setAttribute('pattern', "\\d*");
	//@ts-expect-error
	if(!f.step) f.step = 1;
	f.addEventListener('keydown', e => {
		if(e.ctrlKey) return;
		let k=e.key, kn=k.length===1&&Number.isFinite(Number(k)),
			ns=f.ns, len=ns!.length, dec=ns!.indexOf('.');

		if(k==='Tab' || k==='Enter') return;
		else if(kn) {if(dec===-1 || len-dec < decMax!+1) ns+=k} //Number
		else if(k==='.' || k==='*') {if(decMax && dec==-1
				&& f.num!=max && (min!>=0 || f.num!=min)) { //Decimal
			if(!len && min!>0) ns=Math.floor(min!)+'.';
			else ns+='.';
		}} else if(k==='Backspace' || k==='Delete') { //Backspace
			if(min!>0 && f.num===min && ns!.endsWith('.')) ns='';
			else ns=ns!.slice(0,-1);
		} else if(k==='-' || k==='#') {if(min!<0 && !len) ns='-'} //Negative
		else if(k==='ArrowUp') ns=null, f.set(f.num+Number(f.step)); //Up
		else if(k==='ArrowDown') ns=null, f.set(f.num-Number(f.step)); //Down

		if(ns !== null && ns !== f.ns) {
			len=ns.length, dec=ns.indexOf('.');
			let neg=ns==='-'||ns==='-.', s=neg?'0':ns+(ns.endsWith('.')?'0':''),
				nr=Number(s), n=U.bounds(nr, min, max);
			if(!kn || !ns || f.num !== n || (dec!==-1 && len-dec < decMax!+1)) {
				f.ns=ns, f.num=n;
				f.value = sym ? neg?sym+'-0.00':U.formatCost(n,sym):
					(ns[0]==='-'?'-':'')+Math.floor(Math.abs(n))
					+(dec!==-1?ns.slice(dec)+(R_NFZ.test(ns)?'0':''):'');
				if(f.onnuminput) f.onnuminput.call(f,e);
			}
		}
		e.preventDefault();
	});
	function numRng(n: any) {
		if(typeof n==='string') n=n.replace(RM,'');
		n=U.bounds(Number(n)||0, min, max);
		return decMax?Number(n.toFixed(decMax)):Math.round(n);
	}
	f.set=n => {
		f.num = numRng(n);
		f.ns = f.num.toString();
		f.value = sym?U.formatCost(f.num,sym):f.ns;
		f.ns=f.ns.replace(/^(-?)0+/,'$1');
		if(f.onnuminput) f.onnuminput.call(f);
	}
	f.setRange=(nMin, nMax, nDecMax) => {
		min=nMin==null ? Number.MIN_SAFE_INTEGER : nMin;
		max=nMax==null ? Number.MAX_SAFE_INTEGER : nMax;
		decMax=nDecMax==null ? sym?2:0 : nDecMax;
		if(numRng(f.num) !== f.num) f.set(f.num);
	}
	f.addEventListener('input', () => f.set(f.value));
	f.addEventListener('paste', e => {f.set(e.clipboardData!.getData('text')); e.preventDefault()});
	f.setRange(min, max, decMax);
	return f;
}

//By Rick Kukiela @ StackOverflow
/** Auto-resizing textarea, dynamically scales lineHeight based on input.
Use `el.set(value)` to set value & update size */
export function autosize(el: HTMLTextAreaElement, maxRows=5, minRows=1) {
	const e = el as TextArea;
	e.set = v => {e.value=v,cb()};
	let s=e.style;
	s.maxHeight=s.resize='none', s.minHeight='0', s.height='auto';
	e.setAttribute('rows', minRows as any);
	function cb() {
		if(e.scrollHeight===0) return setTimeout(cb,1); //Still loading
		e.setAttribute('rows', 1 as any);
		//Override style
		let cs=getComputedStyle(e);
		s.setProperty('overflow', 'hidden', 'important');
		s.width=e.innerRect.w+'px', s.boxSizing='content-box', s.borderWidth=s.paddingInline='0';
		//Calc scroll height
		let pad=parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
		lh=cs.lineHeight==='normal' ? parseFloat(cs.height) : parseFloat(cs.lineHeight),
		rows=Math.round((Math.round(e.scrollHeight) - pad)/lh);
		//Undo overrides & apply
		s.overflow=s.width=s.boxSizing=s.borderWidth=s.paddingInline='';
		e.setAttribute('rows', U.bounds(rows, minRows, maxRows) as any);
	}
	e.addEventListener('input', cb);
}

//==== Dates ====

/** Set `datetime-local` or `date` input from JS Date object or string, adjusting for local timezone */
export function setDateTime(el: HTMLInputElement, date: Date | string | number) {
	if(!(date instanceof Date)) date=new Date(date);
	el.value = new Date(date.getTime() - date.getTimezoneOffset()*60000).
		toISOString().slice(0, el.type==='date'?10:19);
}

/** Get value of `datetime-local` or `date` input as JS Date */
export const getDateTime = (el: HTMLInputElement) => new Date(el.value+(el.type==='date'?'T00:00':''));

//==== Utility ====

/** Trigger browser download of file. If `data` is a string or URL,
it is treated as a URL. Otherwise, it is downloaded as Blob data */
export async function download(data: string | URL | Blob | ArrayBuffer, name?: string) {
	const a = mkEl('a');
	if(typeof data === 'string' || data instanceof URL) {
		a.href = data.toString();
		a.download = name || a.href.split('/').at(-1)!;
		a.click();
	} else {
		if(!(data instanceof Blob)) data = new Blob([data]);
		const u = URL.createObjectURL(data);
		a.href=u, a.download=name||'file', a.click();
		URL.revokeObjectURL(u);
	}
}
}

export const utils = <typeof U & typeof ext>U;
export default utils;
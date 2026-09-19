//https://github.com/Pecacheu/Utils.js; GNU GPL v3

import utils, { type UtilRect } from 'raiutils/dom';

interface GrabShared {
	/** You must set this on `position: fixed` descendants for accurate hitbox calculations.
	If set on GrabParent, it will be automatically applied to all GrabChildren. */
	$fixed?: boolean;
}

export type GrabParent<T extends HTMLElement = HTMLElement> = Omit<T, 'children'> & GrabShared & {
	$grab: Grabable<T>;
	children: GrabChild[];
};

export type GrabChild<T extends HTMLElement = HTMLElement> = T & GrabShared & {
	/** Use in place of the overridden onclick event */
	onPress?: (e: GrabEvent) => void;
	/** Grabable drag handle, defaults to the entire GrabChild */
	$drag?: HTMLElement;
	/** true to disable grabbing on this child only */
	$noGrab?: boolean;

	//Private
	_gp?: Grabable<any>;
	_mv?: (e: GrabEvent) => void;
	_g?: GrabBox;
	_gc?: GrabInfo;
};

type GrabEvent = MouseEvent | TouchEvent;
export type DropEvent = GrabEvent & {
	/** The static element (supplied to `onGrab`), if any, that the element was dropped over. */
	staticDrop?: HTMLElement;
};

//TODO Separate grabHold option for touch
const grabDefaults = {
	/** Minimum hold time before grab is triggered.

	Reduce this if click action is not needed,
	but too low will mess w/ touch scrolling */
	grabHold: 250,
	/** Max 'wiggle' in px during hold-to-grab.
	Allows scroll gesture on mobile */
	holdDrop: 10,
	/** Max distance for a grab to lock onto a target */
	maxDist: 10,
	/** If drag is cancelled, target returns to original position */
	resetOnCancel: true
};
export type GrabOptions = Partial<typeof grabDefaults>;

type GrabBox = HTMLElement & {_gb: number, _t?: HTMLElement};
type OnGrabReturn = (GrabParent | GrabChild)[] | false | undefined;
interface GrabTarget {
	r: UtilRect;
	rf?: UtilRect;
	ot?: HTMLElement;
	//Target Pos
	x: number;
	y: number;
	//Scroll Offset
	sx: number;
	sy: number;
	//Anti Pop-in Offset
	ox: number;
	oy: number;
	/** Touch ID */
	i?: number;
}
interface GrabInfo {
	r: UtilRect;
	p?: GrabParent;
}

/** Create new grab container. Self-disables when removed from DOM

* *Enable `utils.$DEBUG` for on-screen hitboxes!*

Recommended CSS:
```css
.grabItm, .grabItm * {
	user-select:none; -webkit-user-select:none;
	-webkit-touch-callout:none;
}
.grabItm * { pointer-events:none; }
.grabbing {
	box-sizing:border-box; pointer-events:none;
	opacity:.8; z-index:99;
}
.grabBox { box-sizing:border-box; border:2px dashed #bbb; }
.grabOver { outline:5px solid #bbb; }
```

CSS classes:
- `.grabCont` Set on GrabParent when Grabable is enabled.
- `.grabItm` All children (unless disabled via *$noGrab*) have this when Grabable is enabled.
- `.grabbing` Set on child during an active grab.
- `.grabOver` Set on static drop target when it is the active target.
- `.grabBox` A placeholder that appears at the drop location during a grab.

Tips:
- Some CSS libraries like Bootstrap already set `box-sizing:border-box` globally.
- Don't apply `pointer-events:none` to your $drag handle, if you set one.
*/
export class Grabable<T extends HTMLElement> {
	/** Container element */
	readonly el: GrabParent<T>;
	readonly opts: typeof grabDefaults;
	/** true if grabbing is enabled */
	readonly en!: boolean;

	//Callbacks
	/** Called when a grab event starts. GrabParents in the return list allow a drop
	anywhere within them, while any other Element defines a static drop target.

	If you do not return an array, defaults to `[this.el]`. (Note: **Do not** directly return
	`Element.children`, it is mutable and the element list may change during a grab event.)
	@return Optional array of drop targets or target groups, or false to cancel */
	onGrab?: (grab: Grabable<T>, target: GrabChild, e: GrabEvent) => OnGrabReturn | Promise<OnGrabReturn>;
	/** Called after the target is dropped. With the exception of static dropzones (which set `e.staticDrop`),
	the grab target is automatically inserted at its new position. However if `opts.resetOnCancel` is true,
	the target will be reset to its old position if `cancel()` is cancelled from within onDrop.
	@param e null if drag was cancelled manually */
	onDrop?: (grab: Grabable<T>, target: GrabChild, e?: DropEvent) => void | Promise<void>;

	#ro;
	#co;
	#c?: GrabChild;
	#gt?: GrabTarget;
	#o?: GrabChild[];
	#t?: NodeJS.Timeout | 0;

	constructor(parent: T | GrabParent<T>, opts?: GrabOptions) {
		(this.el = parent as GrabParent<T>).$grab = this;
		this.opts = {...grabDefaults, ...opts};
		this.#ro = new MutationObserver(() => {
			if(!document.body.contains(parent)) this.set(false);
		});
		this.#co = new MutationObserver(ml => {
			let m, c;
			for(m of ml) for(c of m.addedNodes)
				if((c as HTMLElement).style) this.#setNode(c as GrabChild);
		});
		this.set(true);
	}

	/** Set grab enable, defaults to true */
	set(en: boolean) {
		(this.en as boolean) = en;
		this.el.classList.toggle('grabCont', en);
		let c;
		for(c of this.el.children) this.#setNode(c);
		if(en) {
			addEventListener('mousemove', this.#move);
			addEventListener('touchmove', this.#move, {passive: false});
			addEventListener('mouseup', this.#up);
			addEventListener('touchend', this.#up);
			this.#ro.observe(document.body, {childList: true, subtree: true});
			this.#co.observe(this.el, {childList: true});
		} else {
			removeEventListener('mousemove', this.#move);
			removeEventListener('touchmove', this.#move);
			removeEventListener('mouseup', this.#up);
			removeEventListener('touchend', this.#up);
			this.#ro.disconnect();
			this.#co.disconnect();
		}
	}

	/** Target of grab event, if ongoing */
	get target() {return this.#c?._g ? this.#c : undefined}

	/** Cancel an active grab event
	@param reset Defaults to value of `this.resetOnCancel` */
	cancel(reset?: boolean) {
		const c = this.#c;
		if(!c) return;
		if(c._g) c._g._gb = reset ?? this.opts.resetOnCancel ? -2 : -1;
		if(!this.#o) return; //Running in onDrop
		if(c._g) c._g.remove(), delete c._g._t;
		this.#up();
	}

	#setNode(c: GrabChild) {
		const ce = this.en && !('_gb' in c);
		let mv = c._mv;
		if(mv && (!ce || c._gp !== this)) {
			(c.$drag || c).removeEventListener('mousedown', mv);
			(c.$drag || c).removeEventListener('touchstart', mv);
			if(ce) mv = undefined;
			else c.classList.remove('grabItm'), delete c._mv;
		}
		if(ce && !mv) {
			c._mv = e => this.#down(c, e), c._gp = this;
			(c.$drag || c).addEventListener('mousedown', c._mv);
			(c.$drag || c).addEventListener('touchstart', c._mv);
			c.classList.add('grabItm');
		}
	}

	#down(c: GrabChild, e: GrabEvent) {
		if(this.#c || c.$noGrab) return;
		const t = ('touches' in e ? e.changedTouches[0] : e) as Touch;
		this.#c = c;
		this.#gt = {x: t.clientX, y: t.clientY, i: t.identifier} as GrabTarget;
		this.#t = setTimeout(() => this.#grab(e), this.opts.grabHold);
	}

	async #grab(e: GrabEvent) {
		this.#t = 0;
		const c = this.#c!, gt = this.#gt!,
			ol = await this.onGrab?.(this, c, e) ?? [this.el];
		if(ol === false || !ol.length) return this.cancel();

		const b = gt.r = c.boundingRect, er = this.el.boundingRect,
			s = c.style, gs = {width: b.w + 'px', height: b.h + 'px'},
			g = c._g = utils.mkDiv(null, 'grabBox', gs) as never as GrabBox;
		gt.x -= b.x, gt.y -= b.y, gt.sx = er.x, gt.sy = er.y;
		gt.ot = c.nextElementSibling as HTMLElement, g._gb = 1;
		document.body.appendChild(c), c.classList.add('grabbing');
		s.width = gs.width, s.height = gs.height, s.position = 'fixed', s.transition = 'none';
		gt.i = (e as TouchEvent).changedTouches?.[0]?.identifier;
		gt.ox = gt.oy = 0;

		this.#o = [];
		let o, oc, ocl;
		for(o of ol) if(o !== c) {
			if(o.$fixed && !gt.rf) gt.rf = new utils.UtilRect(b);
			if('$grab' in o) { //GrabParent
				ocl = [...o.children];
				for(oc of ocl) {
					o.insertBefore(g, oc);
					oc._gc = {r: g.boundingRect.expand(this.opts.maxDist), p: o as GrabParent};
					if(o.$fixed) oc.$fixed = true;
				}
				o.appendChild(g);
				ocl.push({_gb: 1,
					_gc: {r: g.boundingRect.expand(this.opts.maxDist), p: o as GrabParent},
					$fixed: o.$fixed} as any);
				this.#o!.push(...ocl);
			} else { //Static
				o._gc = {r: o.boundingRect.expand(this.opts.maxDist)};
				this.#o!.push(o);
			}
		}
		if(utils.$DEBUG) for(o of this.#o)
			oc = o._gc!, utils.mkTestRect(oc.r, o.$fixed ? '#509' : oc.p ? '#900' : '#009');
		this.#move(e);
	}

	#move = (e: GrabEvent) => {
		const c = this.#c;
		if(!c) return;
		const gt = this.#gt!, t = gt.i != null
			? (e as TouchEvent).changedTouches?.get(gt.i)
			: !('touches' in e) && e;
		if(!t) return;
		let x = t.clientX - gt.x, y = t.clientY - gt.y;
		if(this.#o) {
			e.preventDefault();
			getSelection()!.removeAllRanges();
			const g = c._g!;
			let a: GrabChild | undefined, fx, fy, dist, min!: number;
			c.style.left = x + 'px', c.style.top = y + 'px';
			if(gt.rf) {
				gt.rf.x = x, gt.rf.y = y;
				fx = x + gt.x, fy = y + gt.y;
			}
			const sr = this.el.boundingRect;
			gt.r.x = x += gt.sx - sr.x + gt.ox;
			gt.r.y = y += gt.sy - sr.y + gt.oy;
			x += gt.x, y += gt.y;
			if(utils.$DEBUG) utils.mkTestRect(gt.r, '#090');
			//Detect element
			for(const o of this.#o) if(o._gc!.r.overlaps(o.$fixed ? gt.rf! : gt.r)) {
				dist = o._gc!.p
					? o._gc!.r.dist(o.$fixed ? gt.rf! : gt.r)
					: o.$fixed ? o._gc!.r.dist(fx!, fy) : o._gc!.r.dist(x, y);
				if(!a || dist < min) a = o, min = dist;
			}
			//Update grabBox
			if(g._t && g._t !== a) {
				g._t.classList.remove('grabOver');
			}
			const p = a?._gc!.p;
			if(p) {
				gt.ox = gt.oy = 0;
				if('_gb' in a!) p.appendChild(g);
				else p.insertBefore(g, a!);
				delete g._t;
			} else {
				const gp = g.parentNode;
				g.remove(), g._t = a;
				a?.classList.add('grabOver');
				if(gp) {
					const nr = this.el.boundingRect;
					gt.ox = nr.x - sr.x;
					gt.oy = nr.y - sr.y;
				}
			}
			//TODO Handle multi-touch scroll
		} else if(this.#t && (Math.abs(x) > this.opts.holdDrop || Math.abs(y) > this.opts.holdDrop)) {
			clearTimeout(this.#t), this.#t = 0;
		}
	};

	#up = async (e?: GrabEvent) => {
		const c = this.#c, gt = this.#gt!;
		if(!c || !e || (gt.i != null
			? !(e as TouchEvent).changedTouches?.get(gt.i)
			: 'touches' in e)) return;
		e?.preventDefault();
		if(this.#t) {
			clearTimeout(this.#t), this.#t = 0;
			if(e && c?.onPress) c.onPress.call(c, e);
		}
		if(this.#o) {
			let o;
			for(o of this.#o) delete o._gc;
			this.#o = undefined;
			if(utils.$DEBUG) utils.resetTestRects();
		}
		const g = c._g;
		if(g) {
			const s = c.style;
			c.classList.remove('grabbing');
			s.left = s.top = s.width = s.height = s.position = s.transition = '';
			if(g.parentNode) g.replaceWith(c);
			else if(g._t) {
				(e as DropEvent).staticDrop = g._t;
				g._t.classList.remove('grabOver'), c.remove();
			} else e = undefined;
		}
		await this.onDrop?.(this, c, e);
		if(g && (g._gb < 0 ? g._gb === -2 : !e && this.opts.resetOnCancel)) {
			if(gt.ot) this.el.insertBefore(c, gt.ot);
			else this.el.appendChild(c);
		}
		delete c._g, this.#c = this.#gt = undefined;
	};
}
//ChuSchema v1.3, Pecacheu 2025. GNU GPL v3

class SubError extends Error {}

function errAt(k,e,l) {
	let s=e instanceof SubError, es=e.message||e;
	k=(l?`[${k}]`:k)+(s ? es.startsWith('[')?'':'.' : ': ');
	if(s) e.message=k+es;
	else e=new SubError(k+es, e instanceof Error?{cause:e}:null);
	return e;
}

function isDictOrArr(d) {return typeof d==='object' && d!==null}
function isDict(d) {return isDictOrArr(d) && !Array.isArray(d)}
function oobStr(s) {return ` out-of-bounds (${s.min==null?'*':s.min}-${s.max==null?'*':s.max})`}
function dictFmt(s) {
	if(typeof s.c==='string') s.c={t:s.c};
	let dt=isDictOrArr(s.f)?2:isDictOrArr(s.c)?1:0;
	if(!dt) throw "Schema lacks format or childType";
	if(dt===2 && s.c) throw "Cannot require both format and childType";
	return dt===2;
}
function tryAll(a,fn) {
	if(Array.isArray(a)) {
		let el=[];
		a.forEach(s => {try {fn(s)} catch(e) {el.push(e)}});
		if(el.length >= a.length) throw "[Failed all cases] "+el.map(e => e.message||e).join(', ');
	} else fn(a);
}

function checkType(d,sr) {
	let tt,el,sl,s,l,k,n,ds,dt,
	run=(t,i) => {
		//Get prop cache
		if(!(s=sl[k='$'+i])) {
			s=sl[k]={};
			for(k in sl) s[k]=Array.isArray(sl[k])?sl[k][i]:sl[k];
		}
		//Check type
		try {switch(t) {
		case 'str':
			if(typeof d!=='string') throw -1;
			l=d.length;
			if(l<s.min || l>s.max) throw "Str len "+l+oobStr(s);
			if(s.len!=null && l!==s.len) throw "Str len must be "+s.len;
			if(typeof s.f==='string') s.f=new RegExp(`^(?:${s.f})$`);
			if(s.f instanceof RegExp && !s.f.test(d)) throw `Str '${d}' does not match format ${s.f}`;
		break; case 'int': case 'float':
			if(typeof d!=='number' || !(t==='int'?Number.isSafeInteger(d):Number.isFinite(d))) throw -1;
			if(s.val!=null && d!==s.val) throw "Num != "+s.val;
			if(d<s.min || d>s.max) throw "Num "+d+oobStr(s);
		break; case 'bool':
			if(typeof d!=='boolean') throw -1;
		break; case 'list':
			if(!Array.isArray(d)) throw -1;
			l=d.length; if(!l && s.min!==0) throw "Empty list";
			if(s.len!=null && l!==s.len) throw "Array size must be "+s.len;
			if(l<s.min || l>s.max) throw "Array size "+l+oobStr(s);
			n=0, ds=tt.length>1?s:sl, dt=dictFmt(ds);
			for(; n<l; ++n) try {dt?checkSchema(d[n],ds.f):checkType(d[n],ds.c)}
				catch(e) {throw errAt(n,e,1)}
		break; case 'dict':
			if(!isDict(d)) throw -1;
			k=Object.keys(d);
			if(!k.length && s.min!==0) throw "Empty dict";
			if(typeof s.kf==='string') s.kf=new RegExp(`^(?:${s.kf})$`);
			ds=tt.length>1?s:sl, dt=dictFmt(ds);
			for(n of k) try {
				if(n.startsWith('$')) throw "Key cannot start with $";
				if(s.kf instanceof RegExp && !s.kf.test(n)) throw `Key '${n}' does not match format ${s.kf}`;
				dt?checkSchema(d[n],ds.f):checkType(d[n],ds.c);
			} catch(e) {throw errAt(n,e,1)}
		break; default:
			throw `Unknown type ${s.t} in schema`;
		}} catch(e) {el.push(e)}
	}
	tryAll(sr, s => {
		if(typeof s.t!=='string') throw "Missing type";
		sl=s, el=[], tt=s.t.split('|'), tt.forEach(run);
		if(el.length >= tt.length) {
			let e,m;
			for(e of el) if(e!==-1) m=e;
			if(!m) m="Must be of type "+sr.t;
			throw m;
		}
	});
}

const R_FN=/\W+|(\w+)/g;

function checkSchema(data, schema, ignoreReq) {
	if(!isDict(data)) throw "Data must be dict";
	if(!isDictOrArr(schema)) throw "Schema must be dict|list[dict]";
	let k,d,s,r,n,m;
	tryAll(schema, sch => {
		for(k in data) try {
			d=data[k], s=sch[k];
			if(!s) throw "Not in schema";
			if(k.startsWith('$')) throw "Key cannot start with $";
			checkType(d,s);
		} catch(e) {throw errAt(k,e)}
		if(ignoreReq) return;
		//Check missing
		for(k in sch) if((s=sch[k]).req != null) {
			d=s.req, r=typeof d==='string';
			if(r) { //Conditional req
				n='';
				while(m=R_FN.exec(d)) n+=m[1] ? m[1] in data : m[0];
				d=eval(n);
			}
			if(d) {
				n=k in data;
				if(d===-1 ? n : !n) throw k+": Required"+(r?" if "+s.req:'');
			}
		}
	});
}

function isNumArr(a) {
	for(let v of a) if(typeof v!=='number') return;
	return 1;
}

//Custom JSON implementation w/ better line-breaks
function prettyJSON(val, d=0) {
	let t=typeof val;
	if(t==='number' || t==='string' || t==='boolean') return JSON.stringify(val);
	else if(Array.isArray(val)) {
		if(isNumArr(val)) return JSON.stringify(val);
		let s='[',d1=d+1,i=0,l=val.length;
		for(; i<l; ++i) s += (i?',\n':'\n')+('\t'.repeat(d1))+prettyJSON(val[i],d1);
		return s+'\n'+'\t'.repeat(d)+']';
	} else if(t==='object') {
		let k,s='{',ln=!d,f,d1=d+1;
		for(k in val) {
			if(Array.isArray(val[k]) && !isNumArr(val[k])) ln=1;
			s += (ln?f?',\n':'\n':f?', ':'')+'\t'.repeat(ln?d1:0)+JSON.stringify(k)+":"+prettyJSON(val[k],d1);
			f=1,ln=0;
		}
		if(!d) s+='\n';
		return s+'}';
	} else throw "Unknown type "+t;
}

export default {checkSchema, checkType, prettyJSON, errAt};
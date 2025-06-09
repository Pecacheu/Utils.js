//ChuSchema v1.2.1, Pecacheu 2025. GNU GPL v3

function errAt(k,e,l) {
	let es=e.message||e;
	k=(l?`[${k}]`:k)+(es.indexOf(':')===-1 ? ': ' : es.startsWith('[')?'':'.');
	if(e.message != null) e.message=k+es; else e=new Error(k+e);
	return e;
}

function isDict(d) {return typeof d==='object' && d!==null && !Array.isArray(d)}
function oobStr(s) {return ` out-of-bounds (${s.min||'*'}-${s.max||'*'})`}
function checkType(d,sr) {
	if(typeof sr.t!=='string') throw "Missing type";
	let tl=sr.t.split('|'),el=[],s,l,k,n,dt;
	tl.forEach((t,i) => {
		//Get prop cache
		if(!(s=sr[k='$'+i])) {
			s=sr[k]={};
			for(k in sr) s[k]=Array.isArray(sr[k])?sr[k][i]:sr[k];
		}
		//Check type
		try {switch(t) {
		case 'str':
			if(typeof d!=='string') throw -1;
			l=d.length;
			if(l<s.min || l>s.max) throw "Str len "+l+oobStr(s);
			if(typeof s.f==='string') s.f=new RegExp(`^(?:${s.f})$`);
			if(s.f instanceof RegExp && !s.f.test(d)) throw `Str '${d}' does not match format`;
		break; case 'int': case 'float':
			if(typeof d!=='number' || !(t==='int'?Number.isSafeInteger(d):Number.isFinite(d))) throw -1;
			if(d<s.min || d>s.max) throw "Num "+d+oobStr(s);
		break; case 'bool':
			if(typeof d!=='boolean') throw -1;
		break; case 'list':
			if(!Array.isArray(d)) throw -1;
			l=d.length; if(!l) throw "Empty list";
			if(s.len && l!==s.len) throw "Array size must be "+s.len;
			if(l<s.min || l>s.max) throw "Array size "+l+oobStr(s);
			if(typeof s.c==='string') s.c={t:s.c};
			n=0, dt=isDict(s.f)?2:isDict(s.c)?1:0;
			if(!dt) throw "List schema lacks format or childType";
			if(dt===2 && s.c) throw "Cannot require both format and childType";
			for(; n<l; ++n) try {dt===2?checkSchema(d[n],s.f):checkType(d[n],s.c)}
				catch(e) {throw errAt(n,e,1)}
		break; case 'dict':
			if(!isDict(d)) throw -1;
			k=Object.keys(d), l=k.length; if(!l) throw "Empty dict";
			if(s.f) throw "Dict schema does not support format (use childType instead)";
			if(typeof s.c==='string') s.c={t:s.c};
			dt=isDict(s.f)?2:isDict(s.c)?1:0;
			if(!dt) throw "Dict schema lacks format or childType";
			if(dt===2 && s.c) throw "Cannot require both format and childType";
			for(n of k) try {dt===2?checkSchema(d[n],s.f):checkType(d[n],s.c)}
				catch(e) {throw errAt(n,e,1)}
		break; default:
			throw `Unknown type ${s.t} in schema`;
		}} catch(e) {el.push(e)}
	});
	if(el.length >= tl.length) {
		let e,m="Must be of type "+sr.t;
		for(e of el) if(e!==-1) m=e;
		throw m;
	}
}

const R_FN=/\W+|(\w+)/g;

function checkSchema(data, schema, ignoreReq) {
	if(!isDict(data)) throw "Data must be dict";
	if(!isDict(schema)) throw "Schema must be dict";
	let k,d,s,r,n,m;
	for(k in data) try {
		d=data[k], s=schema[k];
		if(!s) throw "Not in schema";
		if(k.startsWith('$')) throw "Key cannot start with $";
		checkType(d,s);
	} catch(e) {throw errAt(k,e)}
	if(ignoreReq) return;
	for(k in schema) if(!(k in data)) { //Check missing
		s=schema[k], r=typeof s.req==='string';
		if(r) { //Conditional req
			n='';
			while(m=R_FN.exec(s.req)) n+=m[1] ? m[1] in data : m[0];
			d=eval(n);
		} else d=s.req!==false;
		if(d) throw k+": Required"+(r?" if "+s.req:'');
	}
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

export default {checkSchema, prettyJSON, errAt};
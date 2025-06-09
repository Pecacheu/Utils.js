//Node Webserver v3.4.2, Pecacheu 2025. GNU GPL v3

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import chalk from 'chalk';
let debug;

const types = {
	'.html': "text/html",
	'.php':  "text/html",
	'.css':  "text/css",
	'.png':  "image/png",
	'.svg':  "image/svg+xml",
	'.js':   "application/javascript",
	'.pdf':  "application/pdf",
	'.mp4':  "video/mp4",
	'.ogg':  "video/ogg",
	'.webm': "video/webm"
};

//etag: If number, max file size to calc hash, else if true, use fast etag mode (modified date)
async function handle(dir, req, res, virtualDirs, etag=true) {
	let f;
	try {
		let fn=await resolve(dir, new URL(req.url,'http://a').pathname, virtualDirs),
			hdr={}, stat=200, ext=path.extname(fn), ct=types[ext], rng=req.headers.range, str;
		if(ct) hdr["content-type"] = ct;
		f=await fs.open(fn);
		let st=await f.stat(), dl=st.size;
		if(rng) { //Range
			if(!rng.startsWith('bytes=') || (rng=rng.slice(6).split('-'))
				.length !== 2 || !rng[0]) return await rngErr(f,dl,rng,res);
			let rs=Number(rng[0]), re=Number(rng[1]);
			if(!re) re=dl-1;
			if(rs>=dl || re>=dl || rs>=re) return await rngErr(f,dl,rng,res);
			str=f.createReadStream({start:rs, end:re});
			hdr["accept-ranges"] = 'bytes';
			hdr["content-range"] = `bytes ${rs}-${re}/${dl}`;
			stat=206;
		} else if(typeof etag==='number') {if(dl <= MAX_ETAG) {
			str=await f.readFile();
			let h=crypto.createHash('sha1');
			h.update(str);
			hdr.etag=h.digest('base64url');
		}} else if(etag) hdr.etag=st.mtime.toISOString();

		if(hdr.etag && hdr.etag === req.headers['if-none-match'])
			return res.writeHead(304,''),res.end(),f.close();
		if(!str) str=f.createReadStream();

		res.writeHead(stat,'',hdr);
		if(str instanceof Buffer) res.write(str),res.end(); else str.pipe(res);
		res.on('close', () => f.close());
		if(debug) log(fn.startsWith(dir)?fn.slice(dir.length):fn, ct);
	} catch(e) {
		let nf=e.code==='ENOENT';
		if(debug||!nf) nf?err("-- Not found"):err("-- Read",e);
		sendCode(res, nf?404:500, nf?"Resource Not Found":e);
		if(f) f.close();
	}
}

async function serve(fn, req, res, etag=true) {
	let u=req.url; req.url='/';
	return handle(fn, req, res, null, etag).finally(() => req.url=u);
}

async function rngErr(f,fl,rng,res) {
	if(debug) err("-- Bad Range",rng);
	let h={"content-range": 'bytes */'+fl};
	res.writeHead(416,'',h); res.end();
	f.close();
}

function sendCode(res, code, msg) {
	res.writeHead(code,''), res.write(`<pre style='font-size:16pt'>${msg}</pre>`), res.end();
}

function err(m,e) {console.error(chalk.red(m,e))}
function log(name, ct) {console.log(chalk.dim("-- Served "+name+(ct?" with type "+ct:'')))}

async function resolve(dir, uri, vDir) {
	if(uri.indexOf('..') !== -1) throw "Bad path";
	let fn = parseUri(dir, uri, vDir);
	if(fn.endsWith('/')) fn=fn.slice(0,-1);
	try {
		let stat = await fs.stat(fn);
		if(stat.isDirectory()) return path.join(fn,'/index.html'); //Try index
		return fn;
	} catch(e) {
		if(!path.extname(fn)) return fn+'.html'; //Try with ext
		throw e;
	}
}

function parseUri(root, uri, vDir) {
	if(vDir) {
		let v,vs; for(v in vDir) {
			vs=v.startsWith('/')?v:'/'+v;
			if(uri.startsWith(vs)) return path.join(vDir[v], uri.slice(vs.length));
		}
	}
	return root+uri;
}

const ex={handle, serve, types};
Object.defineProperty(ex, 'debug', {set:d => debug=d});
export default ex;
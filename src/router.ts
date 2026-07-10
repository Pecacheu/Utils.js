//Node Webserver v3.5.1, Pecacheu 2025. GNU GPL v3

import crypto from 'crypto';
import { type ReadStream } from 'fs';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import C from 'chalk';
import { type StringMap } from 'raiutils';
import UUID from './uuid.js';

let debug = 0;

const types: StringMap = {
	'.html': 'text/html',
	'.php': 'text/html',
	'.css': 'text/css',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.js': 'application/javascript',
	'.pdf': 'application/pdf',
	'.mp4': 'video/mp4',
	'.ogg': 'video/ogg',
	'.webm': 'video/webm'
};

let etagMode: boolean | number = true;

/** Serve files from a directory
@param root Root dir to serve web files from
@param vDir Virtual override paths in the form `{webPath: pathOnDisk}`
@param headers Custom headers to add */
async function handle(root: string, req: http.IncomingMessage, res: http.ServerResponse,
	vDir?: StringMap, headers?: http.OutgoingHttpHeaders) {
	let f: fs.FileHandle;
	try {
		const fn = await resolve(root, new URL(req.url!, 'http://a').pathname, vDir),
			hdr: http.OutgoingHttpHeaders = {}, ct = types[path.extname(fn)];
		let stat = 200, rng: any = req.headers.range, str;
		if(ct) hdr['content-type'] = ct;
		f = await fs.open(fn);
		const st = await f.stat(), dl = st.size;
		if(rng) { //Range
			if(!rng.startsWith('bytes=') || (rng = rng.slice(6).split('-'))
				.length !== 2 || !rng[0]) return await rngErr(f, dl, rng, res);
			const rs = Number(rng[0]);
			let re = Number(rng[1]);
			if(!re) re = dl - 1;
			if(rs >= dl || re >= dl || rs >= re) return await rngErr(f, dl, rng, res);
			str = f.createReadStream({start: rs, end: re});
			hdr['accept-ranges'] = 'bytes';
			hdr['content-range'] = `bytes ${rs}-${re}/${dl}`;
			stat = 206;
		} else if(typeof etagMode === 'number') {
			if(dl <= etagMode) {
				str = await f.readFile();
				const h = crypto.createHash('sha1');
				h.update(str);
				hdr.etag = h.digest('base64url');
			}
		} else if(etagMode) hdr.etag = new UUID(BigInt(st.mtime.getTime())).toString();

		if(hdr.etag && hdr.etag === req.headers['if-none-match']) {
			res.sendDate = false, res.writeHead(304, '', headers);
			return res.end(), f.close();
		}
		if(!str) str = f.createReadStream();

		if(headers) for(const k in headers) hdr[k] = headers[k];
		res.writeHead(stat, '', hdr);
		if(str instanceof Buffer) res.write(str), res.end();
		else (str as ReadStream).pipe(res);
		res.on('close', () => f.close());
		if(debug) log(fn.startsWith(root) ? fn.slice(root.length) : fn, ct);
	} catch(e: any) {
		const nf = e.code === 'ENOENT';
		if(debug || !nf) nf ? err('-- Not found') : err('-- Read', e);
		sendCode(res, nf ? 404 : 500, nf ? 'Resource Not Found' : e);
		if(f!) f.close();
	}
}

/** Serve a single file from `path` to the client */
async function serve(path: string, req: http.IncomingMessage,
	res: http.ServerResponse, headers?: http.OutgoingHttpHeaders) {
	const u = req.url;
	req.url = '/';
	return handle(path, req, res, undefined, headers).finally(() => req.url = u);
}

async function rngErr(f: fs.FileHandle, fl: number, rng: string, res: http.ServerResponse) {
	if(debug) err('-- Bad Range', rng);
	const h = {'content-range': 'bytes */' + fl};
	res.writeHead(416, '', h), res.end();
	f.close();
}

/** Convenience method for sending an error page to the client */
function sendCode(res: http.ServerResponse, code: number, msg: string) {
	res.writeHead(code, ''), res.write(`<pre style='font-size:16pt'>Error ${code}: ${msg}</pre>`), res.end();
}

const err = (m: string, e?: string) => console.error(C.red(m, e)),
	log = (name: string, ct?: string) => console.log(C.dim('-- Served ' + name + (ct ? ' with type ' + ct : '')));

async function resolve(dir: string, uri: string, vDir?: StringMap) {
	if(uri.indexOf('..') !== -1) throw 'Bad path';
	let fn = parseUri(dir, uri, vDir);
	if(fn.endsWith('/')) fn = fn.slice(0, -1);
	try {
		const stat = await fs.stat(fn);
		if(stat.isDirectory()) return path.join(fn, '/index.html'); //Try index
		return fn;
	} catch(e) {
		if(!path.extname(fn)) return fn + '.html'; //Try with ext
		throw e;
	}
}

function parseUri(root: string, uri: string, vDir?: StringMap) {
	if(vDir) {
		let v, vs;
		for(v in vDir) {
			vs = v.startsWith('/') ? v : '/' + v;
			if(uri.startsWith(vs)) return path.join(vDir[v]!, uri.slice(vs.length));
		}
	}
	return root + uri;
}

export default {
	/** Debug mode. `>= 1` = Enabled */
	get debug() {return debug},
	set debug(v: number) {debug = v},
	/** Etag mode for client-side caching
	- `0` or `false` = Disable
	- `> 0` Max file size to calc etag hash
	- `true` Fast mode; use modified date instead of hash */
	get etagMode() {return etagMode},
	set etagMode(v: number | boolean) {etagMode = v},
	handle,
	serve,
	sendCode,
	/** Map of file extensions to MIME types */
	types
};
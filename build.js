'use strict';

import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import { minify as mJS } from 'terser';
import C from 'chalk';

const dir=import.meta.dirname,
log=console.log, UTF={encoding:'utf8'},
R_SC=/;\n?(\/\/#.+)?$/,
dist=dir+'/dist',
jsOpts={
	ecma:2018, module:true,
	format:{inline_script:false, comments:false},
	compress:{passes:2, arguments:true, keep_fargs:false, keep_infinity:true, unsafe:true}
};

//==== Minify ====

async function minify(pin, _, fn) {
	try {
		let fin=pin+'/'+fn, ext=path.extname(fn), out, f;
		if(fin.indexOf('.min') !== -1) return;
		switch(ext) {
		case '.js':
			let map=fin+'.map';
			f=await fs.readFile(fin, UTF);
			await getSrc(map);
			out=await mJS(f, jsOpts), f=out.code;
			f=f.replace(R_SC,'$1');
			await fs.writeFile(fin, f);
			log(C.cyan("- "+fn));
			if(out.map) {
				await fs.writeFile(map, out.map);
				log(C.cyan("- "+fn+'.map'));
			}
		break; default:
			log(C.dim("- "+fn));
		}
	} catch(e) {
		log(C.red("- "+fn));
		throw e;
	}
}

async function getSrc(map) {
	try {
		jsOpts.sourceMap = {
			content: await fs.readFile(map, UTF),
			url: path.basename(map)
		};
	} catch(e) {delete jsOpts.sourceMap}
}

//==== Support ====

async function mkdir(p) {try {await fs.mkdir(p)} catch(e) {if(e.code!=='EEXIST') throw e}}
async function rm(p) {try {await fs.rm(p, {recursive:true})} catch(e) {if(e.code!=='ENOENT') throw e}}

function exec(cmd) {
	try {return execSync(cmd, {cwd:dir, encoding:'utf8', timeout:30000})}
	catch(e) {log(C.red(e.stdout+e.stderr)); throw e.message}
}

async function recurse(func, pin, pout) {
	let pl=[], d=await fs.readdir(pin, {withFileTypes:true});
	if(pout) await mkdir(pout);
	for(let f of d) {
		if(f.isFile()) pl.push(func(pin, pout, f.name));
		else if(f.isDirectory()) pl.push(recurse(func,
			path.join(pin,f.name), pout&&path.join(pout,f.name)));
	}
	await Promise.all(pl);
}

//==== Pipeline ====

log(C.bgYellow("Clean"));
await rm(dist);

log(C.bgYellow("Build TS"));
log(exec("npx tsc"));

log(C.bgYellow("Minify"));
await recurse(minify, dist);

log(C.green("Done!"));
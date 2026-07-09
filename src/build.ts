//Auto Build v2.3, Pecacheu 2026. GNU GPL v3

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import mHTML from '@minify-html/node';
import type { HtmlFileConfiguration } from '@pecacheu/esbuild-plugin-html';
import C from 'chalk';
import type { BuildContext, BuildOptions, Plugin } from 'esbuild';
import { type MinifyOptions, minify as mJS } from 'terser';

let esbuild: typeof import('esbuild') | undefined,
	pHTML: typeof import('@pecacheu/esbuild-plugin-html') | undefined;

try {esbuild = await import('esbuild')} catch(e) {}
if(esbuild) pHTML = await import('@pecacheu/esbuild-plugin-html');

const Mode = process.argv[2],
	Watch = Mode === 'watch',
	Dev = Watch || Mode === 'dev',
	Meta = Mode === 'meta',
	log = console.log,
	UTF = {encoding: 'utf8' as BufferEncoding},
	R_SC = /;\n?(\/\/#.+)?$/,
	_hFD: HtmlFileConfiguration[] = [];

/** Default build options */
const defaults = {
	//Paths
	/** Entrypoint of app for esbuild, relative to `srcCli`.
	You can also set `opts.esOpts.entryPoints` manually
	*/
	app: 'app.ts',
	/** Source directory */
	src: 'src',
	/** Build output directory */
	dist: 'dist',
	/** Client source dir, relative to `src` */
	srcCli: 'web',
	/** Client build output, relative to `dist` */
	distCli: 'web',
	/** Server source dir, relative to `src`.
	Set to `''` to disable server build */
	srcSrv: 'srv',

	//Hooks
	//TODO Make them work in watch mode
	/** Runs after build but before minify */
	onPreMin: null as (() => Promise<void>) | null,
	/** Runs after build completes
	@param ctx Only defined if esbuild is installed */
	onPostBuild: null as ((ctx?: BuildContext) => Promise<void>) | null,

	//Build
	/** JS extensions to minify */
	jsMinExt: ['.js'],
	/** HTML extensions to minify */
	htmlMinExt: ['.html'],
	/** Extensions to trim whitespace */
	trimExt: ['.css', '.svg'],
	/** Set to false to disable esbuild even if it is installed */
	esbuild: true,
	/** Esbuild HTML plugin options */
	htmlLoadOpts: {
		scriptLoading: 'module'
	} as Omit<HtmlFileConfiguration, 'filename' | 'htmlFile' | 'htmlTemplate'>,
	/** Esbuild options */
	esOpts: {
		bundle: true,
		minify: !Dev,
		sourcemap: Dev,
		format: 'esm',
		splitting: true,
		metafile: Meta ? true : undefined,
		loader: {
			'.svg': 'file',
			'.jpg': 'file',
			'.woff': 'copy',
			'.woff2': 'copy'
		},
		plugins: []
	} as BuildOptions,

	//Minify
	/** Terser minify options */
	jsMin: {
		ecma: 2020,
		module: true,
		format: {inline_script: false, comments: false},
		mangle: {properties: {regex: /^[_#]/}},
		compress: {passes: 2, arguments: true, keep_fargs: false, keep_infinity: true, unsafe: true}
	} as MinifyOptions,
	/** HTML minify options */
	htmlMin: {
		allow_optimal_entities: true,
		allow_removing_spaces_between_attributes: true,
		minify_css: true,
		minify_js: true
	} as Parameters<typeof mHTML.minify>[1]
};

export type Options = typeof defaults;
let opts!: Options, _hPl: Plugin;

//==== Minify ====

async function minify(pin: string, _: any, fn: string) {
	let fin = `${pin}/${fn}`, ext = path.extname(fn), f;
	if(fin.indexOf('.min') !== -1) return;
	const fls = fin.slice(opts.dist.length + 1);
	try {
		if(opts.jsMinExt.includes(ext)) { //Minify JS
			const map = `${fin}.map`;
			f = await fs.readFile(fin, UTF);
			try {
				await getSrc(map);
				const out = await mJS(f, opts.jsMin);
				f = out.code!.replace(R_SC, '$1');
				if(out.map) {
					await fs.writeFile(map, out.map as string);
					log(C.cyan(`- ${fls}.map`));
				}
			} finally {delete opts.jsMin.sourceMap}
			await fs.writeFile(fin, f);
			log(C.cyan(`- ${fls}`));
		} else if(opts.htmlMinExt.includes(ext)) { //Minify HTML
			f = mHTML.minify(await fs.readFile(fin), opts.htmlMin);
			await fs.writeFile(fin, f);
			log(C.cyan(`- ${fls}`));
		} else if(opts.trimExt.includes(ext)) { //Trim
			f = (await fs.readFile(fin, UTF)).trim();
			await fs.writeFile(fin, f);
			log(C.magenta(`- ${fls}`));
		} else { //Log
			log(C.dim(`- ${fls}`));
		}
	} catch(e) {
		log(C.red(`- ${fls}`));
		throw e;
	}
}

async function getSrc(map: string) {
	try {
		opts.jsMin.sourceMap = {
			content: await fs.readFile(map, UTF),
			url: path.basename(map)
		};
	} catch(e) {}
}

function addHTML(pin: string, _: any, fn: string) {
	if(fn.endsWith('.html') && fn[0] !== '+') _hFD.push({
		filename: fn, htmlFile: `${pin}/${fn}`, ...opts.htmlLoadOpts
	});
}

/** Set overrides for build options */
function setOpts(o?: Partial<Options>) {
	const oo = opts ? [opts.srcCli, opts.distCli, opts.srcSrv, opts.app] : [];
	opts = o ? {...defaults, ...o} : defaults;

	if(opts.srcCli !== oo[0]) opts.srcCli = path.join(opts.src, opts.srcCli);
	if(opts.distCli !== oo[1]) opts.distCli = path.join(opts.dist, opts.distCli);
	if(opts.srcSrv !== oo[2]) opts.srcSrv = opts.srcSrv ? path.join(opts.src, opts.srcSrv) : '';
	if(opts.app !== oo[3]) opts.app = opts.app ? path.join(opts.srcCli, opts.app) : '';

	if(opts.app) opts.esOpts.entryPoints = [opts.app];
	opts.esOpts.target = `es${opts.jsMin.ecma}`;
	opts.esOpts.outdir = opts.distCli;
};

/** Default build pipeline */
async function run() {
	if(!opts) setOpts();

	if(!Dev) {
		log(C.bgYellow('Clean'));
		await rm(opts.dist);

		if(opts.srcSrv) {
			log(C.bgYellow('Build Server'));
			await exec(`npx tsc -p ${opts.srcSrv}`);
		}
	}

	await mkdir(opts.srcCli);

	log(C.bgYellow('Build'));
	if(esbuild && opts.esbuild) {
		await recurse(addHTML, opts.srcCli);
		if(opts.esOpts.plugins) opts.esOpts.plugins = [];
		else if(_hPl) opts.esOpts.plugins!.remove(_hPl);
		_hPl = pHTML!.htmlPlugin({files: _hFD});
		opts.esOpts.plugins!.push(_hPl);
		const ctx = await esbuild.context(opts.esOpts);

		if(Watch) {
			await ctx.watch();
			log('Watching for changes...');
		} else {
			const build = await ctx.rebuild();
			if(Meta) await fs.writeFile('meta.json', JSON.stringify(build.metafile));
			_minify();
			await ctx.dispose();

			await opts.onPostBuild?.(ctx);
			log(C.green('Done!'));
		}
	} else {
		await exec('npx tsc');
		_minify();

		await opts.onPostBuild?.();
		log(C.green('Done!'));
	}
};

//==== Support ====

const _minify = async () => {
	await opts.onPreMin?.();

	if(!Dev) {
		log(C.bgYellow('Minify'));
		await recurse(minify, opts.dist);
	}
};

/** Recursively create the directory, if it doesn't exist */
async function mkdir(path: string) {
	try {await fs.mkdir(path, {recursive: true})} catch(e) {
		if((e as any).code !== 'EEXIST') throw e;
	}
}

/** Recursively remove the file or directory, if it exists */
async function rm(path: string) {
	try {await fs.rm(path, {recursive: true})} catch(e) {
		if((e as any).code !== 'ENOENT') throw e;
	}
}

/** Run the shell command, mirroring output to console */
function exec(cmd: string) {
	return new Promise((res, rej) => {
		const p = spawn(cmd, {shell: true, stdio: 'inherit'});
		p.on('exit', c => c ? rej(`Exit Code ${c}`) : res());
		p.on('error', rej);
	}) as Promise<void>;
}

/** Recurse over all files in a directory */
async function recurse(func: (pin: string, pout: string | null, filename: string)
=> void, pin: string, pout?: string | null) {
	const pl = [], d = await fs.readdir(pin, {withFileTypes: true});
	if(pout) await mkdir(pout);
	for(const f of d) {
		if(f.isFile()) pl.push(func(pin, pout!, f.name));
		else if(f.isDirectory()) pl.push(recurse(func,
			path.join(pin, f.name), pout && path.join(pout, f.name)));
	}
	await Promise.all(pl);
}

export default {
	/** Default build options */
	defaults,
	/** Current options (read-only) */
	get opts() {return opts},
	setOpts,
	run,
	mkdir,
	rm,
	exec,
	recurse,
	Watch,
	Dev,
	Meta
};
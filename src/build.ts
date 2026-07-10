//Auto Build, Pecacheu 2026. GNU GPL v3

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { type minify as htmlMin } from '@minify-html/node';
import type { HtmlFileConfiguration } from '@pecacheu/esbuild-plugin-html';
import C from 'chalk';
import type { BuildContext, BuildOptions, Plugin } from 'esbuild';
import { type MinifyOptions, minify as mJS } from 'terser';

let esbuild: typeof import('esbuild') | undefined,
	pHTML: typeof import('@pecacheu/esbuild-plugin-html') | undefined,
	mHTML: typeof import('@minify-html/node') | undefined;

try {esbuild = await import('esbuild')} catch(e) {}
if(esbuild) pHTML = await import('@pecacheu/esbuild-plugin-html');
try {mHTML = await import('@minify-html/node')} catch(e) {}

const Mode = process.argv[2],
	Watch = Mode === 'watch',
	Dev = Watch || Mode === 'dev',
	Meta = Mode === 'meta',
	log = console.log,
	UTF = {encoding: 'utf8' as BufferEncoding},
	R_SC = /;\n?(\/\/#.+)?$/,
	HFD: HtmlFileConfiguration[] = [];

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
	srcCli: '',
	/** Client build output, relative to `dist`.
	Defaults to matching srcCli */
	distCli: '',
	/** Server source dir, relative to `src`.
	Set to `''` to disable server build */
	srcSrv: '',

	//Hooks
	/** Runs before client build */
	onPreBuild: null as ((ctx?: BuildContext) => Promise<void>) | null,
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
		compress: {
			passes: 2,
			arguments: true,
			keep_fargs: false,
			keep_infinity: true,
			drop_console: ['debug'],
			unsafe: true,
			unsafe_arrows: true,
			unsafe_math: true,
			unsafe_methods: true
		}
	} as MinifyOptions,
	/** HTML minify options */
	htmlMin: {
		allow_optimal_entities: true,
		allow_removing_spaces_between_attributes: true,
		minify_css: true,
		minify_js: true
	} as Parameters<typeof htmlMin>[1]
};

export type Options = typeof defaults;
let opts!: Options, Ctx: BuildContext | undefined;

//==== Minify ====

async function minify(pin: string, _: any, fn: string) {
	const fin = `${pin}/${fn}`;
	if(fin.indexOf('.min') !== -1) return;
	const ext = path.extname(fn), fls = fin.slice(opts.dist.length + 1);
	try {
		let f;
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
		} else if(mHTML && opts.htmlMinExt.includes(ext)) { //Minify HTML
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
	if(fn.endsWith('.html') && fn[0] !== '+') HFD.push({
		filename: fn, htmlFile: `${pin}/${fn}`, ...opts.htmlLoadOpts
	});
}

const buildPlugin: Plugin = {
	name: 'build',
	setup(build) {
		build.onStart(_preBuild);
		build.onEnd(() => opts.onPostBuild?.(Ctx));
	}
};

/** Set overrides for build options */
function setOpts(o?: Partial<Options>) {
	const oo = opts ? [opts.srcCli,
		opts.distCli,
		opts.srcSrv,
		opts.app,
		opts.esOpts.plugins] : [];
	opts = o ? {...defaults, ...o} : defaults;

	const scChg = opts.srcCli !== oo[0], dcChg = opts.distCli !== oo[1];
	if(scChg) opts.srcCli = path.join(opts.src, opts.srcCli);
	if(scChg || dcChg) opts.distCli = opts.distCli ? dcChg ?
		path.join(opts.dist, opts.distCli) : opts.distCli : opts.srcCli;
	if(opts.srcSrv !== oo[2]) opts.srcSrv = opts.srcSrv ? path.join(opts.src, opts.srcSrv) : '';
	if(opts.app !== oo[3]) opts.app = opts.app ? path.join(opts.srcCli, opts.app) : '';

	if(opts.app) opts.esOpts.entryPoints = [opts.app];
	opts.esOpts.target = `es${opts.jsMin.ecma}`;
	opts.esOpts.outdir = opts.distCli;

	if(esbuild && opts.esOpts.plugins !== oo[4])
		(opts.esOpts.plugins ?? (opts.esOpts.plugins = [])).push(buildPlugin, pHTML!.htmlPlugin({files: HFD}));
};

/** Default build pipeline */
async function run() {
	if(Ctx) return;
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
		Ctx = await esbuild.context(opts.esOpts);
		if(Watch) {
			await Ctx.watch();
			return log('Watching for changes...');
		} else {
			const build = await Ctx.rebuild();
			if(Meta) await fs.writeFile('meta.json', JSON.stringify(build.metafile));
			await _minify();
			await Ctx.dispose();
			Ctx = undefined;
		}
	} else {
		await _preBuild();
		await exec('npx tsc' + (Dev ? ' --sourceMap' : ''));
		await _minify();
		await opts.onPostBuild?.();
	}
	log(C.green('Done!'));
};

//==== Support ====

const _preBuild = async () => {
	await opts.onPreBuild?.(Ctx);
	await recurse(addHTML, opts.srcCli);
};

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
	addHTML,
	minify,
	Watch,
	Dev,
	Meta
};
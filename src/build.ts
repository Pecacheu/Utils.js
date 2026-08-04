//Auto Build, Pecacheu 2026. GNU GPL v3

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { type minify as htmlMin } from '@minify-html/node';
import type { HtmlFileConfiguration } from '@pecacheu/esbuild-plugin-html';
import C from 'chalk';
import type { BuildContext, BuildOptions, Plugin } from 'esbuild';
import { type MinifyOptions, type CompressOptions, minify as mJS } from 'terser';
import utils from 'raiutils';

let esbuild: typeof import('esbuild') | undefined,
	pHTML: typeof import('@pecacheu/esbuild-plugin-html') | undefined,
	mHTML: typeof import('@minify-html/node') | undefined;

try {esbuild = await import('esbuild')} catch(e) {}
if(esbuild) pHTML = await import('@pecacheu/esbuild-plugin-html');
try {mHTML = (await import('@minify-html/node')).default} catch(e) {}

const WatchPoll = 50,
	WatchDelay = 500,
	Mode = process.argv[2],
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
	/** Entrypoint(s) to use if using esbuild, relative to `srcCli`.
	Sets `opts.esOpts.entryPoints` automatically */
	app: 'app.ts' as string | string[],
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
	/** Custom server build command, for projects not using TypeScript */
	srvCmd: '',

	//Hooks
	/** Runs before client build
	@param ctx Only defined if using esbuild */
	onPreBuild: null as ((ctx?: BuildContext) => Promise<void>) | null,
	/** Runs before server build */
	onPreBuildSrv: null as (() => Promise<void>) | null,
	/** Runs after build but before minify */
	onPreMin: null as (() => Promise<void>) | null,
	/** Runs after client build completes
	@param ctx Only defined if using esbuild */
	onPostBuild: null as ((ctx?: BuildContext) => Promise<void>) | null,
	/** Runs after client build completes */
	onPostBuildSrv: null as (() => Promise<void>) | null,

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
	/** Override automatic detection and manually supply files to esbuild HTML plugin.
	Unless you specify `htmlTemplate`, `htmlFile` defaults to `{srcCli}/{filename}` */
	htmlFiles: undefined as HtmlFileConfiguration[] | undefined,
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
			'.png': 'file',
			'.jpg': 'file',
			'.json': 'copy',
			'.woff': 'copy',
			'.woff2': 'copy'
		},
		plugins: []
	} as BuildOptions,

	//Minify
	/** Terser minify options. `jsMin.ecma` sets compress and format too */
	jsMin: {
		ecma: 2025,
		module: true,
		format: {inline_script: false, comments: false},
		mangle: {module: true, properties: {regex: /^[_#]/}},
		compress: {
			passes: 2,
			arguments: true,
			keep_fargs: false,
			keep_infinity: true,
			drop_console: ['debug'],
			unsafe: true,
			unsafe_arrows: true,
			unsafe_math: true,
			unsafe_methods: true,
			builtins_pure: true
		}
	} as MinifyOptions,
	/** Strip private props (e.g. #x) from build for
	smaller code size and greater compatibility */
	stripPriv: false,
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
let jsMinInit: MinifyOptions;

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
				let out;
				//Run without compress to mangle priv names
				if(opts.stripPriv) {
					jsMinInit.sourceMap = opts.jsMin.sourceMap;
					out = await mJS(f, jsMinInit);
					f = out.code!;
					if(out.map) opts.jsMin.sourceMap = {
						content: out.map as string,
						url: path.basename(map)
					};
				}
				out = await mJS(f, opts.jsMin);
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
		if(Watch) build.onEnd(() => opts.onPostBuild?.(Ctx));

		//Minified JSON loader
		const loader = opts.esOpts.loader?.['.json'] || 'copy';
		build.onResolve({filter: /\.json$/}, args => ({path: args.path, namespace: 'min-json'}));
		build.onLoad({filter: /.*/, namespace: 'min-json'}, async args => ({
			contents: JSON.stringify(JSON.parse(await fs.readFile(args.path, 'utf8'))),
			loader
		}));
	}
};

/** Set overrides for build options */
function setOpts(o?: Partial<Options>) {
	opts = utils.copy(o ? {...defaults, ...o} : defaults);

	opts.distCli = path.join(opts.dist, opts.distCli || opts.srcCli);
	opts.srcCli = path.join(opts.src, opts.srcCli);
	opts.srcSrv = opts.srcSrv ? path.join(opts.src, opts.srcSrv) : '';

	const compress = (opts.jsMin.compress ||= {}) as CompressOptions;
	compress.builtins_ecma = compress.ecma = (opts.jsMin.format ||= {}).ecma = opts.jsMin.ecma;
	jsMinInit = {...opts.jsMin, compress: false};

	if(!esbuild || !opts.esbuild) return;
	const app = Array.isArray(opts.app) ? opts.app : [opts.app];
	opts.esOpts.entryPoints = app.map(a => path.join(opts.srcCli, a));

	if(opts.htmlFiles) {
		let f, k: keyof typeof opts.htmlLoadOpts;
		for(f of opts.htmlFiles) {
			if(!f.htmlTemplate && !f.htmlFile) f.htmlFile = path.join(opts.srcCli, f.filename);
			f.entryPoints = f.entryPoints?.map(p => path.join(opts.srcCli, p));
			f.ignoreAssets = Array.isArray(f.ignoreAssets)
				? f.ignoreAssets.map(p => path.join(opts.srcCli, p))
				: undefined;
			for(k in opts.htmlLoadOpts) (f[k] as unknown) ||= opts.htmlLoadOpts[k];
		}
		HFD.length = 0;
		HFD.push(...opts.htmlFiles);
	}

	opts.esOpts.outdir = opts.distCli;
	(opts.esOpts.plugins ||= []).push(buildPlugin, pHTML!.htmlPlugin({files: HFD}));
};

/** Default build pipeline */
async function run() {
	if(Ctx) return;
	if(!opts) setOpts();

	if(!Dev) {
		log(C.bgYellow('Clean'));
		await rm(opts.dist);
	}

	await terserPrivFix();
	await Promise.all([_buildSrv(), _buildCli()]);

	if(Watch) {
		log('Watching for changes...');
		if(opts.srcSrv) watch(opts.srcSrv, _buildSrv);
		if(opts.srcCli && !(esbuild && opts.esbuild)) watch(opts.srcCli, _buildCli);
	} else {
		await _minify();
		await opts.onPostBuild?.();
		await opts.onPostBuildSrv?.();
		log(C.green('Done!'));
	}
};

/** Watch dir at `fn` for changes */
async function watch(fn: string, cb: (ev: fs.FileChangeInfo<string>) => Promise<void>) {
	const fw = fs.watch(fn, {recursive: true});
	let tmr: NodeJS.Timeout | undefined, lck = false;
	for await (const ev of fw) {
		if(!tmr) tmr = setInterval(async () => {
			if(lck) return;
			clearInterval(tmr);
			tmr = undefined, lck = true;
			await cb(ev);
			await utils.delay(WatchDelay);
			lck = false;
		}, WatchPoll);
	}
};

//==== Support ====

const _buildSrv = async () => {
	if(opts.srcSrv) {
		log(C.bgYellow('Build Server'));
		await opts.onPreBuildSrv?.();
		await exec(opts.srvCmd || `npx tsc -p ${opts.srcSrv}` + (Dev ? ' --sourceMap' : ''));
		if(Watch) await opts.onPostBuildSrv?.();
	}
};

const _buildCli = async () => {
	if(!opts.srcCli) return;
	log(C.bgYellow('Build'));
	if(esbuild && opts.esbuild) {
		Ctx = await esbuild.context(opts.esOpts);
		if(Watch) return await Ctx.watch();
		const build = await Ctx.rebuild();
		if(Meta) await fs.writeFile('meta.json', JSON.stringify(build.metafile));
		await Ctx.dispose();
		Ctx = undefined;
	} else {
		await _preBuild();
		await exec('npx tsc' + (Dev ? ' --sourceMap' : ''));
		if(Watch) await opts.onPostBuild?.();
	}
};

const _preBuild = async () => {
	await opts.onPreBuild?.(Ctx);
	if(!opts.htmlFiles) {
		HFD.length = 0;
		await recurse(addHTML, opts.srcCli);
	}
};

const _minify = async () => {
	if(!Dev) {
		await opts.onPreMin?.();
		log(C.bgYellow('Minify'));
		await recurse(minify, opts.dist);
	}
};

const TDir = 'node_modules/terser/',
	TPR = TDir + 'lib/output.js',
	TPE = TDir + 'lib/output.edit',
	CPR = '(DEFPRINT\\(AST_ClassProperty.+?{)',
	CPF = 'if(!self.value)return;',
	R_CPR = new RegExp(CPR),
	R_CPO = new RegExp(CPR + RegExp.escape(CPF)),
	R_TPR = /"(\.?)#"/g,
	R_TPO = /__PRIV_/g;

let tvChk: number;
async function terserPrivFix() {
	let edit = true;
	try {
		await fs.access(TPE);
	} catch(e) {edit = false}
	if(opts.stripPriv === edit) return;

	if(!tvChk) {
		const v = JSON.parse(await fs.readFile(TDir + 'package.json', UTF)).version;
		if(Number(v.slice(0, v.indexOf('.'))) !== 5) throw `Incompatible Terser v${v} for stripPriv option.`;
	}
	tvChk = 1;

	//Yes, we are altering Terser's source code
	let f = await fs.readFile(TPR, UTF);
	f = edit ? f.replace(R_TPO, '#').replace(R_CPO, '$1')
		: f.replace(R_TPR, '"$1__PRIV_"').replace(R_CPR, '$1' + CPF);
	await fs.writeFile(TPR, f);
	if(edit) await fs.rm(TPE);
	else await fs.writeFile(TPE, '');
}

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
	watch,
	Watch,
	Dev,
	Meta
};
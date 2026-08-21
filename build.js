//https://github.com/Pecacheu/Utils.js; GNU GPL v3

import fs from 'fs/promises';
import path from 'path';
import C from 'chalk';
import build from 'raiutils/build';

const log = console.log,
	UTF = {encoding: 'utf8'},
	LibDel = '(ext || (ext = {}))',
	LibRep = '(U)';

build.setOpts({
	esbuild: false,
	stripDebug: false,
	stripPriv: true,
	jsMin: {...build.defaults.jsMin, ecma: 2020},
	onPreMin: async () => {
		log(C.bgYellow('Codegen'));
		await build.recurse(libGen, build.opts.dist);
	}
});

async function libGen(pin, _, fn) {
	try {
		const ext = path.extname(fn);
		if(ext !== '.js') return;
		let fin = pin + '/' + fn, f = await fs.readFile(fin, UTF), li = f.indexOf(LibDel);
		if(li !== -1) {
			f = f.slice(0, li) + LibRep + f.slice(li + LibDel.length);
			await fs.writeFile(fin, f);
			log(C.cyan(`- ${fn}`));
		}
	} catch(e) {
		log(C.red(`- ${fn}`));
		throw e;
	}
}

await build.run();
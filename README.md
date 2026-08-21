# RaiUtils
###### If you prefer native JS to jQuery or using bloated web frameworks, but can't live without those one or two essential features, then you need RaiUtils!

![npm](https://img.shields.io/npm/v/raiutils.svg)

Also check out [C-Utils](https://github.com/Pecacheu/C-Utils) and [PyColorUtils](https://github.com/Pecacheu/PyColor).

### Now includes TypeScript & Node.js support!

Install via `npm i raiutils`. To use raiutils on the web, you'll need a package bundler and build system. We recommend `esbuild` via the included [Build](#build) module, but webpack or other bundlers work fine too!

If you'd like to forego a bundler entirely, you take advantage of ES module support in modern browsers and include the built JS directly. You can find it under `dist/` [here](https://www.npmjs.com/package/raiutils?activeTab=code). The package is built to work down to **es2018**, so any vaguely modern browser should work. *(Warning: BigInt won't work before `es2020`, but BigInt functions in this library fallback silently to Numbers.)*

# Utils
The base package contains a ton of useful features and language extensions, which work in both NodeJS and the browser, whether you use a package manager or not! It also bundles in a few automatic polyfills for useful Newly Available native features.

```js
import utils from 'raiutils';

console.log("Hello utils", utils.VER, await utils.getIPs());
```

For a complete list of functions, please check `src/utils.ts` or use an IDE that supports JSDoc.

## Most popular features
- `utils.mobile` True if running on a mobile device, based on the UserAgent.
- `utils.device` Parsed info about the user's device from the UserAgent.
- `utils.mkEl` / `utils.mkDiv` Generate DOM elements with ease! Just remember PCSI: *Parent, class, style, and innerHTML.* Set any option to *null* to skip it.
- `utils.onNav` & `utils.go` Navigation helpers that make it easy to develop SPAs (Single-Page Applications) without a heavy, bloated framework like React or Angular.
- `utils.delay` SetTimeout but async. *Seriously, how is this not built-in?*
- `UtilRect` Getting the bounds/position of an element used to be a complete mess with incompatibilities across every browser. **Not anymore!** UtilRects store position and size like DOMRects, but they also offer computed (and cached for performance) width and height, centerX and centerY, and useful methods like `contains`, `overlaps`, `dist`, and `expand`. You can easily get the UtilRect of any element using `[Element].boundingRect` or `[Element].innerRect`.
- `[Element].index` and `[Element].insertChildAt` prototype extensions make it easier to work with lists or tables via relative index position in their parent.
- `utils.rand` Generate random numbers from min to max, with optional decimal resolution and bias curve.
- `utils.abs` / `utils.min` / `utils.max` Like their **Math** equivalents, but they work with **BigInt** too!
- `[Array].each` / `[Array].eachAsync` Works similar to *[Array].forEach*, but allows a custom start and end index (including negative for relative-to-end), enables deleting elements during iteration by returning `!`, and if any other value besides *null* is returned, *each()* breaks the loop and returns the value in question, enabling slick one-liners that search an array for a specific condition.

## Polyfills
- [RegExp.escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape)
- [Uint8Array.fromBase64](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64)
- [Uint8Array.toBase64](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64)
- [Array.at](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at)

# Build
A lightweight, preconfigured build system for libraries, tools, and apps, optimized for both monorepo *(when the client and server both occupy the same shared parent repository)* and frontend/backend-only project structures. It's also how we build RaiUtils itself!

Add this to your `package.json`:
```json
{
	"scripts": {
		"build": "node build",
		"dev": "node build watch"
	},
	"dependencies": {
		"@babel/parser": "^7.29.8",
		"@minify-html/node": "^0.18.1",
		"@types/node": "^26.1.1",
		"recast": "^0.24.0",
		"terser": "^5.46.0",
		"typescript": "^6.0.3"
	}
}
```

And if you plan to use [esbuild](https://esbuild.github.io):
```json
"dependencies": {
	"@pecacheu/esbuild-plugin-html": "^0.11.1",
	"esbuild": "^0.28.1"
}
```

Then create a `build.js` file:
```js
import build from 'raiutils/build';

//Define custom options
build.setOpts({
	app: 'main.ts',
	src: './myCustomPath',
	jsMin: {...build.defaults.jsMin, ecma: 2018},
	onPostBuild: async () => {
		console.log("Build complete!");
	}
});

//Run the build
await build.run();
```

Running build script:
- `node build` Run build in production mode
- `node build dev` Run build in dev mode
- `node build watch` Run dev build & watch for changes

If esbuild is installed:
- `node build meta` Build & export metafile

# Router
A super-lightweight minimal web server engine for Node.js. Easy to use, but safe from naughty tricks like directory traversal. Built-in support for common MIME types, client caching via the `etag` header, and even streaming media download via `content-range`.

```js
import http from 'http';
import router from 'raiutils/router';

const debug = 1,
dir = import.meta.dirname,
root = dir+"/web",
vDir = {
	'coffee.js': dir+"/scripts/coffee.js"
};

router.debug = debug;

http.createServer((req, res) => {
	if(debug) console.log("[REQ]", req.url);
	//Special overrides
	if(req.url === '/game/theory') {
		res.write("Hello internet!");
		res.end();
	} else {
		//Standard pages
		router.handle(root, req, res, vDir);
	}
}).listen(8080, () => {
	console.log("Server up at http://localhost:8080");
});
```

## Methods
- `handle(root, req, res[, vDir])` Serve files from a directory
- `serve(path, req, res)` Serve a single file to the client
- `sendCode(res, code, msg)` Send an error page to the client
- `etagMode` Set etag mode for client-side caching
- `types` Map of common MIME types

# UUID
This module provides **ChuID**, a 64-bit UUID format that outputs as a compact, 11 character Base64 string. ChuID is made for situations where a longer 128-bit format like UUIDv4 or ULID is overkill, taking up less than half the space for lower-traffic situations that still require guaranteed uniqueness and some cryptographic randomness.

Format: `<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>`

And yes, we did the math for you:
- Internally stored as an 8-byte Buffer.
- Canonically encoded as an 11-character base64url string.
- Case-sensitive, but URL-safe.
- Magic value can hold 1 byte of custom type information (0-255).
- Datestamp counted to 10s accuracy, will not overflow until the year 3331.
- Uptime counted to 100ms accuracy and resets every 25.6s.
- Global persistent counter resets every 256 IDs.
- This means we can guarantee 2560 unique ChuIDs per second, or ~2.5/ms.

In reality, this number is far higher due to crypto randomness, which can supply an additional 8-16 bits of entropy. In the event that IDs are generated in rapid succession (<100ms apart), ChuID internally begins to track each ID, and will only block if an actual duplicate is found. This data is cleared upon the next time window. On my dev laptop with a Core Ultra 7, it takes ~2.6 microseconds to generate an ID asynchronously. Real-world tests show max throughput of ~385K IDs/s, the expected timer reset period of ~100ms, and an average of **299,385 unique IDs/s** before a collision (w/ anti-collision mechanism disabled), or **77,217** with a magic value set.

*Note: For browser use, UUID requires polyfill via `npm i buffer`.*

```js
import UUID from 'raiutils/uuid';

//Current date, magic value 15
const id = UUID.genUUID(0, 15);

console.log(id, `String: ${id}\n`,
	id.getDate(), id.getMagic());
```

## Methods
- `new UUID(id)` Construct from a string, Buffer, or if *mongodb* is installed, mdb.Long
- `UUID.genUUID([date[, magic]])` Generate new random UUID w/ optional date and magic

# ChuSchema
**ChuSchema** is an easy-to-use schema format that provides rigorous yet flexible validation of JSON input to ensure it follows the desired structure.

```js
import CS from 'raiutils/schema';

const schema = {
	name: {t: 'str', f: /^[a-z]+$/},
	signals: {t: 'list', c: 'bool'},
	vals: {t: 'list',
		f: {
			count: {t: 'int', min: 0, req: false},
			hey: {t: 'bool', rej: par => par.count === 0}
		}}
};

try {
	CS.checkSchema({
		name: 'abc',
		signals: [true, false],
		vals: [
			{count: 15, hey: true}
		]
	}, schema);
} catch(e) {
	console.log('Schema check failed @', e);
}
```

## Methods
- `checkSchema(data, schema[, opt])` Check data against a schema
- `checkType(val, ent[, opt])` Check value against a single schema entry
- `prettyJSON(val)` Custom JSON stringify implementation w/ better line-breaks
- `errAt(key, err[, isList])` Create pretty nested errors

# Grabable
A lightweight, performant, touch-friendly library for handling drag-and-drop for lists, grids, and fixed-position targets with a flexible API.

> example.css
```css
.grabItm, .grabItm * { user-select:none; touch-action:none; }
.grabbing { box-sizing:border-box; opacity:.8; z-index:99; }
.grabBox { box-sizing:border-box; border:2px dashed #bbb; }
.grabOver { outline:5px solid #bbb; }
```

> example.js
```js
import utils from 'raiutils';
import { Grabable } from 'raiutils/grab';

const parent = utils.mkDiv(document.body);
for(let i = 0; i < 10; ++i) {
	utils.mkDiv(parent, null, null, 'Child ' + i);
}

const grab = new Grabable(parent, {maxDist: 20});

grab.onDrop = (grab, target, e) => {
	if(e) console.log('Child', target, 'of', grab, 'dropped at index', target.index, e);
	else console.log('Child', target, 'of', grab, 'drop cancelled');
};
```
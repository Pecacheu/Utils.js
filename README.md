# Utils.js
###### If you prefer native JS to jQuery or using bloated web frameworks, but can't live without those one or two essential features, then you need Utils.js!

Also check out [C-Utils](https://github.com/Pecacheu/C-Utils) and [PyColorUtils](https://github.com/Pecacheu/PyColor).

### Now includes TypeScript & Node.js support!

Install via `npm i raiutils`. You can also use raiutils in the browser without a package manager! Simply bundle the minified `dist/utils.min.js`. The package is built to work down to **es2018**, so any vaguely modern browser should work. *(Warning: BigInt won't work before `es2020`, but BigInt functions in this library fallback silently to Numbers.)*

# RaiUtils
The base package contains a ton of useful features and language extensions, which work in both NodeJS and the browser, whether you use a package manager or not! It also bundles in some polyfills for newly available features

```js
import utils from 'raiutils';

console.log("Hello utils", utils.VER, await utils.getIPs());
```

For a complete list of functions, please check `src/utils.ts` or use an IDE that supports JSDoc.

## Most popular features
- `UserAgentInfo utils.device` Parsed info about the user's device from the UserAgent.
- `Boolean utils.mobile` True if running on a mobile device, based on the UserAgent.
- `utils.mkEl` / `utils.mkDiv` Generate DOM elements with ease! Just remember PCSI: *Parent, class, style, and innerHTML.* Set any option to *null* to skip it.
- `[Array].each` / `[Array].eachAsync` Works similar to *[Array].forEach*, but allows a custom start and end index (including negative for relative-to-end), enables deleting elements during iteration by returning `!`, and if any other value besides *null* is returned, *each()* breaks the loop and returns the value in question, enabling slick one-liners that search an array for a specific condition.
- `UtilRect` Getting the bounds/position of an element used to be a complete mess with incompatibilities across every browser. **Not anymore!** Use UtilRects to keep track of your object positions! Simply access the *boundingRect* property of any Element and you can access it's *top*, *bottom*, *left*, *right*, *width*, and *height* on the client's screen! If you need this relative to the top of the page, it's as simple as `Element.boundingRect.top + window.scrollY`.
- `utils.center` Does what it says on the tin! Input an Element, choose whether you want X, Y, or by default, both, and change the centering type.
- `utils.rand` Generate random numbers from min to max, with optional decimal resolution and bias curve.
- `utils.abs` / `utils.min` / `utils.max` Like their **Math** equivalents, but they work with **BigInt** too!

# Router
A super-lightweight minimal web server engine for Node.js. Easy to use, but safe from naughty tricks like directory traversal, built-in support for common MIME types, client caching via the `etag` header, and even streaming media download via `content-range`.

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
This module provides **ChuID**, a 64-bit UUID format that outputs as a compact, 11 character Base64 string. ChuID is made for situations where a longer 128-bit format like UUIDv4 is overkill.

Format: `<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>`

*Note: For browser use, UUID requires `npm i buffer`.*

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
	name: {t:'str', f:/^[a-z]+$/},
	signals: {t:'list', c:'bool'},
	vals: {t:'list', f:{
		count: {t:'int', min:0, req:false},
		hey: {t:'bool', rej:par => par.count===0}
	}}
}

try {
	CS.checkSchema({
		name: "abc",
		signals: [true, false],
		vals: [
			{count: 15, hey: true}
		]
	}, schema);
} catch(e) {
	console.log("Schema check failed @", e);
}
```

## Methods
- `checkSchema(data, schema[, opt])` Check data against a schema
- `checkType(val, ent[, opt])` Check value against a single schema entry
- `prettyJSON(val)` Custom JSON stringify implementation w/ better line-breaks
- `errAt(key, err[, isList])` Create pretty nested errors
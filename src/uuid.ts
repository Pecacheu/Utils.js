//Chu ID v1.5.3, Pecacheu 2026. GNU GPL v3

import { Buffer } from 'buffer';
import utils from 'raiutils';

declare type os = typeof import('os');
declare type fs = typeof import('fs/promises');
interface Long {unsigned: boolean; toString(r: number): string}

const [os, fs, U, C] = await utils.importNode('os', 'fs/promises', 'util', 'crypto');
const cRand = utils.isNode ? U.promisify(C.randomBytes) : null;

let Long: any;
try {Long = (await utils.importNode('mongodb'))[0].Long} catch(e) {}

const ID_FN = import.meta.dirname+'/uuid';
let Cnt: number, CLT: number, LT: number,
LD: number, UT: NodeJS.Timeout | boolean;

//64-bit UUID Format
//<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>

const swapHex = (h: string) => h.match(/.{2}/g)!.reverse().join('');

async function loadId() {
	if(!fs) return Cnt = utils.rand(0,255);
	//Prevent race condition
	if(UT === true) {
		while(UT === true) await utils.delay(10);
		return;
	}
	UT=true;
	try {Cnt = Number(await fs.readFile(ID_FN, {encoding:'utf8'}))} catch(e) {}
	if(!(Cnt >= 0 && Cnt <= 255)) console.error("[ChuID] IDCount error, resetting"), Cnt=0;
	UT=false;
}

const B0 = BigInt(0),
	B64 = BigInt('18446744073709551615');

export default class UUID {
	static readonly LEN = 11;
	static readonly BYTES = 8;
	/** Delay before writing ID file to disk */
	static ID_Delay = 10000;
	id: Buffer;

	constructor(id: string | Buffer | Uint8Array | bigint | Long) {
		if(id instanceof Uint8Array && id.length === UUID.BYTES) {}
		else if(typeof id === 'string' && id.length === UUID.LEN) {
			if(utils.isNode) id=Buffer.from(id, 'base64');
			else id=Uint8Array.fromBase64(id, {alphabet:'base64url'});
		} else if(typeof id === 'bigint' && id > B0 && id <= B64) {
			const n=id;
			(id=Buffer.allocUnsafe(8)).writeBigUInt64LE(n);
		} else if(Long && id instanceof Long) {
			(id as Long).unsigned=true;
			id=Buffer.from((id as Long).toString(16),'hex');
		} else throw `Unknown UUID format ${id}`;
		this.id = id instanceof Buffer?id:Buffer.from(id.buffer);
	}
	toString(f?: BufferEncoding) {
		if(utils.isNode || f) return this.id.toString(f||'base64url');
		return this.id.toBase64({alphabet:'base64url', omitPadding:true});
	}
	toHexLE() {return swapHex(this.id.toString('hex'))}
	toBigInt() {return this.id.readBigUInt64LE()}
	toLong() {return Long.fromString(this.id.toString('hex'),16)}
	getMagic() {return this.id.readUInt8(1)}
	getDate() {
		let d=this.id.readUInt32LE(4)*10000;
		return new Date(d<1621543800000?0:d);
	}

	/** Async `crypto.randomBytes` with browser fallback */
	static randBytes = async (size: number) => (cRand ? cRand(size)
		: crypto.getRandomValues(Buffer.allocUnsafe(size))) as Promise<Buffer>;

	/** Generate new random UUID
	@param date Optional Date or Unix ms timestamp; default is current time
	@param magic User-defined 8-bit value that can be retrieved later; default is random
	*/
	static genUUID = async (date?: Date | number, magic?: number) => {
		let ts = (os ? os.uptime()*10 : performance.now()/100)&255;
		const ds = (date instanceof Date?
			date.getTime() : date||Date.now())/10000,
		rb = await UUID.randBytes(magic!=null?1:2),
		u = Buffer.allocUnsafe(8);

		if(Cnt == null) await loadId();
		const ct = Cnt;
		if(++Cnt > 255) Cnt=0;

		//Prevent collision
		if(LT === ts && LD === ds) {
			if(CLT === ct) {
				await utils.delay(50);
				LT = ts = (ts+1)&255;
			}
		} else LT=ts, LD=ds, CLT=ct;

		u.writeUInt8(ts);
		if(magic != null) {
			u.writeUInt8(magic&255, 1);
			u.writeUInt8(rb.readUInt8(), 2);
		} else u.writeUInt16LE(rb.readUInt16LE(), 1);
		u.writeUInt8(ct, 3);
		u.writeUInt32LE(ds, 4);

		if(fs && !UT) UT = setTimeout(() => {
			UT=false, fs.writeFile(ID_FN, Cnt.toString());
		}, UUID.ID_Delay);
		return new UUID(u);
	}
}
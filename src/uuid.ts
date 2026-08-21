//Chu ID v1.6, Pecacheu 2026. GNU GPL v3

import { Buffer } from 'buffer';
import utils from 'raiutils';

declare type os = typeof import('os');
declare type fs = typeof import('fs/promises');
interface Long {unsigned: boolean; toString(r: number): string}

const [os, fs] = await utils.importNode('os', 'fs/promises');

let Long: any;
try {Long = (await utils.importNode('mongodb'))[0].Long} catch(e) {}

const ID_FN = import.meta.dirname + '/uuid';
let Cnt: number, LD: number, LT: number, UT: NodeJS.Timeout | number;

//64-bit UUID Format
//<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>

const swapHex = (h: string) => h.match(/.{2}/g)!.reverse().join('');

async function loadId() {
	if(!fs) return Cnt = utils.rand(0, 255);
	//Prevent race condition
	if(UT === -1) {
		while(UT === -1) await utils.delay(10);
		return;
	}
	UT = -1;
	try {Cnt = Number(await fs.readFile(ID_FN, {encoding: 'utf8'}))} catch(e) {}
	if(!(Cnt >= 0 && Cnt < 256)) console.debug('[ChuID] IDCount error, resetting'), Cnt = 0;
	UT = 0;
}

const B0 = BigInt(0),
	B64 = BigInt('18446744073709551615'),
	DupIDs = new Set<string>();

export default class UUID {
	static readonly LEN = 11;
	static readonly BYTES = 8;
	/** Delay before writing ID file to disk */
	static ID_Delay = 10000;
	id: Buffer;

	constructor(id: string | Buffer | Uint8Array | bigint | Long) {
		// eslint-disable-next-line sty/brace-style, no-empty
		if(id instanceof Uint8Array && id.length === UUID.BYTES) {}
		else if(typeof id === 'string' && id.length === UUID.LEN) {
			if(utils.isNode) id = Buffer.from(id, 'base64');
			else id = Uint8Array.fromBase64(id, {alphabet: 'base64url'});
		} else if(typeof id === 'bigint' && id > B0 && id <= B64) {
			const n = id;
			(id = Buffer.allocUnsafe(8)).writeBigUInt64LE(n);
		} else if(Long && id instanceof Long) {
			(id as Long).unsigned = true;
			id = Buffer.from((id as Long).toString(16), 'hex');
		} else throw `Unknown UUID format ${id}`;
		this.id = id instanceof Buffer ? id : Buffer.from(id.buffer);
	}

	toString(f?: BufferEncoding) {
		if(utils.isNode || f) return this.id.toString(f || 'base64url');
		return this.id.toBase64({alphabet: 'base64url', omitPadding: true});
	}

	toHexLE() {return swapHex(this.id.toString('hex'))}
	toBigInt() {return this.id.readBigUInt64LE()}
	toLong() {return Long.fromString(this.id.toString('hex'), 16)}
	getMagic() {return this.id.readUInt8(1)}
	getDate() {
		const d = this.id.readUInt32LE(4) * 10000;
		return new Date(d < 1621543800000 ? 0 : d);
	}

	/** Generate new random UUID
	@param date Optional Date or Unix ms timestamp; default is current time
	@param magic User-defined 8-bit value that can be retrieved later; default is random
	*/
	static genUUID = async (date?: Date | number, magic?: number): Promise<UUID> => {
		if(Cnt == null) await loadId();
		const ct = Cnt, u = Buffer.allocUnsafe(8);
		u.writeUInt8(ct, 3);
		if(++Cnt > 255) Cnt = 0;

		let id, loop;
		while(true) {
			const ts = (os ? os.uptime() * 10 : performance.now() / 100) & 255,
				ds = Math.floor((date?.constructor === Date ? date.getTime() : date as number || Date.now()) / 10000),
				rb = crypto.getRandomValues(Buffer.allocUnsafe(magic != null ? 1 : 2));

			u.writeUInt8(ts);
			if(magic != null) {
				u.writeUInt8(magic & 255, 1);
				u.writeUInt8(rb.readUInt8(), 2);
			} else u.writeUInt16LE(rb.readUInt16LE(), 1);
			u.writeUInt32LE(ds, 4);
			id = new UUID(u);

			//Collision check
			if(ds === LD && ts === LT) {
				const s = id.toString();
				if(DupIDs.has(s)) loop ? await utils.delay(0) : loop = 1;
				else { DupIDs.add(s); break }
			} else {
				LD = ds, LT = ts;
				if(DupIDs.size) DupIDs.clear();
				break;
			}
		}

		if(fs) {
			if(UT) clearTimeout(UT);
			UT = setTimeout(() => {
				UT = 0;
				if(DupIDs.size) DupIDs.clear();
				fs.writeFile(ID_FN, Cnt.toString());
			}, UUID.ID_Delay);
		}
		return id;
	};
}
//Chu ID v1.5.1, Pecacheu 2026. GNU GPL v3

import os from 'os';
import fs from 'fs/promises';
import crypto from 'crypto';
import { promisify } from 'util';
import utils from 'raiutils';

const ID_FN = import.meta.dirname+'/uuid';
let Cnt: number, CLT: number, LT: number,
LD: number, UT: NodeJS.Timeout | boolean;

let mdb: any;
//@ts-ignore
try {mdb=await import('mongodb')} catch(e) {}

namespace mdb {export interface Long {
	unsigned: boolean; toString(r: number): string;
}}

//64-bit UUID Format
//<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>

function swapHex(h: string) {return h.match(/.{2}/g)!.reverse().join('')}

async function loadId() {
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

export default class UUID {
	static readonly LEN = 11;
	static readonly BYTES = 8;
	/** Delay before writing ID file to disk */
	static ID_Delay = 10000;
	id: Buffer;

	constructor(id: string | Buffer | mdb.Long) {
		if(id instanceof Buffer && id.length === UUID.BYTES) {}
		else if(typeof id === 'string' && id.length === UUID.LEN) id=Buffer.from(id,'base64');
		else if(mdb && id instanceof mdb.Long) {
			(id as mdb.Long).unsigned=true;
			id=Buffer.from((id as mdb.Long).toString(16),'hex');
		} else throw `Unknown UUID format ${id}`;
		this.id = id;
	}
	toString(f?: BufferEncoding) {return this.id.toString(f||'base64url')}
	toHexLE() {return swapHex(this.id.toString('hex'))}
	toLong() {return mdb.Long.fromString(this.id.toString('hex'),16)}
	getMagic() {return this.id.readUInt8(1)}
	getDate() {
		let d=this.id.readUInt32LE(4)*10000;
		return new Date(d<1621543800000?0:d);
	}

	/** Convenience method for async `crypto.randomBytes` */
	static randBytes = promisify(crypto.randomBytes);

	/** Generate new random UUID
	@param date Optional Date or Unix ms timestamp; default is current time
	@param magic User-defined 8-bit value that can be retrieved later; default is random
	*/
	static genUUID = async (date?: Date | number, magic?: number) => {
		let ts = (os.uptime()*10)&255;
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

		if(!UT) UT = setTimeout(() => {
			UT=false, fs.writeFile(ID_FN, Cnt.toString());
		}, UUID.ID_Delay);
		return new UUID(u);
	}
}
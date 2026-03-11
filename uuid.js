//Chu ID v1.5, Pecacheu 2026. GNU GPL v3

import os from 'os';
import fs from 'fs/promises';
import crypto from 'crypto';
import {promisify} from 'util';
import 'raiutils';

const ID_FN = import.meta.dirname+'/uuid';
let Cnt, CLT, LT, LD, UT;

let mdb;
try {mdb=await import('mongodb')} catch(e) {}

//64-bit UUID Format
//<U8 Uptime><U8 Magic><U8 CryptoRand><U8 Counter><U32 Date>

class UUID {
	constructor(id) {
		if(id instanceof Buffer && id.length === UUID.BYTES) {}
		else if(typeof id === 'string' && id.length === UUID.LEN) id=Buffer.from(id,'base64');
		else if(mdb && id instanceof mdb.Long) id.unsigned=true, id=Buffer.from(id.toString(16),'hex');
		else throw `Unknown UUID format ${id}`;
		this.id=id;
	}
	toString(f) {return this.id.toString(f||'base64url')}
	toHexLE() {return swapHex(this.id.toString('hex'))}
	toLong() {return mdb.Long.fromString(this.id.toString('hex'),16)}
	getMagic() {return this.id.readUInt8(1)}
	getDate() {
		let d=this.id.readUInt32LE(4)*10000;
		return new Date(d<1621543800000?0:d);
	}
}

UUID.LEN = 11;
UUID.BYTES = 8;
UUID.ID_Delay = 10000;

function swapHex(h) {return h.match(/.{2}/g).reverse().join('')}

async function loadId() {
	//Prevent race condition
	if(UT === true) {
		while(UT === true) await utils.delay(10);
		return;
	}
	UT=true;
	try {Cnt = Number(await fs.readFile(ID_FN, {encoding:'utf8'}))} catch(e) {}
	if(!(Cnt >= 0 && Cnt <= 255)) console.error("[ChuID] IDCount error, resetting"), Cnt=0;
	UT=0;
}

UUID.randBytes = promisify(crypto.randomBytes);

UUID.genUUID = async (dateMs, magic) => {
	const ts = (os.uptime()*10)&255,
	ds = (dateMs || Date.now())/10000,
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
	u.writeUInt32LE(ds);

	if(!UT) UT = setTimeout(() => {
		UT=0, fs.writeFile(ID_FN, Cnt.toString());
	}, UUID.ID_Delay);
	return new UUID(u);
}

export default UUID;
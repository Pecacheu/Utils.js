//Chu ID v1.3, Pecacheu 2025. GNU GPL v3

import os from 'os';
import fs from 'fs/promises';
import crypto from 'crypto';
import {promisify} from 'util';
import 'utils.js';

const ID_FN = 'uuid', ID_DELAY = 10000;
let IDCount, UT;

let mdb;
try {mdb=await import('mongodb')} catch(e) {}

//64-bit UUID Format
//<U8 CPUUptime><U16 CryptoRand><U8 Counter><U32 Date>

class UUID {
	constructor(id) {
		if(id instanceof Buffer) {}
		else if(typeof id=='string' && id.length==UUID.LEN) id=Buffer.from(id,'base64');
		else if(mdb && id instanceof mdb.Long) id.unsigned=true, id=Buffer.from(id.toString(16),'hex');
		else throw `Unknown UUID format ${id}`;
		this.id=id;
	}
	toString(f) {return this.id.toString(f||'base64url')}
	toHexLE() {return swapHex(this.id.toString('hex'))}
	toLong() {return mdb.Long.fromString(this.id.toString('hex'),16)}
	getDate() {
		let d=this.id.readUInt32LE(4)*10000;
		return new Date(d<1621543800000?0:d);
	}
}

UUID.LEN = 11;

function swapHex(h) {return h.match(/.{2}/g).reverse().join('')}

async function loadId() {
	try {IDCount = Number(await fs.readFile(ID_FN, {encoding:'utf8'}))} catch(e) {}
	if(!(IDCount>=0 && IDCount<=255)) {
		console.error("IDCount Error, resetting");
		IDCount=0; await fs.writeFile(ID_FN, IDCount.toString());
	}
}

UUID.randBytes = promisify(crypto.randomBytes);

UUID.genUUID = async () => {
	if(IDCount==null) await loadId();
	let rb=await UUID.randBytes(2);
	const u=Buffer.allocUnsafe(8);
	u.writeUInt8(os.uptime()&255);
	u.writeUInt16LE(rb.readUInt16LE(),1);
	u.writeUInt8(IDCount,3);
	u.writeUInt32LE(Date.now()/10000,4);
	if(++IDCount > 255) IDCount=0;
	if(UT) clearTimeout(UT);
	UT = setTimeout(() => {
		UT=0; fs.writeFile(ID_FN, IDCount.toString());
	}, ID_DELAY);
	return new UUID(u);
}

export default UUID;
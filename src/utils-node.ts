//https://github.com/Pecacheu/Utils.js; GNU GPL v3

import os from 'os';
import { utils as U } from './utils.js';
export type * from './utils.js';

namespace ext {
/** Get list of system IPs */
export function getIPs() {
	const ip: string[]=[], fl=os.networkInterfaces();
	for(let k in fl) fl[k]!.forEach(f => {
		if(!f.internal && f.family == 'IPv4' && f.mac != '00:00:00:00:00:00' && f.address) ip.push(f.address);
	});
	return ip;
}

/** Get system info
@returns [sysOS, arch, cpuInfo] */
export function getOS() {
	let sysOS, arch;
	switch(os.platform()) {
		case 'win32': sysOS="Windows"; break;
		case 'darwin': sysOS="MacOS"; break;
		case 'linux': sysOS="Linux"; break;
		default: sysOS=os.platform();
	}
	switch(os.arch()) {
		case 'ia32': arch="32-bit"; break;
		case 'x64': arch="64-bit"; break;
		case 'arm': arch="ARM"; break;
		default: arch=os.arch();
	}
	return [sysOS, arch, os.cpus()[0]?.model||''];
}
}

export const utils = <typeof U & typeof ext>U;
export default utils;
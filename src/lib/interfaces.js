'use strict';

const os = require('os');
const { isWindows } = require('./platform');
const { runCommand } = require('./run-command');

/**
 * Get local network interfaces.
 * @returns {Array<{name: string, family: number|string, address: string, netmask: string, mac: string, internal: boolean}>}
 */
function getLocalInterfaces() {
  const nis = os.networkInterfaces();
  const rows = [];
  for (const [name, infos] of Object.entries(nis)) {
    if (!Array.isArray(infos)) continue;
    for (const info of infos) {
      if (!info || !info.address) continue;
      rows.push({
        name,
        family: info.family,
        address: info.address,
        netmask: info.netmask || '',
        mac: info.mac || '',
        internal: Boolean(info.internal)
      });
    }
  }
  return rows;
}

/**
 * Get system network configuration info (ipconfig / ifconfig / ip).
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=12000]
 * @returns {Promise<{command: string, ok: boolean, stdout: string, stderr: string}>}
 */
async function systemNetInfo({ timeoutMs = 12000 } = {}) {
  if (isWindows()) {
    const ipconfig = await runCommand('ipconfig', ['/all'], { timeoutMs });
    return {
      command: ipconfig.cmd,
      ok: ipconfig.ok,
      stdout: ipconfig.stdout,
      stderr: ipconfig.stderr
    };
  }
  const ifconfig = await runCommand('ifconfig', [], { timeoutMs });
  if (ifconfig.ok) {
    return { command: ifconfig.cmd, ok: true, stdout: ifconfig.stdout, stderr: ifconfig.stderr };
  }
  const ip = await runCommand('ip', ['a'], { timeoutMs });
  return { command: ip.cmd, ok: ip.ok, stdout: ip.stdout, stderr: ip.stderr };
}

module.exports = { getLocalInterfaces, systemNetInfo };

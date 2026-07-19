'use strict';

const { normalizeHost } = require('./normalize');
const { isWindows } = require('./platform');
const { runCommand } = require('./run-command');

/**
 * Ping a host.
 * @param {string} target
 * @param {Object} [options]
 * @param {number} [options.count=4]
 * @param {number} [options.timeoutMs=15000]
 * @returns {Promise<{ok: boolean, code: number|null, stdout: string, stderr: string, cmd: string}>}
 */
async function ping(target, { count = 4, timeoutMs = 15000 } = {}) {
  const host = normalizeHost(target);
  const n = Math.max(1, Math.min(10, Number(count) || 4));
  if (isWindows()) {
    return runCommand('ping', ['-n', String(n), host], { timeoutMs });
  }
  return runCommand('ping', ['-c', String(n), host], { timeoutMs });
}

/**
 * Run traceroute / tracert to a host.
 * @param {string} target
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=30000]
 * @returns {Promise<{ok: boolean, code: number|null, stdout: string, stderr: string, cmd: string}>}
 */
async function traceroute(target, { timeoutMs = 30000 } = {}) {
  const host = normalizeHost(target);
  if (isWindows()) {
    return runCommand('tracert', [host], { timeoutMs });
  }
  return runCommand('traceroute', [host], { timeoutMs });
}

module.exports = { ping, traceroute };

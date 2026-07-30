'use strict';

const net = require('net');
const { normalizeHost, normalizePort } = require('./normalize');
const { debugLog } = require('./debug');

/**
 * Check if a TCP port is open on a host.
 * @param {string} hostInput
 * @param {number|string} portInput
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=2500]
 * @returns {Promise<{host: string, port: number, ok: boolean, ms: number, error: string}>}
 */
async function tcpCheck(hostInput, portInput, { timeoutMs = 2500 } = {}) {
  const host = normalizeHost(hostInput);
  const port = normalizePort(portInput);

  const start = Date.now();
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;

    const finish = (ok, error) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch (e) {
        debugLog(`tcpCheck: socket.destroy() error for ${host}:${port}: ${e.message || e}`);
      }
      resolve({
        host,
        port,
        ok,
        ms: Date.now() - start,
        error: error ? String(error) : ''
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, '超时'));
    socket.once('error', e => finish(false, e && e.code ? e.code : e.message || '错误'));
    socket.connect(port, host);
  });
}

/**
 * Check multiple TCP ports with concurrency control.
 * @param {string} hostInput
 * @param {Array<number|string>} ports
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=2500]
 * @param {number} [options.concurrency=50]
 * @returns {Promise<Array<{host: string, port: number, ok: boolean, ms: number, error: string}>>}
 */
async function tcpBatchCheck(hostInput, ports, { timeoutMs = 2500, concurrency = 50 } = {}) {
  const host = normalizeHost(hostInput);
  const list = Array.from(new Set(ports.map(normalizePort))).sort((a, b) => a - b);
  const limit = Math.max(1, Math.min(200, Number(concurrency) || 50));

  const out = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (idx < list.length) {
      const p = list[idx++];
      out.push(await tcpCheck(host, p, { timeoutMs }));
    }
  });
  await Promise.all(workers);
  out.sort((a, b) => a.port - b.port);
  return out;
}

module.exports = { tcpCheck, tcpBatchCheck };

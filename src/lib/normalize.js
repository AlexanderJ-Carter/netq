'use strict';

/**
 * Normalize and validate a host string.
 * @param {string|*} input
 * @returns {string}
 */
function normalizeHost(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('目标不能为空');
  if (s.length > 253) throw new Error('主机名过长（最多 253 个字符）');
  const ipv6Pattern = /^\[[a-fA-F0-9:]+\]$/;
  if (ipv6Pattern.test(s)) return s;
  if (!/^[a-zA-Z0-9.-]+$/.test(s)) {
    throw new Error('主机名包含无效字符（仅允许字母、数字、连字符和点）');
  }
  return s;
}

/**
 * Normalize and validate a port number.
 * @param {number|string|*} input
 * @returns {number}
 */
function normalizePort(input) {
  const n = Number(String(input).trim());
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw new Error('端口必须是 1-65535 的整数');
  return n;
}

/**
 * Normalize and validate an HTTP(S) URL.
 * @param {string|*} input
 * @returns {URL}
 */
function normalizeUrl(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('URL 不能为空');
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('仅支持 http/https');
    return u;
  } catch (e) {
    if (e.message === '仅支持 http/https') throw e;
    throw new Error('URL 格式不正确（例：https://example.com/path）');
  }
}

/**
 * Parse a port list string into port numbers.
 * Supports: "80", "80,443", "3000-3010", "80,443,3000-3010"
 * @param {string} input
 * @returns {number[]}
 */
function parsePorts(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('端口列表不能为空');
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean);
  const ports = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const [aRaw, bRaw] = part.split('-').map((x) => x.trim());
      const a = normalizePort(aRaw);
      const b = normalizePort(bRaw);
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      const span = to - from + 1;
      if (span > 2000) throw new Error('端口范围过大（最多 2000 个）');
      for (let p = from; p <= to; p++) ports.push(p);
    } else {
      ports.push(normalizePort(part));
    }
  }
  return ports;
}

/**
 * Split a host:port string into components.
 * @param {string} s
 * @returns {{host: string, port: number}}
 */
function splitHostPort(s) {
  const v = String(s || '').trim();
  const m6 = v.match(/^\[(.+)\]:(\d+)$/);
  if (m6) return { host: m6[1], port: Number(m6[2]) };
  const idx = v.lastIndexOf(':');
  if (idx <= 0) return { host: v, port: 0 };
  const host = v.slice(0, idx);
  const port = Number(v.slice(idx + 1));
  return { host, port: Number.isFinite(port) ? port : 0 };
}

/**
 * Wrap a promise with a timeout.
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} [timeoutMessage]
 * @returns {Promise}
 */
function withTimeout(promise, ms, timeoutMessage) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(timeoutMessage || `超时（${ms}ms）`)), ms);
    if (typeof t.unref === 'function') t.unref();
  });
  return Promise.race([promise.finally(() => clearTimeout(t)), timeout]);
}

module.exports = {
  normalizeHost,
  normalizePort,
  normalizeUrl,
  parsePorts,
  splitHostPort,
  withTimeout
};

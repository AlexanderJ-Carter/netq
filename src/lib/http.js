'use strict';

const dns = require('dns').promises;
const https = require('https');
const http = require('http');
const { normalizeUrl } = require('./normalize');
const { debugLog } = require('./debug');

/**
 * Check HTTP(S) URL accessibility.
 * @param {string} urlInput
 * @param {Object} [options]
 * @param {string} [options.method='HEAD']
 * @param {number} [options.timeoutMs=6000]
 * @param {number} [options.followRedirects=3]
 * @returns {Promise<Object>}
 */
async function httpCheck(urlInput, { method = 'HEAD', timeoutMs = 6000, followRedirects = 3 } = {}) {
  const url = normalizeUrl(urlInput);
  const m = String(method || 'HEAD').toUpperCase();
  const allowed = new Set(['HEAD', 'GET']);
  if (!allowed.has(m)) throw new Error('HTTP 方法仅支持 HEAD/GET');

  const resolved = [];
  try {
    const host = url.hostname;
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    for (const a of addrs) resolved.push({ address: a.address, family: a.family });
  } catch (e) {
    debugLog(`httpCheck: DNS resolution failed for ${url.hostname}: ${e.message}`);
  }

  const doOne = (u) =>
    new Promise((resolve, reject) => {
      const lib = u.protocol === 'https:' ? https : http;
      const start = Date.now();
      let remoteAddress = '';
      const req = lib.request(
        u,
        {
          method: m,
          headers: {
            'user-agent': 'netq/1.0',
            accept: '*/*'
          }
        },
        (res) => {
          res.resume();
          remoteAddress = res.socket && res.socket.remoteAddress ? String(res.socket.remoteAddress) : remoteAddress;
          resolve({
            url: u.toString(),
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            location: res.headers.location ? String(res.headers.location) : '',
            ms: Date.now() - start,
            ip: remoteAddress
          });
        }
      );
      req.on('error', (e) => reject(e));
      req.on('socket', (s) => {
        if (!s) return;
        s.on('connect', () => {
          if (s.remoteAddress) remoteAddress = String(s.remoteAddress);
        });
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error('超时')));
      req.end();
    });

  let current = url;
  const chain = [];
  for (let i = 0; i <= followRedirects; i++) {
    // eslint-disable-next-line no-await-in-loop
    const r = await doOne(current);
    chain.push(r);
    const isRedirect = r.status >= 300 && r.status < 400 && r.location;
    if (!isRedirect) return { ...r, ok: r.status > 0 && r.status < 500, resolved, chain };
    if (i === followRedirects) return { ...r, ok: false, error: '重定向过多', resolved, chain };
    try {
      current = new URL(r.location, current);
    } catch {
      return { ...r, ok: false, error: '重定向 URL 无效', resolved, chain };
    }
  }
  return {
    url: url.toString(),
    ok: false,
    status: 0,
    statusText: '',
    location: '',
    ms: 0,
    error: '未知错误',
    resolved,
    chain
  };
}

module.exports = { httpCheck };

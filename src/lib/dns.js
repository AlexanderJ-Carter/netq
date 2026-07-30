'use strict';

const dns = require('dns').promises;
const { normalizeHost } = require('./normalize');

const dnsCache = new Map();
const DNS_CACHE_TTL = 60000;

/**
 * Cached dns.lookup.
 * @param {string} host
 * @param {Object} options
 * @returns {Promise<Array>}
 */
async function cachedDnsLookup(host, options) {
  const cacheKey = `${host}:${JSON.stringify(options)}`;
  const cached = dnsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
    return cached.result;
  }

  const result = await dns.lookup(host, options);
  dnsCache.set(cacheKey, { result, timestamp: Date.now() });

  if (dnsCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of dnsCache.entries()) {
      if (now - value.timestamp > DNS_CACHE_TTL) {
        dnsCache.delete(key);
      }
    }
  }

  return result;
}

/**
 * Perform DNS lookup for a host (with caching).
 * @param {string} target
 * @param {Object} [options]
 * @param {number} [options.family=0]
 * @returns {Promise<Array<{address: string, family: number}>>}
 */
async function dnsLookup(target, { family = 0 } = {}) {
  const host = normalizeHost(target);
  const res = await cachedDnsLookup(host, { all: true, family, verbatim: true });
  return res.map(r => ({ address: r.address, family: r.family }));
}

/**
 * Resolve DNS records for a host.
 * @param {string} target
 * @param {string} [rrtype='A']
 * @returns {Promise<Array>}
 */
async function dnsResolve(target, rrtype = 'A') {
  const host = normalizeHost(target);
  const type = String(rrtype || '').toUpperCase();
  const allowed = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV']);
  if (!allowed.has(type)) throw new Error(`不支持的记录类型：${type}`);
  return dns.resolve(host, type);
}

module.exports = { dnsLookup, dnsResolve, cachedDnsLookup };

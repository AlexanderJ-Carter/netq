'use strict';

const dns = require('dns').promises;
const { normalizeHost } = require('./normalize');

const DEFAULT_RESOLVERS = [
  { name: 'system', servers: null },
  { name: 'cloudflare', servers: ['1.1.1.1', '1.0.0.1'] },
  { name: 'google', servers: ['8.8.8.8', '8.8.4.4'] }
];

/**
 * Normalize resolve results into sorted unique address strings.
 * @param {unknown} records
 * @param {string} type
 * @returns {string[]}
 */
function normalizeRecords(records, type) {
  const t = String(type || 'A').toUpperCase();
  const list = Array.isArray(records) ? records : [];
  const out = [];

  for (const item of list) {
    if (typeof item === 'string') {
      out.push(item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    if (t === 'MX' && item.exchange) out.push(`${item.priority} ${item.exchange}`);
    else if (t === 'SRV' && item.name) out.push(`${item.priority} ${item.port} ${item.name}`);
    else if (t === 'SOA' && item.nsname) out.push(String(item.nsname));
    else if (item.address) out.push(String(item.address));
    else out.push(JSON.stringify(item));
  }

  return [...new Set(out)].sort();
}

/**
 * Resolve via system defaults or an explicit resolver list.
 * @param {string} host
 * @param {string} type
 * @param {string[]|null} servers
 * @returns {Promise<string[]>}
 */
async function resolveAddresses(host, type, servers) {
  const rrtype = String(type || 'A').toUpperCase();
  if (!servers) {
    return normalizeRecords(await dns.resolve(host, rrtype), rrtype);
  }
  const resolver = new dns.Resolver();
  resolver.setServers(servers);
  return normalizeRecords(await resolver.resolve(host, rrtype), rrtype);
}

/**
 * Compare DNS answers across system and public resolvers.
 * @param {string} hostInput
 * @param {Object} [options]
 * @param {string} [options.type='A']
 * @param {Array<{name: string, servers: string[]|null}>} [options.resolvers]
 * @returns {Promise<Object>}
 */
async function dnsCompare(hostInput, { type = 'A', resolvers = DEFAULT_RESOLVERS } = {}) {
  const host = normalizeHost(hostInput);
  const rrtype = String(type || 'A').toUpperCase();
  const allowed = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV']);
  if (!allowed.has(rrtype)) throw new Error(`不支持的记录类型：${rrtype}`);

  const sources = [];
  for (const r of resolvers) {
    try {
      const addresses = await resolveAddresses(host, rrtype, r.servers);
      sources.push({ name: r.name, servers: r.servers, ok: true, addresses });
    } catch (e) {
      sources.push({
        name: r.name,
        servers: r.servers,
        ok: false,
        addresses: [],
        error: e.message
      });
    }
  }

  const successful = sources.filter(s => s.ok);
  const fingerprints = successful.map(s => s.addresses.join('|'));
  const consistent = successful.length >= 2 && fingerprints.every(fp => fp === fingerprints[0]);
  const system = sources.find(s => s.name === 'system');
  const ok = Boolean(system && system.ok);

  return {
    ok,
    host,
    type: rrtype,
    sources,
    consistent,
    mismatch: ok && successful.length >= 2 ? !consistent : false
  };
}

module.exports = {
  dnsCompare,
  normalizeRecords,
  resolveAddresses,
  DEFAULT_RESOLVERS
};

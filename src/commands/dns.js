'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('./_ora');
const { printJson } = require('./_output');

const RR_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV'];

/**
 * Format DNS resolve values for display.
 * @param {*} value
 * @returns {string}
 */
function formatRecords(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .join('\n');
  }
  return String(value);
}

/**
 * Run DNS query.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {string} [options.type] - A|AAAA|...|all (default: all for lookup+A+AAAA)
 * @returns {Promise<{ok: boolean, host?: string, data?: Object, error?: string}>}
 */
async function runDns(host, { jsonMode = false, quiet = false, type } = {}) {
  const spinner = !jsonMode && !quiet ? ora(`DNS 查询: ${host}...`).start() : null;
  const rrtype = type ? String(type).toUpperCase() : 'ALL';

  try {
    if (rrtype !== 'ALL' && !RR_TYPES.includes(rrtype)) {
      throw new Error(`不支持的记录类型：${rrtype}（可用: all, ${RR_TYPES.join(', ')}）`);
    }

    let data;
    if (rrtype === 'ALL') {
      const [lookup, a, aaaa] = await Promise.all([
        lib.dnsLookup(host),
        lib.dnsResolve(host, 'A').catch(() => []),
        lib.dnsResolve(host, 'AAAA').catch(() => [])
      ]);
      data = { host, lookup, a, aaaa };
    } else {
      const records = await lib.dnsResolve(host, rrtype);
      data = { host, type: rrtype, records };
    }

    if (jsonMode) {
      printJson('dns', true, data);
    } else if (!quiet) {
      if (spinner) spinner.succeed();
      console.log(ui.title(`DNS: ${host}`));
      if (rrtype === 'ALL') {
        console.log(
          ui.kvTable([
            ['lookup', data.lookup.map((r) => `${r.address} (IPv${r.family})`).join('\n') || '无'],
            ['A', data.a.join('\n') || '无'],
            ['AAAA', data.aaaa.join('\n') || '无']
          ])
        );
      } else {
        console.log(ui.kvTable([[rrtype, formatRecords(data.records) || '无']]));
      }
    } else if (rrtype === 'ALL') {
      console.log(data.lookup.map((r) => r.address).join('\n'));
    } else {
      console.log(formatRecords(data.records));
    }

    return { ok: true, ...data };
  } catch (e) {
    if (jsonMode) printJson('dns', false, { host, error: e.message });
    else if (!quiet && spinner) spinner.fail(`DNS 查询失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, error: e.message };
  }
}

module.exports = { runDns, RR_TYPES };

'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');

/**
 * @typedef {Object} DnsResult
 * @property {boolean} ok - Whether the operation succeeded
 * @property {string} host - The queried host
 * @property {Array<{address: string, family: number}>} [lookup] - DNS lookup results
 * @property {string[]} [a] - A record results
 * @property {string[]} [aaaa] - AAAA record results
 * @property {string} [error] - Error message (on failure)
 */

/**
 * Print JSON output
 * @param {string} command - Command name
 * @param {Object} payload - Payload object
 */
function printJson(command, payload) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ command, timestamp: new Date().toISOString(), ...payload }, null, 2));
}

/**
 * Run the DNS query command
 * @param {string} host - Host to query
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<DnsResult>} Command result
 */
async function runDns(host, { jsonMode, quiet = false }) {
  const spinner = !jsonMode && !quiet ? ora(`DNS 查询: ${host}...`).start() : null;

  try {
    const [lookup, a, aaaa] = await Promise.all([
      core.dnsLookup(host),
      core.dnsResolve(host, 'A').catch(() => []),
      core.dnsResolve(host, 'AAAA').catch(() => [])
    ]);

    if (jsonMode) {
      printJson('dns', { ok: true, host, lookup, a, aaaa });
    } else if (!quiet) {
      if (spinner) spinner.succeed();
      console.log(ui.title(`DNS: ${host}`));
      const rows = [
        ['lookup', lookup.map(r => `${r.address} (IPv${r.family})`).join('\n') || '无'],
        ['A', a.join('\n') || '无'],
        ['AAAA', aaaa.join('\n') || '无']
      ];
      console.log(ui.kvTable(rows));
    } else {
      console.log(lookup.map(r => r.address).join('\n'));
    }
    return { ok: true, host, lookup, a, aaaa };
  } catch (e) {
    if (jsonMode) {
      printJson('dns', { ok: false, host, error: e.message });
    } else if (!quiet) {
      if (spinner) spinner.fail(`DNS 查询失败: ${e.message}`);
    } else {
      console.error(e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

module.exports = { runDns, printJson };

'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('./_ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Compare DNS answers across resolvers.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {string} [options.type]
 * @returns {Promise<Object>}
 */
async function runDnsCompare(host, { jsonMode = false, quiet = false, type = 'A' } = {}) {
  const spinner = !jsonMode && !quiet ? ora(`DNS 对比: ${host} (${type})...`).start() : null;

  try {
    storage.rememberHost(host);
    const result = await lib.dnsCompare(host, { type });

    if (jsonMode) {
      printJson('dns-compare', result.ok, result);
    } else if (quiet) {
      console.log(`${result.ok ? 'ok' : 'failed'}\t${result.consistent ? 'consistent' : 'mismatch'}`);
    } else {
      if (spinner) {
        if (!result.ok) spinner.fail('系统 DNS 解析失败');
        else if (result.consistent) spinner.succeed('DNS 各解析器结果一致');
        else spinner.warn('DNS 各解析器结果不一致');
      }
      console.log(ui.title(`DNS 对比: ${host} (${result.type})`));
      const rows = result.sources.map((s) => [
        s.name,
        s.ok ? ui.ok('ok') : ui.err('fail'),
        s.ok ? (s.addresses.join(', ') || '-') : s.error || '-'
      ]);
      console.log(ui.listTable(['解析器', '状态', '结果'], rows));
      console.log(
        result.consistent
          ? ui.ok('结论: 一致')
          : ui.warn('结论: 不一致（可能污染、分流或 CDN 差异）')
      );
    }

    return result;
  } catch (e) {
    if (jsonMode) printJson('dns-compare', false, { host, type, error: e.message });
    else if (!quiet && spinner) spinner.fail(`DNS 对比失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, type, error: e.message };
  }
}

module.exports = { runDnsCompare };

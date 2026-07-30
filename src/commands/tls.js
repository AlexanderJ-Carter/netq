'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('./_ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Run TLS certificate inspection.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number|string} [options.port]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>}
 */
async function runTls(host, { jsonMode = false, quiet = false, port = 443, timeoutMs } = {}) {
  const cfg = storage.readConfigSync();
  const ms = timeoutMs ?? cfg.defaults.httpTimeoutMs ?? 6000;
  const spinner = !jsonMode && !quiet ? ora(`TLS 检测: ${host}:${port}...`).start() : null;

  try {
    storage.rememberHost(host);
    const result = await lib.tlsCheck(host, { port, timeoutMs: ms });

    if (jsonMode) {
      printJson('tls', result.ok, result);
    } else if (quiet) {
      console.log(
        result.ok
          ? `ok\t${result.daysRemaining}\t${result.subject}`
          : `failed\t${result.error || 'error'}`
      );
    } else {
      if (spinner) {
        if (result.ok) spinner.succeed(`TLS: ${result.protocol} · 剩余 ${result.daysRemaining} 天`);
        else spinner.fail(`TLS: ${result.error || '失败'}`);
      }
      console.log(ui.title(`TLS: ${host}:${result.port || port}`));
      console.log(
        ui.kvTable([
          ['主机', `${result.host}:${result.port}`],
          ['状态', result.ok ? ui.ok('通过') : ui.err(result.error || '失败')],
          ['协议', result.protocol || '-'],
          ['套件', result.cipher || '-'],
          ['主体', result.subject || '-'],
          ['颁发者', result.issuer || '-'],
          ['生效', result.validFrom || '-'],
          ['过期', result.validTo || '-'],
          ['剩余天数', result.daysRemaining === null || result.daysRemaining === undefined ? '-' : String(result.daysRemaining)],
          ['SAN', (result.san && result.san.length ? result.san.join(', ') : '-')],
          ['指纹', result.fingerprint256 || '-'],
          ['耗时', `${result.ms}ms`]
        ])
      );
    }

    return result;
  } catch (e) {
    if (jsonMode) printJson('tls', false, { host, port, error: e.message });
    else if (!quiet && spinner) spinner.fail(`TLS 检测失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, port, error: e.message };
  }
}

module.exports = { runTls };

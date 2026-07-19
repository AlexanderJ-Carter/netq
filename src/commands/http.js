'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Run HTTP(S) check.
 * @param {string} url
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {string} [options.method]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>}
 */
async function runHttp(url, { jsonMode = false, quiet = false, method = 'HEAD', timeoutMs } = {}) {
  const cfg = storage.readConfigSync();
  const ms = timeoutMs ?? cfg.defaults.httpTimeoutMs ?? 6000;
  const spinner = !jsonMode && !quiet ? ora(`HTTP 检测: ${url}...`).start() : null;

  try {
    const result = await lib.httpCheck(url, { method, timeoutMs: ms });
    if (jsonMode) {
      printJson('http', result.ok, result);
    } else if (!quiet) {
      if (result.ok) {
        if (spinner) spinner.succeed(`${result.url} [${result.status}] (${result.ms}ms)`);
      } else if (spinner) {
        spinner.fail(`${result.url}: ${result.error || `状态码 ${result.status}`}`);
      }
      if (result.chain && result.chain.length > 1) {
        console.log(ui.dim('\n重定向链:'));
        for (const c of result.chain) {
          console.log(ui.dim(`  → ${c.url} [${c.status}]`));
        }
      }
    } else {
      console.log(result.ok ? result.status : `error: ${result.error || result.status}`);
    }
    return result;
  } catch (e) {
    if (jsonMode) printJson('http', false, { url, error: e.message });
    else if (!quiet && spinner) spinner.fail(`HTTP 检测失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, url, error: e.message };
  }
}

module.exports = { runHttp };

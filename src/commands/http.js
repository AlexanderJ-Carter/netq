'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./dns');

/**
 * @typedef {Object} HttpCheckResult
 * @property {string} url - The checked URL
 * @property {number} status - HTTP status code
 * @property {string} statusText - HTTP status text
 * @property {number} ms - Response time in milliseconds
 * @property {boolean} ok - Whether the check succeeded
 * @property {string} [error] - Error message (if failed)
 * @property {string} [ip] - Remote IP address
 * @property {string} [location] - Redirect location
 */

/**
 * Run the HTTP check command
 * @param {string} url - URL to check
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<HttpCheckResult>} Command result
 */
async function runHttp(url, { jsonMode, quiet = false }) {
  const spinner = !jsonMode && !quiet ? ora(`HTTP 检测: ${url}...`).start() : null;

  try {
    const result = await core.httpCheck(url);
    if (jsonMode) {
      printJson('http', result);
      if (!result.ok) process.exitCode = 1;
    } else if (!quiet) {
      if (result.ok) {
        if (spinner) spinner.succeed(`${result.url} [${result.status}] (${result.ms}ms)`);
      } else {
        if (spinner) spinner.fail(`${result.url}: ${result.error || `状态码 ${result.status}`}`);
      }
      if (result.chain.length > 1) {
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
    if (jsonMode) printJson('http', { ok: false, url, error: e.message });
    else if (!quiet) {
      if (spinner) spinner.fail(`HTTP 检测失败: ${e.message}`);
    } else {
      console.error(e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

module.exports = { runHttp };

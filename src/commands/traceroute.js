'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./_output');

/**
 * Run traceroute command.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>}
 */
async function runTraceroute(host, { jsonMode = false, quiet = false, timeoutMs } = {}) {
  const spinner = !jsonMode && !quiet ? ora(`Traceroute: ${host}...`).start() : null;

  try {
    const result = await lib.traceroute(host, timeoutMs ? { timeoutMs } : {});
    const data = {
      host,
      ok: result.ok,
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
      cmd: result.cmd
    };

    if (jsonMode) {
      printJson('traceroute', result.ok, data);
    } else if (!quiet) {
      if (spinner) {
        if (result.ok) spinner.succeed(`Traceroute: ${host} 完成`);
        else spinner.fail(`Traceroute: ${host} 失败（${result.stderr || '见输出'}）`);
      }
      console.log(ui.title(`Traceroute: ${host}`));
      console.log(result.stdout || result.stderr || '');
    } else {
      console.log(result.ok ? 'ok' : 'failed');
    }

    return data;
  } catch (e) {
    if (jsonMode) printJson('traceroute', false, { host, error: e.message });
    else if (!quiet && spinner) spinner.fail(`Traceroute 失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, error: e.message };
  }
}

module.exports = { runTraceroute };

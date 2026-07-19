'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('./_ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Run ping command.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number} [options.count]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>}
 */
async function runPing(host, { jsonMode = false, quiet = false, count, timeoutMs } = {}) {
  const cfg = storage.readConfigSync();
  const n = count ?? cfg.defaults.pingCount ?? 4;
  const spinner = !jsonMode && !quiet ? ora(`Ping: ${host}...`).start() : null;

  try {
    const result = await lib.ping(host, { count: n, timeoutMs });
    const data = {
      host,
      count: n,
      ok: result.ok,
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
      cmd: result.cmd
    };

    if (jsonMode) {
      printJson('ping', result.ok, data);
    } else if (!quiet) {
      if (spinner) {
        if (result.ok) spinner.succeed(`Ping: ${host} 连通`);
        else spinner.fail(`Ping: ${host} 失败`);
      }
      console.log(ui.title(`Ping: ${host}`));
      console.log(result.stdout || result.stderr || '');
    } else {
      console.log(result.ok ? 'ok' : 'failed');
    }

    return data;
  } catch (e) {
    if (jsonMode) printJson('ping', false, { host, error: e.message });
    else if (!quiet && spinner) spinner.fail(`Ping 失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, error: e.message };
  }
}

module.exports = { runPing };

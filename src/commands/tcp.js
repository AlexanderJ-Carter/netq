'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./dns');

/**
 * @typedef {Object} TcpCheckResult
 * @property {string} host - Target host
 * @property {number} port - Target port
 * @property {boolean} ok - Whether the port is open
 * @property {number} ms - Connection time in milliseconds
 * @property {string} [error] - Error message (if failed)
 */

/**
 * Run the TCP check command
 * @param {string} host - Target host
 * @param {number} port - Target port
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<TcpCheckResult>} Command result
 */
async function runTcp(host, port, { jsonMode, quiet = false }) {
  const spinner = !jsonMode && !quiet ? ora(`TCP 检测: ${host}:${port}...`).start() : null;

  try {
    const result = await core.tcpCheck(host, port);
    if (jsonMode) {
      printJson('tcp', result);
      if (!result.ok) process.exitCode = 1;
    } else if (!quiet) {
      if (result.ok) {
        if (spinner) spinner.succeed(`${host}:${port} 开放 (${result.ms}ms)`);
      } else {
        if (spinner) spinner.fail(`${host}:${port} ${result.error || '关闭'}`);
      }
    } else {
      console.log(result.ok ? 'open' : 'closed');
    }
    return result;
  } catch (e) {
    if (jsonMode) printJson('tcp', { ok: false, host, port, error: e.message });
    else if (!quiet) {
      if (spinner) spinner.fail(`TCP 检测失败: ${e.message}`);
    } else {
      console.error(e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

module.exports = { runTcp };

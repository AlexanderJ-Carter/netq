'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');

/**
 * @typedef {Object} PublicIpResult
 * @property {boolean} ok - Whether the operation succeeded
 * @property {string} [ip] - The public IP address (on success)
 * @property {string} [error] - Error message (on failure)
 */

/**
 * Run the public IP command
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<PublicIpResult>} Command result
 */
async function runPublicIp({ jsonMode, quiet = false }) {
  const spinner = !jsonMode && !quiet ? ora('获取公网 IP...').start() : null;

  try {
    const ip = await core.fetchPublicIp();
    if (jsonMode) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ command: 'public-ip', timestamp: new Date().toISOString(), ok: true, ip }, null, 2));
    } else if (!quiet) {
      if (spinner) spinner.succeed(`公网 IP: ${ip}`);
    } else {
      console.log(ip);
    }
    return { ok: true, ip };
  } catch (e) {
    if (jsonMode) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ command: 'public-ip', timestamp: new Date().toISOString(), ok: false, error: e.message }, null, 2));
    } else if (!quiet) {
      if (spinner) spinner.fail(`获取公网 IP 失败: ${e.message}`);
    } else {
      console.error(e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

module.exports = { runPublicIp };

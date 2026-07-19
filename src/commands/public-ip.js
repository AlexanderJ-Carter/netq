'use strict';

const lib = require('../lib');
const ora = require('./_ora');
const { printJson } = require('./_output');

/**
 * Run the public IP command.
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ok: boolean, ip?: string, error?: string}>}
 */
async function runPublicIp({ jsonMode = false, quiet = false, timeoutMs } = {}) {
  const spinner = !jsonMode && !quiet ? ora('获取公网 IP...').start() : null;

  try {
    const ip = await lib.fetchPublicIp(timeoutMs ? { timeoutMs } : {});
    if (jsonMode) printJson('public-ip', true, { ip });
    else if (!quiet && spinner) spinner.succeed(`公网 IP: ${ip}`);
    else if (quiet) console.log(ip);
    return { ok: true, ip };
  } catch (e) {
    if (jsonMode) printJson('public-ip', false, { error: e.message });
    else if (!quiet && spinner) spinner.fail(`获取公网 IP 失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { runPublicIp };

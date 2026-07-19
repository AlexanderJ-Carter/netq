'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Run TCP port check(s).
 * @param {string} host
 * @param {string|number} portsInput - Single port or list like "80,443,3000-3010"
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ok: boolean, host?: string, results?: Array, error?: string}>}
 */
async function runTcp(host, portsInput, { jsonMode = false, quiet = false, timeoutMs } = {}) {
  const cfg = storage.readConfigSync();
  const ms = timeoutMs ?? cfg.defaults.tcpTimeoutMs ?? 2500;
  const label = String(portsInput);
  const spinner = !jsonMode && !quiet ? ora(`TCP 检测: ${host} (${label})...`).start() : null;

  try {
    const ports = typeof portsInput === 'number' ? [portsInput] : lib.parsePorts(String(portsInput));
    const results =
      ports.length === 1
        ? [await lib.tcpCheck(host, ports[0], { timeoutMs: ms })]
        : await lib.tcpBatchCheck(host, ports, { timeoutMs: ms });

    const ok = results.every((r) => r.ok);

    if (jsonMode) {
      printJson('tcp', ok, { host, results });
    } else if (!quiet) {
      if (results.length === 1) {
        const r = results[0];
        if (r.ok) {
          if (spinner) spinner.succeed(`${host}:${r.port} 开放 (${r.ms}ms)`);
        } else if (spinner) {
          spinner.fail(`${host}:${r.port} ${r.error || '关闭'}`);
        }
      } else {
        if (spinner) spinner.stop();
        console.log(ui.title(`TCP 检测: ${host}`));
        const rows = [['端口', '状态', '耗时']];
        for (const r of results) {
          rows.push([String(r.port), r.ok ? ui.ok('开放') : ui.err(r.error || '关闭'), `${r.ms}ms`]);
        }
        console.log(ui.listTable(rows[0], rows.slice(1)));
      }
    } else {
      for (const r of results) {
        console.log(`${r.port}\t${r.ok ? 'open' : 'closed'}`);
      }
    }

    return { ok, host, results };
  } catch (e) {
    if (jsonMode) printJson('tcp', false, { host, error: e.message });
    else if (!quiet && spinner) spinner.fail(`TCP 检测失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, host, error: e.message };
  }
}

module.exports = { runTcp };

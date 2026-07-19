'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('./_ora');
const { printJson } = require('./_output');

/**
 * Run listening ports command.
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {number} [options.filterPort]
 * @param {boolean} [options.quiet]
 * @returns {Promise<{ok: boolean, ports?: Array, error?: string}>}
 */
async function runListening({ jsonMode = false, filterPort, quiet = false } = {}) {
  const spinner = !jsonMode && !quiet ? ora('获取监听端口列表...').start() : null;

  try {
    const result = await lib.listListeningPorts();
    if (!result.ok) {
      if (jsonMode) printJson('listening', false, { error: result.stderr || '获取失败' });
      else if (!quiet && spinner) spinner.fail(`获取失败: ${result.stderr}`);
      else if (quiet) console.error(result.stderr);
      return { ok: false, error: result.stderr };
    }

    let ports;
    if (lib.isWindows()) {
      ports = lib.parseWindowsNetstat(result.stdout);
    } else {
      ports = lib.parseSs(result.stdout);
      if (ports.length === 0) ports = lib.parseUnixNetstat(result.stdout);
    }

    if (filterPort) {
      ports = ports.filter((p) => p.localPort === filterPort);
    }

    if (lib.isWindows() && ports.length > 0) {
      const pids = ports.map((p) => p.pid).filter(Boolean);
      const procMap = await lib.resolveWindowsProcessNames(pids);
      for (const p of ports) {
        if (p.pid && procMap.has(p.pid)) p.process = procMap.get(p.pid);
      }
    }

    if (jsonMode) {
      printJson('listening', true, { entries: ports });
    } else if (!quiet) {
      if (spinner) spinner.succeed(`找到 ${ports.length} 个监听端口`);
      const rows = [['协议', '本地地址', '端口', '状态', 'PID', '进程']];
      for (const p of ports.slice(0, 50)) {
        rows.push([
          p.proto,
          p.localAddr || '*',
          String(p.localPort),
          p.state || '-',
          p.pid ? String(p.pid) : '-',
          p.process || '-'
        ]);
      }
      console.log(ui.listTable(rows[0], rows.slice(1)));
      if (ports.length > 50) {
        console.log(ui.dim(`... 共 ${ports.length} 条，已截断显示`));
      }
    } else {
      for (const p of ports) {
        console.log(`${p.proto}\t${p.localAddr || '*'}:${p.localPort}\t${p.pid || '-'}`);
      }
    }

    return { ok: true, ports };
  } catch (e) {
    if (jsonMode) printJson('listening', false, { error: e.message });
    else if (!quiet && spinner) spinner.fail(`获取失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { runListening };

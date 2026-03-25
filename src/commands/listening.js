'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./dns');

/**
 * Run the listening ports command
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {number} [options.filterPort] - Filter by port number
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<{ok: boolean, ports?: Array, error?: string}>} Command result
 */
async function runListening({ jsonMode, filterPort, quiet = false }) {
  const spinner = !jsonMode && !quiet ? ora('获取监听端口列表...').start() : null;

  try {
    const result = await core.listListeningPorts();
    if (!result.ok) {
      if (jsonMode) printJson('listening', { ok: false, error: result.stderr || '获取失败' });
      else if (!quiet) {
        if (spinner) spinner.fail(`获取失败: ${result.stderr}`);
      } else {
        console.error(result.stderr);
      }
      process.exitCode = 1;
      return { ok: false, error: result.stderr };
    }

    let ports;
    if (core.isWindows()) {
      ports = core.parseWindowsNetstat(result.stdout);
    } else {
      // Try ss format first
      ports = core.parseSs(result.stdout);
      if (ports.length === 0) {
        ports = core.parseUnixNetstat(result.stdout);
      }
    }

    // Port filter
    if (filterPort) {
      ports = ports.filter(p => p.localPort === filterPort);
    }

    // Windows process name resolution
    if (core.isWindows() && ports.length > 0) {
      const pids = ports.map(p => p.pid).filter(Boolean);
      const procMap = await core.resolveWindowsProcessNames(pids);
      for (const p of ports) {
        if (p.pid && procMap.has(p.pid)) {
          p.process = procMap.get(p.pid);
        }
      }
    }

    if (jsonMode) {
      printJson('listening', { ok: true, entries: ports });
    } else if (!quiet) {
      if (spinner) spinner.succeed(`找到 ${ports.length} 个监听端口`);
      const rows = [['协议', '本地地址', '端口', '状态', 'PID', '进程']];
      for (const p of ports.slice(0, 50)) { // Limit display count
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
    if (jsonMode) printJson('listening', { ok: false, error: e.message });
    else if (!quiet) {
      if (spinner) spinner.fail(`获取失败: ${e.message}`);
    } else {
      console.error(e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

module.exports = { runListening };

'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./_output');

/**
 * Run local interfaces command.
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {boolean} [options.system] - Also show system net info
 * @returns {Promise<Object>}
 */
async function runInterfaces({ jsonMode = false, quiet = false, system = false } = {}) {
  const spinner = !jsonMode && !quiet ? ora('获取网卡信息...').start() : null;

  try {
    const interfaces = lib.getLocalInterfaces();
    let systemInfo = null;
    if (system) {
      systemInfo = await lib.systemNetInfo();
    }

    if (jsonMode) {
      printJson('interfaces', true, {
        interfaces,
        system: systemInfo
          ? { command: systemInfo.command, ok: systemInfo.ok, stdout: systemInfo.stdout, stderr: systemInfo.stderr }
          : null
      });
    } else if (!quiet) {
      if (spinner) spinner.succeed(`找到 ${interfaces.length} 个地址`);
      console.log(ui.title('本机网卡信息'));
      const rows = [['名称', '协议', '地址', '子网掩码', 'MAC', '内部']];
      for (const i of interfaces) {
        rows.push([
          i.name,
          `IPv${i.family}`,
          i.address,
          i.netmask || '-',
          i.mac || '-',
          i.internal ? '是' : '否'
        ]);
      }
      console.log(ui.listTable(rows[0], rows.slice(1)));
      if (systemInfo) {
        console.log(ui.dim('\n系统网络配置:\n'));
        console.log(systemInfo.stdout || systemInfo.stderr || '');
      }
    } else {
      for (const i of interfaces) {
        console.log(`${i.name}\t${i.address}`);
      }
    }

    return { ok: true, interfaces, system: systemInfo };
  } catch (e) {
    if (jsonMode) printJson('interfaces', false, { error: e.message });
    else if (!quiet && spinner) spinner.fail(`获取失败: ${e.message}`);
    else if (quiet) console.error(e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { runInterfaces };

'use strict';

const ui = require('../ui');
const storage = require('../storage');
const { select, input, confirm } = require('@inquirer/prompts');
const {
  runPublicIp,
  runDns,
  runTcp,
  runHttp,
  runListening,
  runDoctor,
  runPing,
  runTraceroute,
  runInterfaces,
  runFavoritesList,
  runFavoritesAdd,
  runFavoritesRemove,
  runFavoritesRun,
  runTls,
  runDnsCompare,
  runWatch
} = require('../commands');
const { RR_TYPES } = require('../commands/dns');

/**
 * Recent host default for prompts.
 * @returns {string}
 */
function recentHostDefault() {
  const cfg = storage.readConfigSync();
  return cfg.recentHost || 'github.com';
}

/**
 * Run the interactive menu loop.
 */
async function interactiveMenu() {
  while (true) {
    ui.clear();
    console.log('\n' + ui.brand());
    console.log(ui.hr() + '\n');

    const choice = await select({
      message: '选择操作',
      choices: [
        { name: '── 本机 ──', value: 'sep-local', disabled: true },
        { name: '公网 IP', value: 'public-ip' },
        { name: '本机网卡信息', value: 'interfaces' },
        { name: '监听端口列表', value: 'listening' },
        { name: '── 连通诊断 ──', value: 'sep-diag', disabled: true },
        { name: '快速体检 (doctor)', value: 'doctor' },
        { name: 'DNS 查询', value: 'dns' },
        { name: 'DNS 多解析器对比', value: 'dns-compare' },
        { name: 'Ping', value: 'ping' },
        { name: 'Traceroute', value: 'traceroute' },
        { name: 'TCP 端口检测', value: 'tcp' },
        { name: 'HTTP(S) 检测', value: 'http' },
        { name: 'TLS 证书检测', value: 'tls' },
        { name: '── 进阶 ──', value: 'sep-adv', disabled: true },
        { name: '周期性监视 (watch)', value: 'watch' },
        { name: '收藏夹', value: 'favorites' },
        { name: '退出', value: 'exit' }
      ]
    });

    if (choice === 'exit') {
      console.log(ui.dim('\n再见！'));
      break;
    }

    try {
      await handleChoice(choice);
    } catch (e) {
      console.log(ui.err('\n操作失败: ') + e.message);
    }

    await confirm({ message: '按回车继续...', default: true });
  }
}

/**
 * Handle a menu choice via shared commands.
 * @param {string} choice
 */
async function handleChoice(choice) {
  const cfg = storage.readConfigSync();
  const hostDefault = recentHostDefault();

  switch (choice) {
    case 'public-ip':
      await runPublicIp({ jsonMode: false });
      break;

    case 'interfaces': {
      const system = await confirm({ message: '同时显示系统网络配置详情？', default: false });
      await runInterfaces({ jsonMode: false, system });
      break;
    }

    case 'dns': {
      const host = await input({ message: '输入域名', default: hostDefault });
      await runDns(host, { jsonMode: false });
      const more = await confirm({ message: '查询更多记录类型？', default: false });
      if (more) {
        const rtype = await select({
          message: '选择记录类型',
          choices: RR_TYPES.map(t => ({ name: t, value: t }))
        });
        await runDns(host, { jsonMode: false, type: rtype });
      }
      break;
    }

    case 'dns-compare': {
      const host = await input({ message: '输入域名', default: hostDefault });
      const rtype = await select({
        message: '记录类型',
        choices: ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS'].map(t => ({ name: t, value: t }))
      });
      await runDnsCompare(host, { jsonMode: false, type: rtype });
      break;
    }

    case 'ping': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      const countRaw = await input({
        message: 'Ping 次数',
        default: String(cfg.defaults.pingCount || 4)
      });
      await runPing(host, { jsonMode: false, count: Number(countRaw) });
      break;
    }

    case 'traceroute': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      await runTraceroute(host, { jsonMode: false });
      break;
    }

    case 'tcp': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      const portsStr = await input({ message: '端口（支持 80,443,3000-3010）', default: '443' });
      await runTcp(host, portsStr, { jsonMode: false });
      break;
    }

    case 'http': {
      const url = await input({ message: '输入 URL', default: `https://${hostDefault}` });
      const method = await select({
        message: 'HTTP 方法',
        choices: [
          { name: 'HEAD', value: 'HEAD' },
          { name: 'GET', value: 'GET' }
        ]
      });
      await runHttp(url, { jsonMode: false, method });
      break;
    }

    case 'tls': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      const portRaw = await input({ message: '端口', default: '443' });
      await runTls(host, { jsonMode: false, port: Number(portRaw) });
      break;
    }

    case 'listening': {
      const filter = await confirm({ message: '按端口过滤？', default: false });
      let filterPort;
      if (filter) {
        const raw = await input({ message: '端口', default: '3000' });
        filterPort = Number(raw);
      }
      await runListening({ jsonMode: false, filterPort });
      break;
    }

    case 'doctor': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      const customPorts = await confirm({ message: '自定义检测端口？', default: false });
      let portsInput;
      if (customPorts) {
        portsInput = await input({ message: '端口列表', default: '80,443' });
      }
      const exportReport = await confirm({
        message: '导出报告到 ~/.netq/reports/？',
        default: false
      });
      await runDoctor(host, { jsonMode: false, portsInput, exportReport });
      break;
    }

    case 'watch': {
      const host = await input({ message: '输入目标主机', default: hostDefault });
      const portRaw = await input({ message: 'TCP 端口', default: '443' });
      const intervalRaw = await input({ message: '间隔毫秒', default: '2000' });
      const limited = await confirm({ message: '限制轮次？', default: false });
      let count = null;
      if (limited) {
        count = Number(await input({ message: '轮次', default: '10' }));
      }
      await runWatch(host, {
        jsonMode: false,
        port: Number(portRaw),
        intervalMs: Number(intervalRaw),
        count
      });
      break;
    }

    case 'favorites':
      await favoritesMenu();
      break;
  }
}

/**
 * Favorites submenu: list / add / remove / run.
 */
async function favoritesMenu() {
  const action = await select({
    message: '收藏夹',
    choices: [
      { name: '列出', value: 'list' },
      { name: '运行', value: 'run' },
      { name: '添加', value: 'add' },
      { name: '删除', value: 'remove' },
      { name: '← 返回', value: 'back' }
    ]
  });

  if (action === 'back') return;

  if (action === 'list') {
    await runFavoritesList({ jsonMode: false });
    return;
  }

  if (action === 'add') {
    const type = await select({
      message: '类型',
      choices: [
        { name: 'ping', value: 'ping' },
        { name: 'tcp', value: 'tcp' },
        { name: 'http', value: 'http' },
        { name: 'dns', value: 'dns' },
        { name: 'doctor', value: 'doctor' }
      ]
    });
    const target = await input({
      message: type === 'http' ? 'URL' : '目标主机',
      default: type === 'http' ? 'https://www.baidu.com' : recentHostDefault()
    });
    let port;
    if (type === 'tcp') {
      port = Number(await input({ message: '端口', default: '443' }));
    }
    const label = await input({
      message: '标签',
      default:
        port !== undefined && port !== null ? `${type}: ${target}:${port}` : `${type}: ${target}`
    });
    await runFavoritesAdd({ type, target, port, label }, { jsonMode: false });
    return;
  }

  const cfg = storage.readConfigSync();
  const favorites = cfg.favorites || [];
  if (favorites.length === 0) {
    console.log(ui.warn('暂无收藏'));
    return;
  }

  const index = await select({
    message: action === 'run' ? '选择要运行的收藏' : '选择要删除的收藏',
    choices: favorites.map((f, i) => ({ name: f.label, value: i + 1 }))
  });

  if (action === 'run') await runFavoritesRun(index, { jsonMode: false });
  else await runFavoritesRemove(index, { jsonMode: false });
}

module.exports = { interactiveMenu, handleChoice };

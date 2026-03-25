'use strict';

const core = require('../core');
const ui = require('../ui');
const storage = require('../storage');
const { select, input, confirm } = require('@inquirer/prompts');
const { runPublicIp, runDns, runTcp, runHttp, runListening, runDoctor } = require('../commands');

/**
 * Run the interactive menu loop
 */
async function interactiveMenu() {
  const config = storage.readConfigSync();

  while (true) {
    ui.clear();
    console.log('\n' + ui.brand());
    console.log(ui.hr() + '\n');

    const choice = await select({
      message: '选择操作',
      choices: [
        { name: '公网 IP', value: 'public-ip' },
        { name: '本机网卡信息', value: 'interfaces' },
        { name: 'DNS 查询', value: 'dns' },
        { name: 'Ping', value: 'ping' },
        { name: 'Traceroute', value: 'traceroute' },
        { name: 'TCP 端口检测', value: 'tcp' },
        { name: 'HTTP(S) 检测', value: 'http' },
        { name: '监听端口列表', value: 'listening' },
        { name: '快速体检', value: 'doctor' },
        { name: '──────────', value: 'separator', disabled: true },
        { name: '收藏夹', value: 'favorites' },
        { name: '退出', value: 'exit' }
      ]
    });

    if (choice === 'exit') {
      console.log(ui.dim('\n再见！'));
      break;
    }

    try {
      await handleChoice(choice, config);
    } catch (e) {
      console.log(ui.err('\n操作失败: ') + e.message);
    }

    await confirm({ message: '按回车继续...', default: true });
  }
}

/**
 * Handle menu choice
 * @param {string} choice - Selected menu option
 * @param {Object} config - Configuration object
 */
async function handleChoice(choice, config) {
  switch (choice) {
    case 'public-ip':
      await runPublicIp({ jsonMode: false });
      break;

    case 'interfaces': {
      console.log(ui.title('本机网卡信息'));
      const ifaces = core.getLocalInterfaces();
      const rows = [['名称', '协议', '地址', '子网掩码', 'MAC', '内部']];
      for (const i of ifaces) {
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

      const showSystem = await confirm({ message: '显示系统网络配置详情？', default: false });
      if (showSystem) {
        console.log(ui.dim('\n系统网络配置:\n'));
        const sys = await core.systemNetInfo();
        console.log(sys.stdout || sys.stderr);
      }
      break;
    }

    case 'dns': {
      const host = await input({ message: '输入域名', default: 'github.com' });
      await runDns(host, { jsonMode: false });

      const types = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV'];
      const more = await confirm({ message: '查询更多记录类型？', default: false });
      if (more) {
        const rtype = await select({
          message: '选择记录类型',
          choices: types.map(t => ({ name: t, value: t }))
        });
        try {
          const result = await core.dnsResolve(host, rtype);
          console.log(ui.kvTable([[rtype, Array.isArray(result) ? result.join('\n') : String(result)]]));
        } catch (e) {
          console.log(ui.err('查询失败: ') + e.message);
        }
      }
      break;
    }

    case 'ping': {
      const host = await input({ message: '输入目标主机', default: '1.1.1.1' });
      const count = await input({ message: 'Ping 次数', default: '4' });
      console.log(ui.title(`Ping: ${host}`));
      console.log(ui.dim('执行中...\n'));
      const result = await core.ping(host, { count: Number(count) });
      console.log(result.stdout || result.stderr);
      break;
    }

    case 'traceroute': {
      const host = await input({ message: '输入目标主机', default: 'github.com' });
      console.log(ui.title(`Traceroute: ${host}`));
      console.log(ui.dim('执行中（可能需要较长时间）...\n'));
      const result = await core.traceroute(host);
      console.log(result.stdout || result.stderr);
      break;
    }

    case 'tcp': {
      const host = await input({ message: '输入目标主机', default: 'github.com' });
      const portsStr = await input({ message: '端口（支持 80,443,3000-3010）', default: '443' });
      const ports = core.parsePorts(portsStr);
      console.log(ui.title(`TCP 检测: ${host}`));

      if (ports.length === 1) {
        const result = await core.tcpCheck(host, ports[0]);
        const status = result.ok ? ui.ok('开放') : ui.err(result.error || '关闭');
        console.log(ui.kvTable([
          ['目标', `${host}:${ports[0]}`],
          ['状态', status],
          ['耗时', `${result.ms}ms`]
        ]));
      } else {
        console.log(ui.dim(`检测 ${ports.length} 个端口...\n`));
        const results = await core.tcpBatchCheck(host, ports);
        const rows = [['端口', '状态', '耗时']];
        for (const r of results) {
          rows.push([
            String(r.port),
            r.ok ? ui.ok('开放') : ui.err(r.error || '关闭'),
            `${r.ms}ms`
          ]);
        }
        console.log(ui.listTable(rows[0], rows.slice(1)));
      }
      break;
    }

    case 'http': {
      const url = await input({ message: '输入 URL', default: 'https://github.com' });
      await runHttp(url, { jsonMode: false });
      break;
    }

    case 'listening':
      await runListening({ jsonMode: false });
      break;

    case 'doctor': {
      const host = await input({ message: '输入目标主机', default: 'github.com' });
      await runDoctor(host, { jsonMode: false });
      break;
    }

    case 'favorites': {
      const favs = config.favorites || [];
      if (favs.length === 0) {
        console.log(ui.warn('暂无收藏'));
        return;
      }

      const favChoice = await select({
        message: '选择收藏项',
        choices: [
          ...favs.map((f, i) => ({ name: f.label, value: i })),
          { name: '← 返回', value: -1 }
        ]
      });

      if (favChoice === -1) return;

      const fav = favs[favChoice];
      switch (fav.type) {
        case 'ping':
          console.log(ui.title(`Ping: ${fav.target}`));
          const pResult = await core.ping(fav.target);
          console.log(pResult.stdout || pResult.stderr);
          break;
        case 'tcp':
          await runTcp(fav.target, fav.port, { jsonMode: false });
          break;
        case 'http':
          await runHttp(fav.target, { jsonMode: false });
          break;
        case 'dns':
          await runDns(fav.target, { jsonMode: false });
          break;
      }
      break;
    }
  }
}

module.exports = { interactiveMenu, handleChoice };

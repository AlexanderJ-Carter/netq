'use strict';

const core = require('./core');
const ui = require('./ui');
const storage = require('./storage');
const { select, input, confirm } = require('@inquirer/prompts');

const VERSION = require('../package.json').version;

function printJson(command, payload) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ command, timestamp: new Date().toISOString(), ...payload }, null, 2));
}

function showHelp() {
  console.log(`
${ui.brand()}

用法:
  netq                    交互模式
  netq <命令> [参数]      非交互模式

命令:
  --public-ip             获取公网 IP
  --dns <域名>            DNS 查询
  --tcp <主机> <端口>     TCP 端口检测
  --http <URL>            HTTP(S) 检测
  --listening             监听端口列表
  --doctor <主机>         快速体检（DNS+Ping+TCP+HTTP）

选项:
  -j, --json              JSON 格式输出
  --no-color              关闭彩色输出（也支持环境变量 NO_COLOR=1）
  -p, --port <端口>       过滤端口（用于 --listening）
  --ports <端口列表>      自定义端口（用于 --doctor）
  -v, --version           显示版本
  -h, --help              显示帮助

示例:
  netq
  netq --public-ip
  netq --dns github.com
  netq --tcp github.com 443
  netq --tcp localhost 80 --json
  netq --http https://github.com
  netq --listening
  netq --listening-json --port 3000
  netq --doctor github.com
  netq --doctor-json github.com --ports "80,443,8080"
`);
}

// ---------- CLI 参数解析 ----------

function parseArgs(args) {
  const out = {
    interactive: true,
    help: false,
    version: false,
    json: false,
    noColor: false,
    command: null, // 'public-ip' | 'dns' | 'tcp' | 'http' | 'listening' | 'doctor'
    host: null,
    port: null,
    ports: null,
    url: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      out.help = true;
      out.interactive = false;
    } else if (arg === '-v' || arg === '--version') {
      out.version = true;
      out.interactive = false;
    } else if (arg === '-j' || arg === '--json') {
      out.json = true;
    } else if (arg === '--no-color') {
      out.noColor = true;
    } else if (arg === '--public-ip') {
      out.command = 'public-ip';
      out.interactive = false;
    } else if (arg === '--dns') {
      out.command = 'dns';
      out.host = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--tcp') {
      out.command = 'tcp';
      out.host = args[++i] || null;
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
      out.interactive = false;
    } else if (arg === '--http') {
      out.command = 'http';
      out.url = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--listening') {
      out.command = 'listening';
      out.interactive = false;
    } else if (arg === '--doctor') {
      out.command = 'doctor';
      out.host = args[++i] || null;
      out.interactive = false;
    } else if (arg === '-p' || arg === '--port') {
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
    } else if (arg === '--ports') {
      out.ports = args[++i] || null;
    }
    // 兼容旧参数格式
    else if (arg === '--tcp-json') {
      out.command = 'tcp';
      out.json = true;
      out.host = args[++i] || null;
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
      out.interactive = false;
    } else if (arg === '--http-json') {
      out.command = 'http';
      out.json = true;
      out.url = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--listening-json') {
      out.command = 'listening';
      out.json = true;
      out.interactive = false;
    } else if (arg === '--doctor-json') {
      out.command = 'doctor';
      out.json = true;
      out.host = args[++i] || null;
      out.interactive = false;
    }
  }

  return out;
}

// ---------- 非交互模式处理 ----------

async function runPublicIp(jsonMode) {
  try {
    const ip = await core.fetchPublicIp();
    if (jsonMode) {
      printJson('public-ip', { ok: true, ip });
    } else {
      console.log(ui.title('公网 IP'));
      console.log(ui.kvTable([['IP', ui.ok(ip)]]));
    }
    return { ok: true, ip };
  } catch (e) {
    if (jsonMode) {
      printJson('public-ip', { ok: false, error: e.message });
    } else {
      console.log(ui.err('获取失败: ') + e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

async function runDns(host, jsonMode) {
  try {
    const [lookup, a, aaaa] = await Promise.all([
      core.dnsLookup(host),
      core.dnsResolve(host, 'A').catch(() => []),
      core.dnsResolve(host, 'AAAA').catch(() => [])
    ]);

    if (jsonMode) {
      printJson('dns', { ok: true, host, lookup, a, aaaa });
    } else {
      console.log(ui.title(`DNS: ${host}`));
      const rows = [
        ['lookup', lookup.map(r => `${r.address} (IPv${r.family})`).join('\n') || '无'],
        ['A', a.join('\n') || '无'],
        ['AAAA', aaaa.join('\n') || '无']
      ];
      console.log(ui.kvTable(rows));
    }
    return { ok: true, host, lookup, a, aaaa };
  } catch (e) {
    if (jsonMode) {
      printJson('dns', { ok: false, host, error: e.message });
    } else {
      console.log(ui.err('查询失败: ') + e.message);
    }
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

async function runDoctor(host, jsonMode, portsInput) {
  const results = { host, checks: {} };

  console.log(ui.title(`快速体检: ${host}`));

  // 1. DNS
  console.log(ui.dim('DNS 查询中...'));
  try {
    const lookup = await core.dnsLookup(host);
    results.checks.dns = { ok: true, addresses: lookup };
    console.log(ui.ok('✓ DNS: ') + lookup.map(r => r.address).join(', '));
  } catch (e) {
    results.checks.dns = { ok: false, error: e.message };
    console.log(ui.err('✗ DNS: ') + e.message);
  }

  // 2. Ping
  console.log(ui.dim('Ping 中...'));
  try {
    const ping = await core.ping(host, { count: 2 });
    results.checks.ping = { ok: ping.ok, output: ping.stdout };
    if (ping.ok) {
      console.log(ui.ok('✓ Ping: ') + '连通');
    } else {
      console.log(ui.err('✗ Ping: ') + (ping.stderr || '失败'));
    }
  } catch (e) {
    results.checks.ping = { ok: false, error: e.message };
    console.log(ui.err('✗ Ping: ') + e.message);
  }

  // 3. TCP 端口
  let ports = [80, 443];
  if (portsInput) {
    try {
      ports = core.parsePorts(portsInput);
    } catch (e) {
      console.log(ui.warn('端口参数无效，使用默认端口'));
    }
  }
  results.ports = ports;

  console.log(ui.dim(`TCP 端口检测中 (${ports.join(',')})...`));
  try {
    const tcp = await core.tcpBatchCheck(host, ports);
    results.checks.tcp = tcp;
    for (const t of tcp) {
      const status = t.ok ? ui.ok('✓') : ui.err('✗');
      console.log(`${status} TCP ${t.port}: ${t.ok ? '开放' : t.error}`);
    }
  } catch (e) {
    results.checks.tcp = { ok: false, error: e.message };
    console.log(ui.err('✗ TCP: ') + e.message);
  }

  // 4. HTTP
  console.log(ui.dim('HTTP 检测中...'));
  try {
    const http = await core.httpCheck(`https://${host}`);
    results.checks.http = http;
    if (http.ok) {
      console.log(ui.ok('✓ HTTPS: ') + `${http.status} (${http.ms}ms)`);
    } else {
      console.log(ui.err('✗ HTTPS: ') + (http.error || `状态码 ${http.status}`));
    }
  } catch (e) {
    results.checks.http = { ok: false, error: e.message };
    console.log(ui.err('✗ HTTPS: ') + e.message);
  }

  const dnsOk = Boolean(results.checks.dns && results.checks.dns.ok);
  const pingOk = Boolean(results.checks.ping && results.checks.ping.ok);
  const httpOk = Boolean(results.checks.http && results.checks.http.ok);
  const tcpOk = Array.isArray(results.checks.tcp)
    ? results.checks.tcp.every((x) => x && x.ok)
    : Boolean(results.checks.tcp && results.checks.tcp.ok);
  results.ok = dnsOk && pingOk && tcpOk && httpOk;

  if (jsonMode) {
    printJson('doctor', results);
    if (!results.ok) process.exitCode = 1;
  }

  return results;
}

async function runTcp(host, port, jsonMode) {
  console.log(ui.title(`TCP 检测: ${host}:${port}`));
  try {
    const result = await core.tcpCheck(host, port);
    const status = result.ok ? ui.ok('开放') : ui.err(result.error || '关闭');
    console.log(ui.kvTable([
      ['目标', `${host}:${port}`],
      ['状态', status],
      ['耗时', `${result.ms}ms`]
    ]));
    if (jsonMode) {
      printJson('tcp', result);
      if (!result.ok) process.exitCode = 1;
    }
    return result;
  } catch (e) {
    console.log(ui.err('检测失败: ') + e.message);
    if (jsonMode) printJson('tcp', { ok: false, host, port, error: e.message });
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

async function runHttp(url, jsonMode) {
  console.log(ui.title(`HTTP 检测: ${url}`));
  try {
    const result = await core.httpCheck(url);
    const status = result.ok ? ui.ok(result.status) : ui.err(result.status || '失败');
    console.log(ui.kvTable([
      ['URL', result.url],
      ['状态码', status],
      ['耗时', `${result.ms}ms`],
      ['远程 IP', result.ip || '未知'],
      ['重定向', result.location || '无']
    ]));

    if (result.chain.length > 1) {
      console.log(ui.dim('\n重定向链:'));
      for (const c of result.chain) {
        console.log(ui.dim(`  → ${c.url} [${c.status}]`));
      }
    }

    if (jsonMode) {
      printJson('http', result);
      if (!result.ok) process.exitCode = 1;
    }
    return result;
  } catch (e) {
    console.log(ui.err('检测失败: ') + e.message);
    if (jsonMode) printJson('http', { ok: false, url, error: e.message });
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

async function runListening(jsonMode, filterPort) {
  console.log(ui.title('监听端口列表'));
  try {
    const result = await core.listListeningPorts();
    if (!result.ok) {
      console.log(ui.err('获取失败: ') + result.stderr);
      if (jsonMode) printJson('listening', { ok: false, error: result.stderr || '获取失败' });
      process.exitCode = 1;
      return { ok: false, error: result.stderr };
    }

    let ports;
    if (core.isWindows()) {
      ports = core.parseWindowsNetstat(result.stdout);
    } else {
      // 尝试 ss 格式
      ports = core.parseSs(result.stdout);
      if (ports.length === 0) {
        ports = core.parseUnixNetstat(result.stdout);
      }
    }

    // 端口过滤
    if (filterPort) {
      ports = ports.filter(p => p.localPort === filterPort);
    }

    // Windows 进程名解析
    if (core.isWindows() && ports.length > 0) {
      const pids = ports.map(p => p.pid).filter(Boolean);
      const procMap = await core.resolveWindowsProcessNames(pids);
      for (const p of ports) {
        if (p.pid && procMap.has(p.pid)) {
          p.process = procMap.get(p.pid);
        }
      }
    }

    const rows = [['协议', '本地地址', '端口', '状态', 'PID', '进程']];
    for (const p of ports.slice(0, 50)) { // 限制显示数量
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

    if (jsonMode) {
      printJson('listening', { ok: true, entries: ports });
    }

    return { ok: true, ports };
  } catch (e) {
    console.log(ui.err('获取失败: ') + e.message);
    if (jsonMode) printJson('listening', { ok: false, error: e.message });
    process.exitCode = 1;
    return { ok: false, error: e.message };
  }
}

// ---------- 交互模式 ----------

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

async function handleChoice(choice, config) {
  switch (choice) {
    case 'public-ip':
      await runPublicIp();
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

      // 可选显示系统命令输出
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
      await runDns(host);

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
      await runHttp(url, false);
      break;
    }

    case 'listening':
      await runListening(false);
      break;

    case 'doctor': {
      const host = await input({ message: '输入目标主机', default: 'github.com' });
      await runDoctor(host, false);
      break;
    }

    case 'favorites': {
      const favs = config.favorites || [];
      if (favs.length === 0) {
        console.log(ui.warn('暂无收藏'));
        return;
      }

      const choice = await select({
        message: '选择收藏项',
        choices: [
          ...favs.map((f, i) => ({ name: f.label, value: i })),
          { name: '← 返回', value: -1 }
        ]
      });

      if (choice === -1) return;

      const fav = favs[choice];
      switch (fav.type) {
        case 'ping':
          console.log(ui.title(`Ping: ${fav.target}`));
          const pResult = await core.ping(fav.target);
          console.log(pResult.stdout || pResult.stderr);
          break;
        case 'tcp':
          await runTcp(fav.target, fav.port, false);
          break;
        case 'http':
          await runHttp(fav.target, false);
          break;
        case 'dns':
          await runDns(fav.target);
          break;
      }
      break;
    }
  }
}

// ---------- 主函数 ----------

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (process.env.NO_COLOR || opts.noColor) ui.setColorEnabled(false);

  if (opts.help) {
    showHelp();
    return;
  }

  if (opts.version) {
    console.log(`netq v${VERSION}`);
    return;
  }

  // 非交互模式
  if (!opts.interactive) {
    switch (opts.command) {
      case 'public-ip':
        return runPublicIp(opts.json);
      case 'dns':
        if (!opts.host) {
          console.log(ui.err('请指定域名'));
          process.exitCode = 1;
          return;
        }
        return runDns(opts.host, opts.json);
      case 'tcp':
        if (!opts.host || !Number.isFinite(opts.port) || opts.port < 1 || opts.port > 65535) {
          console.log(ui.err('请指定主机和端口'));
          process.exitCode = 1;
          return;
        }
        return runTcp(opts.host, opts.port, opts.json);
      case 'http':
        if (!opts.url) {
          console.log(ui.err('请指定 URL'));
          process.exitCode = 1;
          return;
        }
        return runHttp(opts.url, opts.json);
      case 'listening':
        return runListening(opts.json, opts.port);
      case 'doctor':
        if (!opts.host) {
          console.log(ui.err('请指定目标主机'));
          process.exitCode = 1;
          return;
        }
        return runDoctor(opts.host, opts.json, opts.ports);
      default:
        showHelp();
    }
    return;
  }

  // 交互模式
  await interactiveMenu();
}

module.exports = { main };

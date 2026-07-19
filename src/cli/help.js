'use strict';

const ui = require('../ui');

/**
 * Display top-level help.
 */
function showHelp() {
  console.log(`
${ui.brand()}

用法:
  netq                         交互模式
  netq <命令> [参数] [选项]    非交互模式

命令:
  interactive              进入交互菜单
  public-ip                获取公网 IP
  interfaces               本机网卡信息
  dns <主机>               DNS 查询
  ping <主机>              Ping
  traceroute <主机>        Traceroute
  tcp <主机> <端口列表>    TCP 端口检测
  http <URL>               HTTP(S) 检测
  listening                监听端口列表
  doctor <主机>            快速体检（DNS+Ping+TCP+HTTP）
  favorites                收藏夹管理
  help [命令]              显示帮助

全局选项:
  -j, --json               JSON 输出
  -q, --quiet              安静模式（仅结果）
  --no-color               关闭彩色（或 NO_COLOR=1）
  -v, --version            显示版本
  -h, --help               显示帮助

示例:
  netq
  netq public-ip
  netq dns github.com
  netq dns github.com --type MX
  netq ping 1.1.1.1 -c 4
  netq tcp github.com 443
  netq tcp github.com 80,443,3000-3010 --json
  netq http https://github.com --method GET
  netq listening --port 3000
  netq doctor github.com --ports 80,443 --export
  netq favorites list
  netq help doctor
`);
}

const COMMAND_HELPS = {
  'public-ip': `
${ui.title('netq public-ip')}

功能:
  查询本机出口公网 IP

用法:
  netq public-ip [--json] [-q]

Examples:
  netq public-ip
  netq public-ip --json
`,
  interfaces: `
${ui.title('netq interfaces')}

功能:
  列出本机网卡地址；可选展示系统网络配置

用法:
  netq interfaces [--system] [--json] [-q]

Examples:
  netq interfaces
  netq interfaces --system
  netq interfaces --json
`,
  dns: `
${ui.title('netq dns <主机>')}

功能:
  查询 DNS（默认 lookup + A + AAAA；可用 --type 指定记录）

用法:
  netq dns <主机> [--type A|AAAA|CNAME|TXT|MX|NS|SRV|all] [--json] [-q]

Examples:
  netq dns github.com
  netq dns github.com --type MX
  netq dns google.com --json
`,
  ping: `
${ui.title('netq ping <主机>')}

功能:
  ICMP Ping（调用系统 ping）

用法:
  netq ping <主机> [-c <1-10>] [--json] [-q]

Examples:
  netq ping 1.1.1.1
  netq ping github.com -c 4
  netq ping 8.8.8.8 --json
`,
  traceroute: `
${ui.title('netq traceroute <主机>')}

功能:
  路由追踪（Windows: tracert，其它: traceroute）

用法:
  netq traceroute <主机> [--json] [-q]

Examples:
  netq traceroute github.com
  netq traceroute 1.1.1.1 --json
`,
  tcp: `
${ui.title('netq tcp <主机> <端口列表>')}

功能:
  检测 TCP 端口是否开放（支持单端口、逗号列表、范围）

用法:
  netq tcp <主机> <端口列表> [--json] [-q]

Examples:
  netq tcp github.com 443
  netq tcp localhost 80,443,3000-3010
  netq tcp github.com 443 --json
`,
  http: `
${ui.title('netq http <URL>')}

功能:
  HTTP(S) 可达性检测（状态码、耗时、重定向链）

用法:
  netq http <URL> [--method HEAD|GET] [--json] [-q]

Examples:
  netq http https://github.com
  netq http https://example.com --method GET
  netq http https://github.com --json
`,
  listening: `
${ui.title('netq listening')}

功能:
  列出本机 Listening 端口（Windows 可解析进程名）

用法:
  netq listening [--port <端口>] [--json] [-q]

Examples:
  netq listening
  netq listening --port 3000
  netq listening --json
`,
  doctor: `
${ui.title('netq doctor <主机>')}

功能:
  一键体检：DNS + Ping + TCP + HTTP（先 HTTPS 再 HTTP）

用法:
  netq doctor <主机> [--ports <端口列表>] [--export] [--json] [-q]

Examples:
  netq doctor github.com
  netq doctor github.com --ports 80,443,8080
  netq doctor github.com --export --json
`,
  favorites: `
${ui.title('netq favorites')}

功能:
  管理 ~/.netq/config.json 中的收藏项

用法:
  netq favorites list
  netq favorites add <type> <target> [port] [--label <标签>]
  netq favorites remove <index>
  netq favorites run <index>

类型: ping | tcp | http | dns | doctor

Examples:
  netq favorites list
  netq favorites add ping 1.1.1.1 --label "Cloudflare DNS"
  netq favorites add tcp github.com 443
  netq favorites run 1
  netq favorites remove 2
`,
  interactive: `
${ui.title('netq interactive')}

功能:
  进入交互式菜单（与无参运行 netq 相同）

Examples:
  netq
  netq interactive
`
};

/**
 * Display help for a specific command.
 * @param {string} command
 */
function showCommandHelp(command) {
  const key = String(command || '').toLowerCase();
  const text = COMMAND_HELPS[key];
  if (!text) {
    console.log(ui.err(`未知命令: ${command}`));
    console.log(ui.dim('运行 netq help 查看命令列表'));
    return false;
  }
  console.log(text);
  return true;
}

module.exports = { showHelp, showCommandHelp, COMMAND_HELPS };

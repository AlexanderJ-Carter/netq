'use strict';

const ui = require('../ui');

/**
 * Display the help text for the CLI
 */
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
  -q, --quiet             安静模式（仅输出结果）
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

/**
 * Display help for a specific command
 * @param {string} command - The command name (dns, tcp, http, listening, doctor)
 */
function showCommandHelp(command) {
  const helps = {
    dns: `
${ui.title('netq --dns <域名>')}

功能:
  查询指定域名的 DNS 记录

用法:
  netq --dns <域名>           查询域名 DNS
  netq --dns <域名> --json    JSON 格式输出

示例:
  netq --dns github.com
  netq --dns google.com --json

输出字段:
  lookup  - 系统解析结果（IPv4/IPv6）
  A       - A 记录（IPv4 地址）
  AAAA    - AAAA 记录（IPv6 地址）
`,
    tcp: `
${ui.title('netq --tcp <主机> <端口>')}

功能:
  检测目标主机的 TCP 端口是否开放

用法:
  netq --tcp <主机> <端口>           单端口检测
  netq --tcp <主机> <端口> --json    JSON 格式输出

示例:
  netq --tcp github.com 443
  netq --tcp localhost 80 --json
  netq --tcp 192.168.1.1 22

输出字段:
  目标  - 主机:端口
  状态  - 开放/关闭
  耗时  - 连接耗时（毫秒）
`,
    http: `
${ui.title('netq --http <URL>')}

功能:
  检测 HTTP(S) URL 的可访问性

用法:
  netq --http <URL>           HTTP(S) 检测
  netq --http <URL> --json    JSON 格式输出

示例:
  netq --http https://github.com
  netq --http https://example.com --json

输出字段:
  URL      - 最终 URL
  状态码   - HTTP 状态码
  耗时     - 请求耗时（毫秒）
  远程 IP  - 服务器 IP 地址
  重定向   - 重定向目标（如有）
`,
    listening: `
${ui.title('netq --listening')}

功能:
  列出系统当前监听的 TCP/UDP 端口

用法:
  netq --listening              列出监听端口
  netq --listening --json       JSON 格式输出
  netq --listening -p <端口>    过滤指定端口

示例:
  netq --listening
  netq --listening --json
  netq --listening -p 3000

输出字段:
  协议     - TCP/UDP
  本地地址 - 监听地址
  端口     - 监听端口
  状态     - 连接状态
  PID      - 进程 ID
  进程     - 进程名称
`,
    doctor: `
${ui.title('netq --doctor <主机>')}

功能:
  对目标主机进行综合网络诊断

用法:
  netq --doctor <主机>              综合诊断
  netq --doctor <主机> --json       JSON 格式输出
  netq --doctor <主机> --ports <列表>  自定义检测端口

示例:
  netq --doctor github.com
  netq --doctor google.com --json
  netq --doctor example.com --ports "80,443,8080"

检测项目:
  DNS  - 域名解析
  Ping - 网络连通性
  TCP  - 端口开放状态
  HTTP - HTTPS 可访问性
`
  };

  if (helps[command]) {
    console.log(helps[command]);
  } else {
    console.log(ui.err(`未知命令: ${command}`));
    showHelp();
  }
}

module.exports = { showHelp, showCommandHelp };

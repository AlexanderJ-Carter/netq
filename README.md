# netq

[![CI](https://github.com/AlexanderJ-Carter/netq/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexanderJ-Carter/netq/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/AlexanderJ-Carter/netq)

**netq** 是面向开发者/运维/普通用户的轻量**交互式网络排查 CLI**：全程选单式交互，不用记 `netstat` / `ping` / `tracert` 等复杂参数；同时也提供对脚本与 agent 友好的**子命令**接口。

---

## 功能概览

| 能力                  | 说明                                                       |
| --------------------- | ---------------------------------------------------------- |
| **快速体检**          | DNS / Ping / TCP / HTTP / TLS 并行检测，输出健康分与建议   |
| **TLS 证书**          | 有效期、SAN、协议与套件一键查看                            |
| **DNS 对比**          | 系统 DNS vs Cloudflare / Google，标出不一致                |
| **Watch 监视**        | 周期性 Ping + TCP，终端刷新连通状态                        |
| **子命令 CLI**        | `netq dns` / `netq doctor` 等，统一 `--json` 输出          |
| **常用收藏**          | `favorites` 增删查跑，保存到 `~/.netq/config.json`         |
| **公网 IP**           | 快速查询出口 IP（基于 api.ipify.org）                      |
| **本机网卡**          | Node 获取 + 可选系统命令（ipconfig / ifconfig / ip）       |
| **DNS**               | lookup / resolve（A / AAAA / CNAME / TXT / MX / NS / SRV） |
| **Ping / Traceroute** | 连通性与路由路径                                           |
| **TCP 端口**          | 单端口或批量（如 `80,443,3000-3010`）                      |
| **HTTP(S)**           | 状态码、重定向链、解析 IP                                  |
| **监听端口**          | 本机 Listening 列表，端口/PID 过滤，Windows 可解析进程名   |
| **导出报告**          | `doctor --export` 写出到 `~/.netq/reports/`                |

---

## 安装与使用

**交互模式**（菜单式）：

```bash
netq
# 或
netq interactive
```

**非交互模式**（适合脚本 / CI / agent）：

```bash
netq public-ip
netq dns github.com
netq dns-compare github.com
netq tls github.com
netq ping 1.1.1.1 -c 4
netq traceroute github.com
netq interfaces --system
netq doctor github.com
netq doctor github.com --ports "80,443,3000-3010" --json
netq watch 1.1.1.1 --interval 2000 -c 5
netq tcp github.com 443
netq tcp github.com 80,443,3000-3010 --json
netq http https://github.com --method GET
netq listening --port 3000 --json
netq favorites list
netq favorites add ping 1.1.1.1 --label "CF DNS"
netq favorites run 1
netq help doctor
```

**全局安装**（发布到 npm 后）：

```bash
npm i -g @alexanderjcarter/netq
netq
```

**库用法**：

```js
const { dnsLookup, tcpCheck, tlsCheck, dnsCompare, scoreDoctor } = require('@alexanderjcarter/netq');
```

---

## JSON 输出

所有命令支持 `-j` / `--json`，统一结构：

```json
{
  "ok": true,
  "command": "dns",
  "ts": "2026-07-19T00:00:00.000Z",
  "data": {}
}
```

失败时进程退出码为 `1`。`watch` 为终端刷新命令，不支持 `--json`。

---

## 说明

- 设计目标：日常能用得上的核心功能，交互与 CLI 共用同一套命令层。
- `traceroute` 在部分 Linux 发行版需单独安装，缺命令时会提示。
- 配置：`~/.netq/config.json`（收藏、默认超时、Ping 次数、`recentHost` 等）。
- 报告目录：`~/.netq/reports/`。

---

## 开源与贡献

| 文档                               | 说明               |
| ---------------------------------- | ------------------ |
| [LICENSE](LICENSE)                 | MIT 许可证         |
| [SECURITY.md](SECURITY.md)         | 安全策略与漏洞报告 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南           |
| [CHANGELOG.md](CHANGELOG.md)       | 更新记录           |
| [RELEASE.md](RELEASE.md)           | 维护者发布流程     |

**页面展示**：功能与用法展示页见 [docs/index.html](docs/index.html)。

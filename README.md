# netq

[![CI](https://github.com/AlexanderJ-Carter/netq/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexanderJ-Carter/netq/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/AlexanderJ-Carter/netq)

**netq** 是面向开发者/运维/普通用户的轻量**交互式网络排查 CLI**：全程选单式交互，不用记 `netstat` / `ping` / `tracert` 等复杂参数，把最常用的网络操作做成「一键可读」的结果页。

---

## 功能概览

| 能力 | 说明 |
|------|------|
| **快速体检** | 公网 IP、DNS、Ping、TCP 端口、HTTP 状态码一键检测 |
| **脚本化** | `--doctor-json` 等输出机器可读 JSON，失败时退出码 1 |
| **常用收藏** | 常用目标一键运行，自动保存到 `~/.netq/config.json` |
| **公网 IP** | 快速查询出口 IP（基于 api.ipify.org） |
| **本机网卡** | Node 获取 + 可选展示系统命令（ipconfig / ifconfig / ip） |
| **DNS** | lookup / resolve（A / AAAA / CNAME / TXT / MX / NS / SRV） |
| **Ping / Traceroute** | 连通性与路由路径 |
| **TCP 端口** | 单端口或批量（如 `80,443,3000-3010`） |
| **HTTP(S)** | 状态码、重定向链、解析 IP |
| **监听端口** | 本机 Listening 列表，端口/PID 过滤，Windows 可解析进程名 |
| **导出报告** | 结果可导出 TXT/JSON 到 `~/.netq/reports/` |

---

## 安装与使用

**交互模式**（菜单式）：

```bash
netq
```

**非交互模式**（适合脚本 / CI）：

```bash
netq --public-ip
netq --dns github.com
netq --doctor github.com
netq --doctor-json github.com --ports "80,443,3000-3010"
netq --tcp github.com 443
netq --tcp github.com 443 --json
netq --http https://github.com
netq --http https://github.com --json
netq --listening
netq --listening --json --port 3000
```

**全局安装**（发布到 npm 后）：

```bash
npm i -g netq
netq
```

---

## 说明

- 设计目标：日常能用得上的核心功能，不堆砌花哨能力。
- `traceroute` 在部分 Linux 发行版需单独安装，缺命令时会提示。
- 配置：`~/.netq/config.json`（收藏、默认超时、Ping 次数等）。
- 报告目录：`~/.netq/reports/`。

---

## 开源与贡献

| 文档 | 说明 |
|------|------|
| [LICENSE](LICENSE) | MIT 许可证 |
| [SECURITY.md](SECURITY.md) | 安全策略与漏洞报告 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南 |
| [CHANGELOG.md](CHANGELOG.md) | 更新记录 |
| [RELEASE.md](RELEASE.md) | 维护者发布流程 |

**页面展示**：功能与用法展示页见 [docs/index.html](docs/index.html)。

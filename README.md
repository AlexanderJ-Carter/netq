# netq

**netq** 是一个面向开发者/运维/普通用户的轻量交互式网络排查 CLI：全程选单式交互，不用记 `netstat/ping/tracert` 等复杂参数；把最常用的网络操作做成“一键可读”的结果页。

## 功能（MVP）

- 快速体检：公网 IP / DNS / Ping / TCP 端口 / HTTP 状态码
- 可脚本化：`--doctor-json` 输出机器可读 JSON
- 常用收藏：把常用目标做成一键运行（自动保存到 `~/.netq/config.json`）
- 公网 IP（`api.ipify.org`）
- 本机网卡信息（Node 获取）+ 可选展示系统命令输出（Windows: `ipconfig /all`，macOS/Linux: `ifconfig`/`ip a`）
- DNS 查询：`lookup` / `resolve`（A/AAAA/CNAME/TXT/MX/NS/SRV）
- Ping
- Traceroute/Tracert
- TCP 端口连通性检测（单个/批量，支持 `80,443,3000-3010`）
- HTTP(S) 连通性/状态码检测（HEAD/GET，可跟随重定向；展示解析 IP、连接 IP、重定向链）
- 本机监听端口/占用列表（支持结构化表格 + 端口/PID 过滤；Windows 可选解析进程名）
- 一键导出：每个结果页可导出 TXT/JSON 到 `~/.netq/reports/`

## 安装与使用

交互模式：

```bash
netq
```

非交互模式（适合脚本/CI / 自动化探测）：

```bash
netq --public-ip
netq --dns github.com
netq --doctor github.com
netq --doctor-json github.com
netq --doctor github.com --ports "80,443,3000-3010"
netq --doctor-json github.com --ports "80,443,3000-3010"
netq --tcp github.com 443
netq --tcp-json github.com 443
netq --http https://github.com
netq --http-json https://github.com
netq --listening
netq --listening-json --port 3000
```

安装（将来发布到 npm 后）：

```bash
npm i -g netq
netq
```

## 说明

- 目标是“日常能用得上”的核心功能，避免堆砌花哨能力。
- `traceroute` 在某些 Linux 发行版可能需要额外安装（系统缺命令时会提示失败信息）。
- 配置文件：`~/.netq/config.json`（收藏、默认超时、默认次数）。
- 报告导出目录：`~/.netq/reports/`。

## 开源与贡献

- 许可证：MIT，见 `LICENSE`
- 安全策略：见 `SECURITY.md`
- 贡献指南：见 `CONTRIBUTING.md`
（维护者文档）发布流程：见 `RELEASE.md`
- 更新记录：见 `CHANGELOG.md`

## 页面展示

- 功能与用法展示页：`docs/index.html`（可用 GitHub Pages 发布）


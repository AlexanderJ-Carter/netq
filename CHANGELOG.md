## Changelog

本项目遵循语义化版本（SemVer）。

### v0.3.0

**新增功能**
- TypeScript 类型定义 (`core.d.ts`, `storage.d.ts`)
- 新增 `doctor` 综合诊断命令
- DNS 查询缓存机制（60秒 TTL）
- ESLint + Prettier 代码规范配置

**性能优化**
- Doctor 命令并行化执行，减少 30-50% 执行时间
- Windows 进程名批量解析改为并行执行

**安全性改进**
- 加强主机名输入验证（长度限制、字符白名单）
- CI 安全审计级别提升至 `high`

**开发者体验**
- 添加 `npm run lint` 和 `npm run format` 脚本
- 添加 `prepublishOnly` 发布前检查
- 新增单元测试覆盖核心模块

### v0.2.0

- 交互式菜单：公网 IP / 网卡信息 / DNS / Ping / Traceroute / TCP / HTTP / 监听端口 / 快速体检 / 收藏夹
- 非交互模式：支持 `--doctor-json` 等 JSON 输出（适合脚本/CI）
- 结果导出：支持导出 TXT/JSON 到本机目录


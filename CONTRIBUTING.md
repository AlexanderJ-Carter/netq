# 贡献指南（Contributing）

欢迎贡献 **netq**！提交前请先阅读 [行为准则](CODE_OF_CONDUCT.md) 与 [安全策略](SECURITY.md)。

## 开发环境

- Node.js：见 `package.json` → `engines`
- 包管理：npm（仓库含 `package-lock.json`）

```bash
npm install
npm start
# 或
node bin/netq.js help
```

质量检查：

```bash
npm run lint
npm test
npm run format:check
```

## 项目结构

| 路径 | 职责 |
| ---- | ---- |
| `bin/netq.js` | CLI 入口 |
| `src/main.js` | 子命令路由 |
| `src/cli/` | 参数解析与帮助 |
| `src/lib/` | 纯诊断逻辑（可被库引用） |
| `src/commands/` | CLI / 交互共用命令层 |
| `src/interactive/` | 交互菜单 |
| `docs/index.html` | GitHub Pages 落地页 |
| `tests/` | Jest 单测 |

交互模式与子命令必须共用 `src/commands/*`，避免两套逻辑。

## 新增命令时请同步

1. `src/lib/` 逻辑 + 单测  
2. `src/commands/` 命令层  
3. `src/cli/args.js` / `help.js` / `main.js`  
4. `src/interactive/menu.js`（如适用）  
5. `src/lib/index.js` 与 `*.d.ts`  
6. `README.md` / `CHANGELOG.md` / 必要时 `docs/index.html`

JSON 输出契约保持：`{ ok, command, ts, data }`。

## 提交与 PR

- 一个 PR 尽量只做一件事；说明「为什么改」与如何验证  
- 提交信息建议：`feat:` / `fix:` / `docs:` / `chore:` / `test:` / `ci:`  
- PR 描述使用仓库模板，勾选验证项  
- 避免无关重构与不必要依赖；不要为兼容而加冗余回落逻辑  

## 许可证

贡献代码即表示你同意以 **MIT**（见 [LICENSE](LICENSE)）授权给本项目。

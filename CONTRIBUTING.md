# 贡献指南（Contributing）

欢迎贡献 **netq**！

## 开发环境

- Node.js >= 20（见 `package.json` engines）

安装依赖并运行：

```bash
npm install
npm start
# 或直接：
node bin/netq.js help
```

检查与测试：

```bash
npm run lint
npm test
```

CLI 为子命令风格（`netq dns github.com`），库代码在 `src/lib/`，命令编排在 `src/commands/`。

## 提交规范（建议）

- 一个 PR 尽量只做一件事
- 说明“为什么改”以及如何验证
- 避免引入不必要依赖

## 代码风格

项目当前以“可读、少依赖、少样板”为优先。


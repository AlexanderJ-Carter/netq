# 发布流程（Release）

本项目使用 GitHub Actions：当你推送 `v*` 的 tag 时，会自动创建 GitHub Release，并把 `npm pack` 生成的 `.tgz` 作为附件上传。

## 本地发布（示例）

```bash
# 确保工作区干净
npm run lint

# 选择一种版本号策略（示例：patch）
npm version patch

# 推送提交与 tag（SSH）
git push origin main
git push origin --tags
```

## 版本号约定

建议使用 `vX.Y.Z` 的 tag（例如 `v0.2.1`）。


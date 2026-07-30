# 发布流程（Release）

本项目使用 GitHub Actions：推送 `v*` tag 时自动创建 GitHub Release，并将 `npm pack` 生成的 `.tgz` 作为附件上传。另有独立的 npm publish 工作流（见 `.github/workflows/`）。

## 发布前检查清单

- [ ] `CHANGELOG.md` 已写好本版本条目
- [ ] `package.json` 版本号已更新（SemVer）
- [ ] `README.md` / `docs/index.html` 与功能一致
- [ ] `npm run lint` 通过
- [ ] `npm test` 通过
- [ ] 工作区干净，已推送到 `main`

## 本地打 tag（示例）

```bash
# 确保工作区干净且检查已通过
npm run lint
npm test

# 按变更选择版本（patch / minor / major）
npm version minor

# 推送提交与 tag
git push origin main
git push origin --tags
```

`npm version` 会同时改 `package.json`、创建提交并打 `vX.Y.Z` tag。

## 版本号约定

- Tag 格式：`vX.Y.Z`（例如 `v1.1.0`）
- 破坏性变更：升 major，并在 CHANGELOG 标明 Breaking Changes
- 新功能：升 minor
- 修复：升 patch

## 发布后

- 在 GitHub Release 页面核对说明与附件
- 若启用 npm 发布，确认 registry 上版本可安装：`npm view @alexanderjcarter/netq version`
- 需要时更新 GitHub Pages（随 `main` 的 `docs/` 部署）

## npm 发布鉴权

`Publish to npm` 工作流需要能向 `registry.npmjs.org` 写入 `@alexanderjcarter/netq`。

任选其一：

1. **Automation Token（推荐快速修好）**  
   - 在 https://www.npmjs.com/settings/~/tokens 创建 Automation token  
   - 仓库 Settings → Secrets and variables → Actions → 更新 Secret `NPM_TOKEN`  
   - 然后：`gh workflow run "Publish to npm" --ref v1.1.0`

2. **Trusted Publisher（OIDC，可逐渐弃用长期 token）**  
   - 打开包页面 → Settings → Trusted Publisher  
   - Publisher: GitHub Actions  
   - Organization/user: `AlexanderJ-Carter`  
   - Repository: `netq`  
   - Workflow filename: `publish.yml`  
   - 仍可保留 `NPM_TOKEN` 作为回退；工作流已开启 `id-token: write` 与 `--provenance`

`404 Not Found` 在 `npm publish` 时通常表示 token 无效/过期，或对 scope 无写权限（npm 常不返回 401）。

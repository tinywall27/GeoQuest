# GeoQuest Cloudflare 发布

正式入口：<https://geo.tinywall.cc/geoquest/>。

## Git 与构建

- GitHub：`tinywall27/GeoQuest`，生产分支 `main`。
- Cloudflare Pages 项目：`geoquest`（`geoquest-3ob.pages.dev`），当前采用 Direct Upload。原仓库已绑定另一个 Cloudflare 账号，跨账号 Git 集成受限；推送仍触发 GitHub CI，但不会自动更新此 Pages 项目。
- 构建根目录：仓库根目录；输出目录：`dist`。
- 构建命令：`pnpm lint && pnpm typecheck && pnpm test:run && pnpm build:pages`。
- 本地或 CI 发布构建环境变量：`NODE_VERSION=22`、`PNPM_VERSION=11.16.0`、`VITE_BASE_PATH=/geoquest/`。
- 不开启 Web Analytics，不设置运行时 API、账号或追踪服务。

`build:pages` 先执行内容校验、公共投影和生产构建，再把应用及资源收纳到 `dist/geoquest/`，生成项目目录页、404 页、有限范围的页面重写和安全响应头，最后执行公开边界检查。发布包没有候选图片、内部材料或 source map。

本地 `pnpm dev` 仍使用根路径；模拟发布构建时设置 `VITE_BASE_PATH=/geoquest/` 后运行 `pnpm build:pages`。禁止把普通根路径构建直接当作 Pages 发布包。

使用已登录目标账号的 Wrangler，可执行 `pnpm dlx wrangler pages deploy dist --project-name geoquest --branch main`。本次通过 Cloudflare 连接器取得项目短期上传授权，上传同一构建包并创建生产部署；没有在仓库保存 API token。后续如需自动发布，可在 GitHub Actions 配置仅具 Pages 发布权限的仓库 Secret，再在 CI 通过后上传；也可在原账号解除旧 Git 绑定后重新规划集成。

## 域名与多项目

在 Pages 绑定 `geo.tinywall.cc`，并在 Cloudflare DNS 添加同名 CNAME 指向 `geoquest-3ob.pages.dev`。`tinywall.cc` 主站使用原有配置。

GeoQuest 占用 `/geoquest/`，主题路径例如 `/geoquest/topics/earth-motion-lab?mode=classroom`。服务器仅将应用已知页面路径重写到 GeoQuest HTML，资源路径直接返回资源，其他项目路径不会落入本应用。域名根目录目前提供一个项目入口。

未来独立地理仓库可部署到各自的 Pages 项目，再通过同域名的 Cloudflare Worker 按路径转发；或者将多个项目的构建产物汇入统一站点。添加其他项目时需同时配置路径、资源前缀和各自 SPA 回退，不能仅添加指向不同站点的同名 DNS 记录。

## 验收与回滚

发布前运行 `pnpm verify` 和 `pnpm test:e2e`。发布后运行：

```bash
pnpm exec playwright test --config playwright.release.config.ts
```

该验收检查桌面及移动端：首页五个入口、主题深链接与刷新、课堂切换、农业实际操作、资源加载、无第三方请求或 Cookie、安全响应头以及其他路径的 404。`RELEASE_URL` 可指定 Pages 预览域名，默认检查正式域名。

核对本地 HEAD、GitHub `main` 和 Cloudflare 部署的 commit hash 一致。需要回滚时，在 Pages 选择已验证的生产部署执行回滚，并另行处理 Git 分支；不强制改写 Git 历史。

官方配置参考：[构建设置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)、[页面重写](https://developers.cloudflare.com/pages/configuration/redirects/)。

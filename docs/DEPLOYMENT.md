# 地理教学项目统一发布

正式入口：<https://geo.tinywall.cc/>。所有地理项目由本仓库统一构建，发布到同一个 Git 集成的 Cloudflare Pages 项目 `geoquest-git`（`geoquest-git.pages.dev`）。

## 地址与来源

| 页面 | 正式路径 | 源码 |
| --- | --- | --- |
| 地理课堂项目入口 | `/` | `portal/` |
| GeoQuest 互动实验 | `/geoquest/` | `src/`、`content/` |
| 地形与等高线 | `/GeoLandform/Landforms1/` | `projects/landforms1/index.html` |

地形演示保留原网址和原始单文件内容。原独立 Worker `geolandform-landforms1` 的两条路由在统一 Pages 版本验收通过后移除，避免继续截获请求。原 Worker 可保留为无路由的回滚备份；后续发布不再使用它。

## 构建与自动部署

- GitHub：`tinywall27/GeoQuest`；生产分支 `main`；使用 SSH 推送。
- Node 22；pnpm 版本由 `package.json` 固定；发布配置 `wrangler.jsonc`。
- 构建：`VITE_BASE_PATH=/geoquest/ pnpm build:pages`，产物 `dist/`。
- Cloudflare 原生 Git 集成关联 `tinywall27/GeoQuest`，生产分支 `main`。推送后由 Cloudflare 拉取代码、安装依赖、检查并构建部署；控制台直接显示关联仓库与构建日志。
- Cloudflare 构建命令：`pnpm lint && pnpm typecheck && pnpm test:run && VITE_BASE_PATH=/geoquest/ pnpm build:pages`；输出目录 `dist`；环境变量 `NODE_VERSION=22`、`PNPM_VERSION=11.16.0`。根目录留空。
- GitHub Actions 继续执行质量检查与浏览器回归，不再上传部署包。Cloudflare 构建与 GitHub 检查独立触发；原生构建命令自身包含 lint、类型、单元测试与边界门禁，不会等待 GitHub 浏览器回归结果。
- 旧 Direct Upload 项目 `geoquest` 仅保留历史部署作为回滚备份，不绑定正式域名；旧 Actions 发布开关已关闭，生产不再依赖 GitHub 中的 Cloudflare 上传令牌。
- 不开启 Web Analytics，不设置运行时 API、账号或追踪服务。

`build:pages` 先校验内容、编译公共投影、构建应用，再把 GeoQuest 放入 `dist/geoquest/`，把独立项目复制到各自路径，生成根入口、404、定向重写和安全响应头，并执行公开边界检查。GeoQuest 与单文件项目分别使用 CSP；单文件内联脚本按构建时生成的 SHA-256 放行，不使用 `unsafe-inline` 脚本权限。Pages 会合并匹配的响应头，因此不能让根通配 CSP 与独立项目 CSP 重复叠加。

本地开发 GeoQuest 使用 `pnpm dev`。统一站点验收使用：

```bash
VITE_BASE_PATH=/geoquest/ pnpm build:pages
pnpm dlx wrangler@4.135.0 pages dev dist --port 4176
# 另一个终端
RELEASE_URL=http://127.0.0.1:4176 pnpm exec playwright test --config playwright.release.config.ts
```

正常发布只需推送 main；在 Cloudflare 控制台可重试失败构建。禁止把普通根路径 Vite 构建直接上传为统一站点。

## 新项目上线约定

1. 将可公开且许可明确的项目源文件放入 `projects/<id>/`，记录来源、许可、署名及离线替代；不要复制本机环境、凭据或其他项目的部署缓存。
2. 在 `scripts/prepare-projects.mjs` 接入静态产物，并在 `scripts/prepare-pages.mjs` 组合路径、安全响应头及必要的重写。每个项目保有独立前缀，不把未知路径交给 GeoQuest 路由。不再单独创建 Worker、Pages 项目或域名路由。
3. 在 `portal/projects.json` 添加唯一 `id`、名称 `name`、类型 `category`、简介 `description`、正式路径 `url`、标签 `tags` 和主题 `topics`。只收录实际发布的项目；入口展示与静态托管分开管理。
4. 构建并验证桌面和手机页面、实际交互、原有项目兼容性、链接、无外部追踪及安全响应头；检查通过后推送 main，由自动部署发布整个站点。
5. 验证正式域名的入口卡片与项目直链，包括刷新与课堂模式；核对本地提交、GitHub main 和部署 commit hash。

入口等高线与山峰为原创 SVG 地形示意，不对应真实地理边界；随站点本地提供，按 `LICENSE-CONTENT` 发布，无外部图片、字体或 CDN。

## 域名、隐私与回滚

`geo.tinywall.cc` 绑定到 Git 集成 Pages `geoquest-git`；`tinywall.cc` 主站保持独立。历史域名级 Web Analytics 曾自动注入子域名，需维持对地理站点的禁用配置，发布后核验 HTML、浏览器网络与 Cookie，不能只看项目开关。

`pnpm exec playwright test --config playwright.release.config.ts` 默认检查正式域名，`RELEASE_URL` 可指定预览域名。验收覆盖根目录、GeoQuest 的主题深链接与刷新、课堂切换、农业交互、地形演示 CSP 与交互、无第三方请求/Cookie以及未知路径 404。

回滚时在新 Pages 项目选择已验证的统一部署，或提交 revert 触发同一流水线；不强制改写 Git 历史。迁入首次验收前保留原 Worker；若需要回退路由，原路径为 `/GeoLandform/Landforms1` 与 `/GeoLandform/Landforms1/*`。不要回滚到不含其他已上线项目的旧单项目构建包。

官方参考：[Direct Upload 限制](https://developers.cloudflare.com/pages/get-started/direct-upload/)、[持续集成发布](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)、[安全响应头](https://developers.cloudflare.com/pages/configuration/headers/)。

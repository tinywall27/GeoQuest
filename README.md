# GeoQuest · 地理智探

GeoQuest 是面向初中课堂的地理互动实验。V2 收敛到地形、地球与太阳、水土与流域、气候与农业、人口与区域五个主题。

地形实验的三维山体、等高线、路线剖面共用高程数据；地球实验的地表点、光照、太阳高度与昼长共用球面几何。水土实验以水量平衡连接坡面产流和流域滞蓄。农业实验连接雨热日历、逐日供水与方案取舍；人口实验使用世界银行四国同年数据，区分总量、密度与统计尺度。五个主题均按 20 分钟课堂流程进行 AI 教学模拟，已完成模型、交互和课堂流程验证。

正式入口：[geo.tinywall.cc/geoquest/](https://geo.tinywall.cc/geoquest/)。部署配置与线上验收见 [Cloudflare 发布说明](docs/DEPLOYMENT.md)。

## 运行

使用 Node.js 22+ 和 pnpm：

```bash
pnpm install
pnpm dev
```

打开 `/topics/contour-rescue`（地形）、`/topics/earth-motion-lab`（地球与太阳）或 `/topics/loess-soil-water`（水土与流域），附加 `?mode=classroom` 进入课堂模式。

```bash
pnpm verify
pnpm test:e2e
pnpm preview
```

`verify` 执行内容、lint、类型、单元测试、构建和公开边界校验。AI 在开发任务中审查来源、模型、交互与画面，并留下版本对应的一份报告；不再要求八类人工签字，也不在学生网页调用 AI 服务。

## 项目资料

- [V2 重构方案与开源复用取舍](docs/REFACTOR_PLAN_V2.md)
- [当前项目约束](docs/PROJECT_CONSTRAINTS.md)
- [地形课堂 AI 审查记录](docs/reviews/terrain-classroom-v2.1.md)
- [地球与太阳 AI 教学模拟与审查](docs/reviews/earth-sun-v2.md)
- [水土与流域 AI 教学模拟与审查](docs/reviews/watershed-v2.md)
- [第三方许可说明](NOTICE.md)

旧规划、原始矩阵和代码保留用于历史对照，已归档主题不进入活动目录；生产构建仅收录审核通过的主题。源 manifest 的“已发布”表示进入生产构建，具体线上部署状态应以 Cloudflare 成功部署记录和公网验收为准。

## 原则与许可

模型与证据同源，优先自托管和离线操作；无账号、云端学习记录、统计或追踪。教材源文件、内部页码、凭据和未知许可素材不进入公开内容。

代码采用 [MIT](LICENSE)，原创教学内容与文档采用 [CC BY-NC-SA 4.0](LICENSE-CONTENT)，第三方材料遵循其各自许可。

新增课堂入口：`/topics/south-asia-monsoon?mode=classroom`（气候与农业）、`/topics/world-population-map?mode=classroom`（人口与区域）。试教问题与验收证据分别见 [农业报告](docs/reviews/agriculture-v2.md) 和 [人口报告](docs/reviews/population-v2.md)。

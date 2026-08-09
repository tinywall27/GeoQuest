# GeoQuest · 地理智探

> 从教材出发，探索真实世界。

GeoQuest 是一个教材驱动的初中地理互动探索平台。它把适合观察、比较、模拟、推理和决策的地理问题重新设计成公开主题页，既适合课堂投屏，也支持学生课后自主探索。

项目当前处于 V1 开发阶段。长期候选池包含 66 个主题，V1 聚焦 10 个主题和八类互动原型；候选不等于发布承诺，只有完成人工内容、地图、数据、版权、隐私和技术审核的主题才会标记为“已发布”。

## 产品入口

- 教材探索：从四册教材的知识脉络进入主题。
- 地图实验室：通过图层、空间分布和路线理解地理联系。
- 数据实验室：从表格、图表和时间变化中形成证据。
- 地球实验室：操纵变量，观察地球系统响应。
- 区域探索：比较区域条件、联系和发展选择。
- 地理挑战：在限制条件下完成任务并解释方案。

产品入口描述“从哪里发现主题”，互动原型描述“如何探索主题”，两者不会混用。

## V1 原则

- 每个主题遵循“核心问题 → 主要互动 → 证据产出 → 解释反思”。
- 每个主题只有一个主要操作对象，同时提供探索模式与课堂模式。
- 核心流程使用自托管数据快照，外部服务不可用时仍可完成。
- 无账号、无后台、无云端学习记录、无 AI、无统计、无 Cookie、无广告或追踪。
- 教材与课标源文件和内部页码只用于私下分析，不进入公开仓库或构建产物。
- 自动测试不替代人工教学、地图、数据和版权审核。

## 开发

需要当前 Node.js LTS 与 pnpm：

```bash
pnpm install
pnpm dev
```

提交前运行：

```bash
pnpm check:boundary
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

主题地址为 `/topics/:slug`；添加 `?mode=classroom` 使用同一内容进入课堂模式。Python 数据加工工具如后续加入，统一由 UV 管理。

## 文档

- [产品规划](docs/PRODUCT_PLAN.md)
- [V1 主题目录](docs/V1_TOPIC_CATALOG.md)
- [项目约束](docs/PROJECT_CONSTRAINTS.md)
- [架构说明](docs/ARCHITECTURE.md)
- [内容创作指南](docs/CONTENT_AUTHORING.md)
- [数据、地图与版权审核](docs/DATA_MAP_COPYRIGHT_REVIEW.md)
- [发布清单](docs/RELEASE_CHECKLIST.md)
- [路线图](docs/ROADMAP.md)
- [贡献指南](CONTRIBUTING.md)

## 许可与第三方材料

仓库中的软件代码采用 [MIT License](LICENSE)。项目原创教学内容与文档采用 [CC BY-NC-SA 4.0](LICENSE-CONTENT)。第三方数据、地图、媒体、字体和依赖继续适用各自许可；教材、课程标准及其他第三方作品不因出现在项目分析记录中而获得再授权。详见 [NOTICE](NOTICE.md)。

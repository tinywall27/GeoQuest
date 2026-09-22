# GeoQuest agent guide

This file applies to the whole repository. The normative product rules are in [`docs/PROJECT_CONSTRAINTS.md`](docs/PROJECT_CONSTRAINTS.md); do not duplicate or weaken them in local instructions.

## 教学设计与开发规则

以下规则依据《初中地理 AI 项目开发：提示词与约束》整理，适用于本仓库所有后续地理项目、独立页面及已有项目迭代，与上述产品约束共同执行。教学设计中的可选做法不放宽本项目免登录、无运行时 AI、隐私与离线要求。

### 开发前

- 优先级：学生安全与地理准确性 → 学习目标及学情适配 → 实施与维护成本 → 视觉和技术表现。以真实学习困难决定是否开发，不把动画、功能数量、课堂热闹或作品精美当作学习成效。
- 先用少量文字明确知识点、可观察的学习目标、学生起点与已观察卡点、课时与设备、教师组织方式、可复用成果、本轮交付范围，以及撤去帮助后的独立检验办法；再设计或实现。先做一个难点的最小可用版本，不默认扩张为全课程平台。
- 区分观察事实、推测原因和待验证假设，不把不动笔、起哄或拒绝参与一律解释为知识不会。仅询问影响设计的关键缺失条件；其他采用保守假设并标明，不重复询问已知信息。

### 任务、支架与交互

- 按当前任务表现提供支持，不给学生固定贴标签。尽量复用同一数据、模型和母版，调整提示、任务及评价要求；不要把基础支持/深入探究机械等同于课堂/探索显示模式。
- 基础支持以教师控制节奏、投屏配合纸笔和个人完成为起点，不默认分组或学生自由操作设备。先示范再同类练习，一次只改变一个关键条件，保持问法和界面稳定；按表现从完整示范、部分提示逐步过渡到独立完成，不要求一课撤完支架。
- 深入探究保留步骤和边界，围绕预测、对照、取证、解释与修订逐步增加自主性、证据复杂度和迁移要求；按需给方法提示，不直接代答。基础较好仍可需要支架，基础薄弱也不应永久停留在简单任务。先备知识稳固后才引入反常识对比或例外，不以陷阱制造难度。
- 每个按钮、动画和参数必须服务观察、预测、比较、记录、解释或修订；无法说明教学用途的功能优先删除。不默认开启音乐、密集动效、抢答、排行榜或无关奖励。
- 按目标选择直接教学、读图训练、短实验或项目式学习，不把所有活动称为 PBL。完整项目须有问题、证据、分析、方案与修改；情境应服务地理目标，不能止于海报展示或迎合兴趣。
- 教师负责事实与答案审核、课堂追问和最终判断。AI 可辅助开发、资料加工和反馈草拟，学生仍须完成读图、证据判断、推理与解释。

### 地理模型与学习证据

- 地图、数据、图表和答案须相互一致。真实数据注明来源、时间范围、单位和尺度；模拟、虚构或示意数据明确标识。涉及地图边界使用适用且可核验的权威底图，不让模型凭空补画，并遵守产品约束中的地图与许可要求。
- 关联平面图、三维地形与剖面由同一数据或一致计算规则生成。改变变量时说明保持不变的条件，避免自动缩放、比例尺或等高距变化误导判断，区分地理对象变化和表示方式变化。
- 说明参数含义、合理范围、模型规则、简化假设和适用边界；用已知情形和边界情况核验。模型演示不能冒充现实预测，相关不能直接写成因果；无法核验处列为待教师审核，不用视觉效果掩盖不确定性。
- 先定义目标达成的证据，再开发功能。按需设置少量诊断、课后独立作答和间隔后的等值检查，不增加过量测评；说明提示条件，区分照着做对、有提示完成和独立完成。证据记录遵守既有匿名结构化数据边界，不新增学生画像或自由文本持久化。
- 基础检查保持同类、同问法；迁移题不突然叠加多个新难点。深入任务可采用独立初稿、教师审核后的反馈、学生修改、独立解释，不能只评价最终作品。
- AI 反馈仅作教师审核草案，不直接用于最终评分、学生能力定性或心理判断。研究表述区分观察变化和因果归因，说明学生起点、课时及教学设计差异；不虚构数据、引用或“显著提升”，不把两校差异直接归因于 AI。

### 课堂责任与轻量交付

- 学习支架与课堂规则、行为管理、学校支持分别设计，不承诺有趣内容能解决持续失序；不公开羞辱或排名学生，不凭少量行为自动画像或诊断，也不忽视安静学生的需要。
- AI 限于教师备课与开发辅助，不要求学生注册或自由与模型聊天；不得向外部工具上传可识别学生的信息或敏感个案，公开学生作品先核实授权。不得以 AI 陪伴替代真实师生关系或专业支持；安全风险按学校流程转介，不由模型判定危险程度，也不将全部责任归于教师。
- 优先复用现有课件、简单页面、结构与资源，少依赖、教师易控制；非必要不重写或扩张功能。核心流程保持离线可用，按需提供静态或纸笔替代。
- 按本轮范围提供工具/材料、任务单、教师说明、评价题及依据、已知局限与修订记录，不强制每次生成全套课例包。成熟后建议另一位教师独立试用并依据真实反馈修订，不虚构试用结果。
- 交付同时检查地理准确性、学生下一步是否清楚、撤去帮助后如何检验、课堂组织负担，以及生成、核对、返工和维护总成本。明确已验证内容、待教师核验事项与教学局限；未经试教须明示，技术测试通过不等于教学有效。

## Working rules

- Keep the public repository free of textbook/standards source files, scans, internal page locators, private review evidence, machine paths, credentials, and unapproved map or media assets.
- Treat the legacy eight `reviews` fields as optional compatibility metadata. Published topics require a matching `aiReview` record and deterministic checks; never fabricate AI evidence or legal permission.
- Do not add accounts, cloud learning records, runtime AI endpoints, analytics, cookies, advertising, third-party tracking, or a runtime dependency on an external teaching API.
- Use pnpm for Node dependencies and scripts. Use UV for any Python environment or data-processing tool.
- Use an SSH GitHub remote for pushes. Stage explicit public paths, inspect the staged diff, and run the boundary check; do not use an indiscriminate initial `git add .`.
- Keep TypeScript strict, content build-time validated, theme/map/chart modules lazy-loaded, and classroom mode functional offline from the same snapshot as explore mode.
- Do not publish production source maps that embed authoring manifests, review fields, or internal build sources.
- Treat content, map, data, copyright, privacy, accessibility, and technical validation as separate checks. An AI check records evidence but cannot grant a license or replace a legal requirement.

## Before handing off a change

- Deploy all geography projects through this repository to the Git-integrated Cloudflare Pages project `geoquest-git`. Place standalone sources in `projects/<id>/`, integrate their output and scoped security headers in `scripts/prepare-projects.mjs`, and preserve existing public paths. Do not create a separate Worker or Pages project for a new geography project.
- When a new geography project goes live, update `portal/projects.json` with its verified public URL, description, and tags, rebuild the unified site, and verify its entry link after deployment. The root portal is maintained here; other repositories must include this integration in their release handoff. Never list planned projects as live.

Run the relevant subset of:

```text
pnpm check:boundary
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

For content changes, also run the content validator and verify both `/topics/:slug` and `/topics/:slug?mode=classroom`. For dependency or asset changes, record the source, license, attribution, and offline fallback before requesting review.

> 历史 V1 文档。2026-09-16 起，选题与发布审核以 [V2 重构方案](REFACTOR_PLAN_V2.md) 和 [项目约束](PROJECT_CONSTRAINTS.md) 为准；以下旧人工门禁和主题数量不再生效。

# GeoQuest 内容创作指南

## 1. 适用范围

本指南用于编写公开主题 YAML、MDX、交互说明和来源记录。精确教材/课标定位、源文件、页码、审核人身份和内部证据属于私下制作台账，不得复制到公开仓库、issue、PR 或构建产物。

## 2. 从问题开始

主题立项前先完成四段式契约：

1. **核心问题**：能提出假设，并可由页面内证据回答。
2. **主要互动**：围绕一个主操作对象进行连贯操作。
3. **证据产出**：地图、图表、对比表、标注、路线、情景结果或方案卡。
4. **解释反思**：说明证据适用范围、不确定性、替代解释或人地取舍。

核心问题不能只是“记住什么”；主互动不能同时堆叠五套玩法；反思不能要求网站保存自由文本。

## 3. 产品入口与原型

每个主题可以选择多个发现入口：`textbook-explorer`、`map-lab`、`data-lab`、`earth-lab`、`region-explorer`、`geo-challenge`。它只能选择一个主原型：

```text
simulator | map-explorer | story-map | data-explorer
image-explorer | compare | decision-lab | geo-challenge
```

不要使用旧版中文标签作为代码值，也不要把 D3、ECharts、Canvas 或 MapLibre 当作原型。

## 4. 建议目录

```text
content/topics/<slug>/
  manifest.yaml        # 公开、脱敏元数据
  index.mdx            # 原创教学叙事
  data/                # 裁剪后的快照及元数据
  assets/              # 仅已获准公开的自制/第三方资产

src/topics/            # 主题交互与可复用原型，由注册表按路由加载
```

如果工程采用生成注册表，生成文件不得手工编辑。待审核地图或媒体保存在公开仓库之外，不能仅靠路由隐藏。

## 5. Manifest 最小示例

以下示例只展示公开字段；以工程 schema 为最终可执行接口：

```yaml
id: GQ-T000
slug: example-topic
title: 示例主题
summary: 一句话说明学生将探索什么。
volume: G7A
chapter: 示例单元
channels:
  - earth-lab
prototype: simulator
competencies:
  - 综合思维
coreQuestion: 改变一个条件后，结果怎样变化，为什么？
status: 开发中
releaseBatch: backlog
classroomMinutes: 10
explorationMinutes: 18
modes:
  exploration:
    path: /topics/example-topic
  classroom:
    query: "?mode=classroom"
    sameContent: true
primaryInteraction:
  object: 一个受控变量模型
  action: 逐次改变变量并比较结果
  feedback: 即时更新数值、图形和解释提示
evidenceOutput:
  type: 情景结果
  description: 三组条件与结果的结构化比较
  persistsFreeText: false
reflectionPrompt: 哪项证据最能支持你的判断？这个模型忽略了什么？
hints:
  - 先只改变一个变量，再比较前后结果。
components:
  - VariablePanel
  - EvidencePanel
sources:
  - kind: simulation
    id: SIM-EXAMPLE
    title: 原创教学模型
    attribution: GeoQuest 原创
    method: 控制变量并计算归一化教学结果
    parameters:
      - 示例变量
    version: "0.1.0"
    limitations:
      - 仅用于理解关系，不提供真实预测。
    review:
      status: unreviewed
reviews:
  teaching: { status: unreviewed }
  curriculum: { status: unreviewed }
  textbook: { status: unreviewed }
  data: { status: unreviewed }
  map: { status: unreviewed }
  copyright: { status: unreviewed }
  privacy: { status: unreviewed }
  technical: { status: unreviewed }
version: "0.1.0"
updatedAt: 2026-08-09
```

不要在公开 manifest 中加入源文件名、内部页码、内部证据路径、本机路径、学生信息或未公开素材位置。

## 6. 双模式写作

### 探索模式

- 开场用一段话建立情境，不先公布结论。
- 把任务拆成 3—5 个可恢复步骤，每步说明操作和观察重点。
- 提示由轻到重：观察方向 → 比较建议 → 概念支架；不能直接替学生完成证据。
- 最后汇总结构化证据、来源、模型/数据局限和反思。

### 课堂模式

- 与探索模式共享事实、组件、快照和答案逻辑。
- 课堂主流程控制在 8—20 分钟，提供下一步、重置、结论显隐和全屏。
- 正文、图例和关键标注适合 1366×768 投屏；保留来源、审图信息和风险提示。
- 二维码只编码当前公开地址并在本机生成，不把浏览行为发送给第三方。

## 7. 反馈与证据

- 反馈解释“证据与判断如何对应”，避免只显示对/错或奖励动画。
- 决策类主题不强设唯一答案，应解释不同方案的收益、代价和适用条件。
- “相对稳妥”“教学情景”“模拟指数”等限定词必须与结果同屏出现。
- 证据卡使用枚举、数值、排序、选择、路线或标注。打印/JSON 导出不包含姓名、学校、位置或设备信息。
- 自由文本反思可供口头、纸笔或当前会话使用，但不写入 localStorage。

## 8. 数据、模拟与引用

- `reference` 用于事实依据，不假装有本地数据快照。
- `dataset` 必须有许可、版本、范围、获取日、署名、加工步骤、快照和 SHA-256。
- `map` 必须有来源、版本、审图信息、修改记录和地图审核状态。
- `media` 必须确认公开再发布和改编权，并使用准确署名。
- `simulation` 必须给出方法、参数、版本和局限，并显著标注“模拟/示例”。

教材只用于内部分析。公开文字必须原创转述，图形优先自制；不得展示扫描页、重排大段原文或复用教材插图。

## 9. 可访问性与降级

- 滑杆必须有数值输入或按钮；拖动地图必须有地点列表、方向按钮或数据表路径。
- 颜色以外增加形状、纹理、标签或文字；图表提供摘要和表格。
- 焦点可见且顺序符合步骤；错误提示可被辅助技术读取。
- 尊重减少动态偏好，避免自动播放高成本或闪烁动画。
- 写明 WebGL、外部请求或高带宽资源不可用时的替代路径。

## 10. 内容自检

进入“待审核”前确认：

- [ ] 标题、摘要、核心问题与年龄段清晰。
- [ ] 单一主对象、主题专属反馈、证据和反思完整。
- [ ] 探索 15—25 分钟、课堂 8—20 分钟均可完成。
- [ ] 来源按类型完整，示例/模拟/实测没有混淆。
- [ ] 公开文件已脱敏，无内部定位或机器路径。
- [ ] 键盘、减少动态、图表/地图替代和断网降级可用。
- [ ] 状态保持真实；没有用测试结果代替人工审核。

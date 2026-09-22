import type { LabDefinition, LabInput, LabResult } from './labTypes';

const verifiedAt = '2026-09-22';
const locationSource = { title: 'Transport and Location', publisher: 'Jean-Paul Rodrigue · The Geography of Transport Systems', url: 'https://transportgeography.org/contents/chapter2/transport-and-location/', verifiedAt };
const modesSource = { title: 'Distance, Modal Choice and Transport Cost', publisher: 'Jean-Paul Rodrigue · The Geography of Transport Systems', url: 'https://transportgeography.org/contents/chapter5/transportation-modes-modal-competition-modal-shift/distance-modal-choice-transport-cost/', verifiedAt };
const options = (labels: string[]) => labels.map((label, value) => ({ value, label }));
const metric = (label: string, value: number, unit: string) => ({ label, value, unit });

export const settlements = [
  { name: '甲地', slope: 2, water: 60, road: 1.5 },
  { name: '乙地', slope: 4, water: 100, road: 4 },
  { name: '丙地', slope: 9, water: 120, road: 0.5 },
];
export function settlementModel(input: LabInput) {
  const site = settlements[input.site ?? 0] ?? settlements[0]!;
  const demand = input.demand ?? 50;
  const shortage = Math.max(0, demand - site.water);
  return { site, demand, shortage, feasible: shortage === 0 && site.slope <= 5 };
}
function settlementEvaluate(input: LabInput): LabResult {
  const { site, demand, shortage, feasible } = settlementModel(input);
  return { metrics: [metric('地块坡度', site.slope, '°'), metric('供水能力', site.water, 'm³/日'), metric('日需水量', demand, 'm³/日'), metric('供水缺口', shortage, 'm³/日'), metric('连接道路距离', site.road, 'km')], message: `${site.name}${feasible ? '满足本题两项约束' : '不满足本题约束'}：${site.slope > 5 ? '坡度超过题设 5°；' : '坡度不超过题设 5°；'}${shortage > 0 ? `每日缺水 ${shortage} m³。` : '供水能力覆盖需求。'}${demand > 100 ? '本情景三地均不满足全部约束，不应强选一个地块。' : ''}满足约束后才比较接路距离；近路不能抵消缺水或坡度超限。这些是教学条件，不能据此断言现实地块安全。` };
}
function SettlementDiagram({ input }: { input: LabInput; result: LabResult }) {
  const { demand } = settlementModel(input);
  return <svg className="selected-figure" viewBox="0 0 600 260" role="img" aria-label="三个虚构地块的坡度、供水能力和接路距离；长条使用固定每立方米两像素比例">
    <text x="20" y="25">虚构候选地块 · 蓝条：供水，虚线：当前需水</text>
    {settlements.map((site, index) => <g key={site.name} transform={`translate(20 ${45 + index * 67})`}>
      <rect width="560" height="60" rx="8" fill={input.site === index ? '#e0f2e9' : '#f2f5f4'} />
      <text x="10" y="22">{site.name} · 坡度 {site.slope}°</text><text x="10" y="45">接路 {site.road} km</text>
      <rect x="205" y="16" width={site.water * 2} height="24" fill="#3986a3" />
      <line x1={205 + demand * 2} x2={205 + demand * 2} y1="5" y2="53" stroke="#9d4a29" strokeWidth="3" strokeDasharray="4 3" />
      <text x="460" y="32">{site.water} m³/日</text>
    </g>)}
  </svg>;
}

export const polarSites = [
  { name: '甲点', distance: 20, wind: 12, fixed: 20000 },
  { name: '乙点', distance: 60, wind: 7, fixed: 15000 },
  { name: '丙点', distance: 120, wind: 5, fixed: 10000 },
];
export function polarModel(input: LabInput) {
  const site = polarSites[input.site ?? 0] ?? polarSites[0]!;
  const cargo = input.cargo ?? 10;
  const wind = site.wind + (input.windExtra ?? 0);
  const freight = site.distance * cargo * 8;
  return { site, cargo, wind, freight, total: freight + site.fixed, feasible: wind <= 14 };
}
function polarEvaluate(input: LabInput): LabResult {
  const { site, cargo, wind, freight, total, feasible } = polarModel(input);
  return { metrics: [metric('单程补给距离', site.distance, 'km'), metric('补给质量', cargo, 't'), metric('题设风速', wind, 'm/s'), metric('单次运费', freight, '元'), metric('设置与单次补给合计', total, '元')], message: `${site.name}${feasible ? '满足题设设备风速不超过 14 m/s 的条件' : '超过题设设备风速 14 m/s，不纳入此次候选'}。合计 = 设置费 ${site.fixed} 元 + ${cargo} t × ${site.distance} km × 8 元/(t·km)。近补给点不必然合计最少；低风速也不能代表完整的现实安全评估。` };
}
function PolarDiagram({ input }: { input: LabInput; result: LabResult }) {
  return <svg className="selected-figure" viewBox="0 0 600 275" role="img" aria-label="虚构补给节点到三个候选点的距离及题设风况，不是真实极地地图">
    <text x="20" y="25">虚构补给网络 · 连线长度不代表地理距离</text>
    <rect x="15" y="105" width="95" height="45" rx="8" fill="#dcebf3" /><text x="25" y="133">补给节点</text>
    {polarSites.map((site, index) => <g key={site.name}>
      <line x1="110" y1="127" x2="305" y2={65 + index * 80} stroke="#3986a3" strokeWidth="2" />
      <text x="175" y={62 + index * 82}>{site.distance} km</text>
      <rect x="305" y={38 + index * 80} width="275" height="65" rx="8" fill={input.site === index ? '#e0f2e9' : '#f2f5f4'} />
      <text x="320" y={62 + index * 80}>{site.name} · 风速 {site.wind + (input.windExtra ?? 0)} m/s</text>
      <text x="320" y={86 + index * 80}>设置费 {site.fixed} 元</text>
    </g>)}
  </svg>;
}

export const factories = [
  { name: '甲厂址', rawDistance: 10, marketDistance: 90, capacity: 20 },
  { name: '乙厂址', rawDistance: 50, marketDistance: 50, capacity: 12 },
  { name: '丙厂址', rawDistance: 90, marketDistance: 10, capacity: 20 },
];
export function factoryModel(input: LabInput) {
  const site = factories[input.site ?? 0] ?? factories[0]!;
  const output = input.output ?? 10;
  const ratio = input.ratio ?? 3;
  const raw = output * ratio;
  const inbound = raw * site.rawDistance * 0.5;
  const outbound = output * site.marketDistance * 0.5;
  return { site, output, raw, inbound, outbound, total: inbound + outbound, feasible: output <= site.capacity };
}
function factoryEvaluate(input: LabInput): LabResult {
  const { site, output, raw, inbound, outbound, total, feasible } = factoryModel(input);
  return { metrics: [metric('计划日产成品', output, 't/日'), metric('日运入原料', raw, 't/日'), metric('产能上限', site.capacity, 't/日'), metric('原料日运费', inbound, '元/日'), metric('成品日运费', outbound, '元/日'), metric('合计日运费', total, '元/日')], message: `${site.name}${feasible ? '满足产能约束，可以参与运费比较' : '产能不足，先排除，运费低也不能补偿'}。两段运费各按质量 × 距离 × 0.5 元/(t·km)计算。${input.ratio === 1 ? '本情景原料与成品等重、各点总运距同为 100 km，满足产能者费用并列。' : ''}固定产量比较原料系数时，较重的一端对运费影响更大；只在本题条件下比较，不等于现实工厂最佳选址。` };
}
function FactoryDiagram({ input }: { input: LabInput; result: LabResult }) {
  const { raw, output } = factoryModel(input);
  return <svg className="selected-figure" viewBox="0 0 600 290" role="img" aria-label="原料地至三个虚构厂址再至市场的运输距离及产能，图示不按地理比例">
    <text x="20" y="25">每日运入 {raw} t 原料 → 厂址 → 运出 {output} t 成品</text>
    {factories.map((site, index) => <g key={site.name} transform={`translate(20 ${42 + index * 80})`}>
      <rect width="560" height="69" rx="8" fill={input.site === index ? '#e0f2e9' : '#f2f5f4'} />
      <text x="12" y="38">原料地</text><line x1="75" x2="220" y1="37" y2="37" stroke="#3986a3" />
      <text x="106" y="26">{site.rawDistance} km</text><text x="225" y="30">{site.name}</text>
      <text x="215" y="54">产能 {site.capacity} t/日</text><line x1="333" x2="465" y1="37" y2="37" stroke="#9d4a29" />
      <text x="365" y="26">{site.marketDistance} km</text><text x="485" y="38">市场</text>
    </g>)}
  </svg>;
}

export const routes = [
  { name: '公路方案', hours: 12, capacity: 10, fixed: 180, rate: 0.8 },
  { name: '铁路方案', hours: 20, capacity: 30, fixed: 500, rate: 0.3 },
  { name: '水运方案', hours: 48, capacity: 50, fixed: 300, rate: 0.12 },
];
export function routeModel(input: LabInput) {
  const route = routes[input.route ?? 0] ?? routes[0]!;
  const cargo = input.cargo ?? 5;
  const deadline = input.deadline ?? 24;
  const total = route.fixed + cargo * 600 * route.rate;
  return { route, cargo, deadline, total, feasible: cargo <= route.capacity && route.hours <= deadline };
}
function routeEvaluate(input: LabInput): LabResult {
  const { route, cargo, deadline, total, feasible } = routeModel(input);
  const eligible = routes.flatMap((_, index) => { const candidate = routeModel({ ...input, route: index }); return candidate.feasible ? [candidate] : []; });
  const cheapest = eligible.reduce<ReturnType<typeof routeModel> | undefined>((best, current) => !best || current.total < best.total ? current : best, undefined);
  return { metrics: [metric('本批货物', cargo, 't'), metric('题设单批载量上限', route.capacity, 't'), metric('全程用时', route.hours, '小时'), metric('交付时限', deadline, '小时'), metric('本批费用', total, '元')], message: `${route.name}${feasible ? '满足本题载量和时限条件' : '不满足本题条件'}：${cargo > route.capacity ? '货物超出单批载量；' : '载量足够；'}${route.hours > deadline ? '超过时限。' : '可以按时到达。'}${cheapest ? `可行方案中，${cheapest.route.name}的题设费用最低，为 ${cheapest.total} 元。` : '三种方案均不可行，应调整条件或收集新方案，不能硬选最低价。'}本方案费用 = ${route.fixed} 元 + ${cargo} t × 600 km × ${route.rate} 元/(t·km)；每条路线均按 600 km，不拆批、不加班次。` };
}
function RouteDiagram({ input }: { input: LabInput; result: LabResult }) {
  const { deadline } = routeModel(input);
  return <svg className="selected-figure" viewBox="0 0 600 260" role="img" aria-label="三种虚构运输方案用时，固定零至七十二小时轴；虚线为交付时限">
    <text x="20" y="25">虚构等距运输 · 条长表示全程小时数</text>
    {routes.map((route, index) => <g key={route.name} transform={`translate(20 ${50 + index * 57})`}>
      <text y="20">{route.name}</text><rect x="110" y="3" width={route.hours * 5} height="25" fill={input.route === index ? '#287455' : '#7aa6b6'} />
      <text x={120 + route.hours * 5} y="21">{route.hours} h · 上限 {route.capacity} t</text>
    </g>)}
    <line x1={130 + deadline * 5} x2={130 + deadline * 5} y1="42" y2="222" stroke="#9d4a29" strokeDasharray="5 4" strokeWidth="2" />
    <line x1="130" x2="490" y1="226" y2="226" stroke="#52676a" />
    {[0, 24, 48, 72].map((hour) => <text key={hour} x={126 + hour * 5} y="248">{hour} h</text>)}
  </svg>;
}

export const decisionLabs: LabDefinition[] = [
  {
    id: 'GQ-T010', slug: 'settlement-location', title: '聚落选址：先查条件再比较', volume: 'G7A', chapter: '聚落与环境',
    question: '离道路最近的地块，一定适合本题聚落吗？', goal: '根据坡度、供水与需求排除不合条件的地块，再用接路距离解释选择。', prerequisites: '会比较大小和计算差值；已知聚落受地形、水源与交通等因素影响。未获得真实学生诊断，卡点暂设为只看一个便利条件。', misconception: '把离路近视为万能优势，或把教学坡度阈值理解为现实建设安全线。',
    steps: ['先圈出坡度 ≤5°、供水 ≥需求两项题设约束，在纸上判断甲乙丙。', '只把日需水由 50 改为 80 m³，其他条件不动，记录哪个地块失去资格及缺口。', '在仍符合约束的地块中比较接路距离；遮住示范后完成独立题。'],
    example: '50 m³/日时甲、乙都满足条件，甲接路 1.5 km，乙 4 km；丙虽只需接路 0.5 km，但坡度 9° 超限。日需水改到 80 后，甲缺 20 m³/日，乙成为本题唯一可行地块。',
    transfer: '若新增地块供水 90 m³/日、坡度 3°、接路 2 km，需求仍为 80，写出两项资格判断及它与乙的取舍；不要增加题目没有提供的安全结论。',
    controls: [{ key: 'site', label: '候选地块', options: options(settlements.map(s => s.name)) }, { key: 'demand', label: '日需水量（m³/日）', options: [50, 80, 110].map(value => ({ value, label: `${value}` })) }],
    defaults: { site: 0, demand: 50 }, comparison: { label: '只把需水改为 80 m³/日', input: { site: 0, demand: 80 } }, evaluate: settlementEvaluate, Diagram: SettlementDiagram,
    questions: [
      { prompt: '新地块坡度 4°、供水 70 m³/日、需求 90 m³/日。本题应如何判断？', options: ['坡度合格就可选', '缺水 20 m³/日，先排除', '缺水 160 m³/日'], correct: 1, explanation: '70 < 90，缺口为 90−70=20；同时满足全部约束才可参与比较。' },
      { prompt: '需求 60；丁地坡度 3°、供水 80、接路 3 km，戊地坡度 4°、供水 70、接路 1 km。只按本题规则选谁？', options: ['丁，因为水越多必然越好', '无法比较任何条件', '两地均合格，戊接路更短'], correct: 2, explanation: '两地坡度与供水均合格；在本题唯一后续比较指标接路距离上，戊更短。不是现实综合规划结论。' },
    ],
    method: '15 分钟教师投屏＋纸笔：3 分钟读条件，4 分钟示范，4 分钟单变量对照，4 分钟独立判断。供水条共用固定尺度，无真实地图。',
    limitations: ['全部地块与数据为原创虚构；5° 为题设筛选条件，不是工程规范。', '未模拟水质、季节变化、土地权属、灾害与生态因素；不能据此判断现实选址安全。', '已进行开发者模拟试讲与算例核对，未经真实课堂试教；教师须核对教材术语及学生读数起点。'], sources: [locationSource],
  },
  {
    id: 'GQ-T025', slug: 'polar-station', title: '极地科考站：补给与风况的取舍', volume: 'G7B', chapter: '极地地区',
    question: '补给最近的候选点，为什么不一定是本题合适的建站地点？', goal: '区分设备风况约束与费用比较，用补给质量和距离解释运费变化。', prerequisites: '会用质量×距离×费率计算；知道极地活动需要补给。卡点“只找最近点”为待课堂验证假设。', misconception: '把题设风速上限当作通用施工安全标准，或把较低风速等同现实安全。',
    steps: ['固定补给 10 t，逐点核对风速是否不超过题设 14 m/s，再算设置费与运费。', '只把补给质量增至 20 t，保持距离、风速、费率不变，比较甲乙排序。', '恢复 10 t 后只增加题设风速 5 m/s，先排除超限点，再纸笔解释取舍。'],
    example: '10 t 时甲合计 20000+10×20×8=21600 元，乙为 19800 元，乙较低；20 t 时甲为 23200 元，乙为 24600 元，甲较低。改变的是补给质量，不是位置。',
    transfer: '新点设置费 18000 元，距离 30 km，题设风速 10 m/s。补给 10 t 时先算费用，再与乙比较；写出还不能判断现实建站可行性的一个缺失条件。',
    controls: [{ key: 'site', label: '候选点', options: options(polarSites.map(s => s.name)) }, { key: 'cargo', label: '单次补给（t）', options: [5, 10, 20].map(value => ({ value, label: `${value}` })) }, { key: 'windExtra', label: '题设各点风速增量（m/s）', options: [0, 5].map(value => ({ value, label: `+${value}` })) }],
    defaults: { site: 0, cargo: 10, windExtra: 0 }, comparison: { label: '只把补给改为 20 t', input: { site: 0, cargo: 20, windExtra: 0 } }, evaluate: polarEvaluate, Diagram: PolarDiagram,
    questions: [
      { prompt: '某虚构点距离 40 km，补给 5 t，费率 8 元/(t·km)。单次运费是多少？', options: ['1600 元', '320 元', '16000 元'], correct: 0, explanation: '40×5×8=1600 元；这里只求运费，不加入未给出的设置费。' },
      { prompt: '题设设备只允许风速 ≤14 m/s。新点风速 16 m/s，但费用最低，应如何做？', options: ['费用最低就采用', '先排除；低费不能抵消设备约束', '宣布该地现实中永远不能建站'], correct: 1, explanation: '不满足本题设备约束就退出此次比较；不能外推为真实地点的永久结论。' },
    ],
    method: '15 分钟教师投屏＋纸笔，先算一个点再同类比较。三点同属虚构极地情景，节点不对应南北极真实站位；补给同一批次、同一费率。',
    limitations: ['数值均为虚构教学值，14 m/s 仅是题设设备条件，不是现实极地安全限值。', '省略海冰、地基、生态影响、许可、科学目标和全年保障；真实考察须专业评估。', '风速增量用于单变量对照，不是极地天气预报；未经真实课堂试教。'],
    sources: [{ title: 'Antarctic fieldwork planning', publisher: 'British Antarctic Survey', url: 'https://www.bas.ac.uk/science/opportunities-for-polar-fieldwork/antarctic-fieldwork-planning/', verifiedAt }, { title: 'Wind in Antarctica', publisher: 'British Antarctic Survey', url: 'https://legacy.bas.ac.uk/about_antarctica/geography/weather/wind.php', verifiedAt }],
  },
  {
    id: 'GQ-T048', slug: 'factory-location', title: '工业区位：哪一段运输更关键', volume: 'G8A', chapter: '工业',
    question: '运入原料比运出成品重时，靠近哪一端能减少本题运费？', goal: '分别计算原料和成品运输费用，排除产能不足候选，用两段数据解释区位选择。', prerequisites: '会读运输示意图、做乘法；了解原料到工厂再到市场的流程。暂设学生易漏算成品运出环节，待教师诊断。', misconception: '只算原料或成品一段；把本题最低运费直接当作所有工厂的最佳区位。',
    steps: ['产量固定 10 t/日、原料系数 3，先验产能，再分别计算两段费用。', '只把原料系数改为 1，记录三个厂址费用是否仍有差别。', '恢复系数 3，只把产量提高到 15 t/日，先排除产能不足者再比较。'],
    example: '每产 1 t 成品需 3 t 原料。甲日产 10 t 时原料 30 t，运入费 30×10×0.5=150 元，运出费 10×90×0.5=450 元，合计 600 元/日。乙合计 1000，丙 1400 元/日。',
    transfer: '新情景每日原料和成品都为 8 t，候选点两段距离分别为 20/80 km 与 70/30 km，产能均足够。比较运费并说明还需收集哪些非运输资料。',
    controls: [{ key: 'site', label: '候选厂址', options: options(factories.map(s => s.name)) }, { key: 'ratio', label: '每吨成品需原料（t）', options: [1, 3].map(value => ({ value, label: `${value}` })) }, { key: 'output', label: '计划日产成品（t/日）', options: [5, 10, 15].map(value => ({ value, label: `${value}` })) }],
    defaults: { site: 0, ratio: 3, output: 10 }, comparison: { label: '只把原料系数改为 1', input: { site: 0, ratio: 1, output: 10 } }, evaluate: factoryEvaluate, Diagram: FactoryDiagram,
    questions: [
      { prompt: '日产成品 8 t，需原料 16 t。原料段 20 km，成品段 80 km，统一费率 0.5 元/(t·km)。合计日运费？', options: ['160 元', '320 元', '480 元'], correct: 2, explanation: '原料费 16×20×0.5=160；成品费 8×80×0.5=320；合计 480 元/日。' },
      { prompt: '计划日产 14 t，候选厂址运费最低，但产能只有 12 t/日。下一步？', options: ['先排除该厂址，再比较满足产能者', '最低价可以抵消产能差额', '把产能与费用加成总分即可'], correct: 0, explanation: '14>12，不满足产能；不能用不同单位的任意加权分掩盖硬约束。' },
    ],
    method: '15 分钟投屏纸笔，以两段费用分栏记录，最后遮住算式作答。统一运价，固定单原料地、单市场和候选距离，不按示意线长量距。',
    limitations: ['所有厂址和数值为虚构，原料损耗/副产品处理未展开。', '省略劳动、能源、地价、环保和政策；最低运输费不是现实综合最优。', '已核对算例与产能边界，未经真实课堂试教。'], sources: [locationSource],
  },
  {
    id: 'GQ-T049', slug: 'china-route-designer', title: '运输方案：便宜也要能按时送到', volume: 'G8A', chapter: '交通运输',
    question: '最低费用方案为什么可能不能交付这批货物？', goal: '用载量与时限筛选方案，再比较可行方案费用，能解释没有可行方案的情况。', prerequisites: '会读时长、质量和费用表，理解“≤”。暂设卡点为先看价格后忽略时限，待教师核实。', misconception: '认定一种运输方式永远最好；把虚构费用和载量误认为现实线路报价与运力。',
    steps: ['固定 5 t 与 24 小时时限，先查单批载量与全程用时，在纸上排除超限者。', '只把时限改为 72 小时，重新筛选，再比较总费用。', '保持 72 小时只增加货物到 40 t，说明可行方案为何改变；随后独立作答。'],
    example: '5 t、24 小时时，公路 2580 元且 12 小时，铁路 1400 元且 20 小时；水运虽只要 660 元，却需 48 小时，应先排除。可行方案中铁路费用最低。',
    transfer: '把时限收紧至 16 小时、货物增至 15 t，判断是否存在可行方案。若没有，写出一项需要重新协商的条件，而不是硬选最低价。',
    controls: [{ key: 'route', label: '运输方案', options: options(routes.map(r => r.name)) }, { key: 'cargo', label: '本批货物（t）', options: [5, 15, 40].map(value => ({ value, label: `${value}` })) }, { key: 'deadline', label: '交付时限（小时）', options: [16, 24, 72].map(value => ({ value, label: `${value}` })) }],
    defaults: { route: 1, cargo: 5, deadline: 24 }, comparison: { label: '只把时限放宽到 72 小时', input: { route: 1, cargo: 5, deadline: 72 } }, evaluate: routeEvaluate, Diagram: RouteDiagram,
    questions: [
      { prompt: '货物 12 t，时限 24 小时。公路上限 10 t/12小时；铁路 30 t/20小时；水运 50 t/48小时。哪项可行？', options: ['公路', '铁路', '水运'], correct: 1, explanation: '公路超载，水运超时；铁路同时满足载量与时限。数值为本题条件。' },
      { prompt: '一条新方案固定费 200 元，距离 100 km，货物 4 t，费率 0.5 元/(t·km)。总费用？', options: ['200 元', '600 元', '400 元'], correct: 2, explanation: '200+100×4×0.5=400 元；固定费用只加一次。费用算出后仍须检查时限与载量。' },
    ],
    method: '15 分钟教师投屏＋纸笔；示范一行、提示一行、独立一行。三条虚构方案均为 600 km，全程用时含装卸等待，时间轴固定 0–72 小时。',
    limitations: ['无真实中国线路或地图，所有费用、载量和时间均为题设值，不可用于出行或物流报价。', '假定每种方案单批发运，不拆批、不增车辆，未模拟班次、天气和线路可达性。', '模型只比较本题可行方案费用，不概括各运输方式的一般运力；未经真实课堂试教。'], sources: [modesSource],
  },
];

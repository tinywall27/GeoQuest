import { useId } from 'react';
import type { LabDefinition, LabInput, LabResult } from './labTypes';

const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value ?? fallback : fallback));

// A supplied cloud-base threshold, not a forecast of rainfall or temperature.
export function mountainModel(input: LabInput) {
  const summit = bounded(input.summit, 2000, 0, 2500);
  const cloudBase = bounded(input.cloudBase, 1500, 0, 2500);
  const wind = input.wind === -1 ? -1 : 1;
  return { summit, cloudBase, wind, saturatedRise: Math.max(0, summit - cloudBase), windward: wind === 1 ? '西坡' : '东坡', leeward: wind === 1 ? '东坡' : '西坡' };
}

export function transferModel(input: LabInput) {
  const supply = bounded(input.supply, 100, 0, 120);
  const reserve = bounded(input.reserve, 40, 0, 80);
  const request = bounded(input.request, 60, 0, 80);
  const diverted = Math.min(request, Math.max(0, supply - reserve));
  const loss = diverted * 0.1;
  const delivered = diverted - loss;
  return { supply, reserve, request, diverted, loss, delivered, retained: supply - diverted,
    ecologicalShortfall: Math.max(0, reserve - (supply - diverted)), deficit: Math.max(0, 50 - delivered), surplus: Math.max(0, delivered - 50) };
}

export function karezModel(input: LabInput) {
  const recharge = bounded(input.recharge, 100, 0, 120);
  const covered = input.covered !== 0;
  const drop = bounded(input.drop, 10, 0, 10);
  // No pumping or stored-water depletion: same-period renewable water only.
  const collected = drop > 0 ? Math.min(80, Math.max(0, recharge - 20)) : 0;
  const evaporation = collected * (covered ? 0.05 : 0.2);
  const delivered = collected - evaporation;
  return { recharge, covered, drop, collected, evaporation, delivered,
    retained: recharge - collected, reserveShortfall: Math.max(0, 20 - recharge), deficit: Math.max(0, 50 - delivered) };
}

function MountainDiagram({ input }: { input: LabInput; result: LabResult }) {
  const arrowId = useId();
  const m = mountainModel(input);
  const y = (height: number) => 275 - height * 0.08;
  const summitY = y(m.summit);
  const cloudY = y(m.cloudBase);
  const left = m.wind === 1;
  return <svg className="selected-figure" viewBox="0 0 720 350" role="img" aria-label={`山地剖面示意：${m.windward}迎风，${m.leeward}背风；山顶${m.summit}米，设定凝结高度${m.cloudBase}米。`}>
    <defs>
      <marker id={`${arrowId}-rise`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#146d96" /></marker>
      <marker id={`${arrowId}-descend`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#98501b" /></marker>
    </defs>
    <rect width="720" height="350" fill="#eef6f9" />
    <path d={`M80 275 L360 ${summitY} L640 275 Z`} fill="#bad2b4" stroke="#426751" strokeWidth="3" />
    {[0, 1000, 2000, 2500].map(height => <g key={height}><line x1="50" x2="65" y1={y(height)} y2={y(height)} stroke="#334155" /><text x="8" y={y(height) + 5} fontSize="14">{height}</text></g>)}
    <text x="8" y="35" fontSize="14">高度/m</text>
    <line x1="65" x2="65" y1="65" y2="275" stroke="#334155" />
    <line x1="80" x2="640" y1={cloudY} y2={cloudY} stroke="#64748b" strokeDasharray="8 5" />
    <text x="445" y={cloudY - 12} fontSize="15">设定凝结高度 {m.cloudBase} m</text>
    <text x="278" y={summitY - 14} fontSize="16">山顶 {m.summit} m</text>
    <path d={left ? `M150 255 L320 ${summitY + 10}` : `M570 255 L400 ${summitY + 10}`} stroke="#146d96" fill="none" strokeWidth="5" markerEnd={`url(#${arrowId}-rise)`} />
    <path d={left ? `M400 ${summitY + 10} L570 255` : `M320 ${summitY + 10} L150 255`} stroke="#98501b" fill="none" strokeWidth="5" markerEnd={`url(#${arrowId}-descend)`} />
    <text x={left ? 110 : 450} y="310" fontSize="18">{m.windward}：迎风抬升</text>
    <text x={left ? 450 : 110} y="335" fontSize="18">{m.leeward}：背风下沉</text>
    <text x="235" y="35" fontSize="18">来风方向：{left ? '西 → 东' : '东 → 西'}</text>
    <text x="270" y="260" fontSize="14">剖面示意，水平距离不计</text>
  </svg>;
}

function TransferDiagram({ input }: { input: LabInput; result: LabResult }) {
  const m = transferModel(input);
  return <svg className="selected-figure" viewBox="0 0 720 340" role="img" aria-label={`同一期模拟水账：来水${m.supply}，留水${m.retained}，取水${m.diverted}，损耗${m.loss}，到水${m.delivered}万立方米。`}>
    <rect width="720" height="340" fill="#f0f7fa" />
    <text x="25" y="32" fontSize="18">同一期水账 · 单位：万 m³ · 虚构流域</text>
    <rect x="25" y="70" width="180" height="95" rx="12" fill="#b8dbe9" />
    <text x="45" y="106" fontSize="18">调出区来水 {m.supply}</text>
    <text x="45" y="140" fontSize="17">留在原流域 {m.retained}</text>
    <path d="M205 115 H305 M291 105 L305 115 L291 125 M480 115 H540 M526 105 L540 115 L526 125" fill="none" stroke="#226687" strokeWidth="4" />
    <rect x="307" y="70" width="170" height="95" rx="12" fill="#d6e9d4" />
    <text x="324" y="106" fontSize="18">实际调出 {m.diverted}</text>
    <text x="324" y="140" fontSize="17">途中损耗 {m.loss.toFixed(1)}</text>
    <rect x="542" y="70" width="155" height="95" rx="12" fill="#f3e1b9" />
    <text x="555" y="106" fontSize="18">到水 {m.delivered.toFixed(1)}</text>
    <text x="555" y="140" fontSize="17">需求 50</text>
    <text x="30" y="215" fontSize="18">来水 {m.supply} = 留水 {m.retained} + 途中损耗 {m.loss.toFixed(1)} + 到水 {m.delivered.toFixed(1)}</text>
    <text x="30" y="255" fontSize="17">原流域生态留水底线 {m.reserve}；未满足量 {m.ecologicalShortfall}</text>
    <text x="30" y="295" fontSize="17">受水区缺口 {m.deficit.toFixed(1)}；超过本期需求 {m.surplus.toFixed(1)}</text>
  </svg>;
}

function KarezDiagram({ input }: { input: LabInput; result: LabResult }) {
  const m = karezModel(input);
  const outletY = 165 + m.drop * 5;
  return <svg className="selected-figure" viewBox="0 0 720 360" role="img" aria-label={`坎儿井自流剖面示意：入口水位100米，出口${100 - m.drop}米，${m.drop > 0 ? '有自流落差' : '无自流落差'}；到水${m.delivered}万立方米。`}>
    <rect width="720" height="360" fill="#eef6f9" />
    <path d={m.covered ? `M30 90 L200 120 L575 ${outletY} H700 V265 H30 Z` : `M30 90 L105 165 L575 ${outletY} H700 V265 H30 Z`} fill="#e3d2b2" />
    <text x="30" y="32" fontSize="17">原创自流剖面示意 · 高差夸大 · 不按比例</text>
    <ellipse cx="95" cy="165" rx="62" ry="26" fill="#96cee3" />
    <path d={`M105 165 L575 ${outletY}`} stroke="#1479a7" strokeWidth="8" fill="none" />
    {m.covered && [200, 300, 400].map(x => <line key={x} x1={x} x2={x} y1={120 + (x - 200) / 375 * (outletY - 120)} y2={165 + (x - 105) / 470 * (outletY - 165)} stroke="#716657" strokeWidth="10" />)}
    <text x="32" y="80" fontSize="16">入口水位 100 m</text>
    <text x="470" y="80" fontSize="16">出口 {100 - m.drop} m</text>
    <text x="240" y="110" fontSize="16">{m.covered ? '竖井供施工维护' : '明渠对照：移去遮盖'}</text>
    <text x="240" y="250" fontSize="16">{m.covered ? '暗渠' : '明渠'}：水靠落差流动，不靠竖井抽水</text>
    <text x="30" y="296" fontSize="17">补给 {m.recharge} = 留存 {m.retained} + 蒸发 {m.evaporation.toFixed(1)} + 到水 {m.delivered.toFixed(1)}</text>
    <text x="30" y="330" fontSize="16">单位：万 m³/本期；{m.drop > 0 ? '本模型自流条件满足' : '无落差，且不设水泵，本模型停止取水'}</text>
  </svg>;
}

const verifiedAt = '2026-09-22';
export const processLabs: LabDefinition[] = [
  {
    id: 'GQ-T014', slug: 'mountain-rain-shadow', title: '山脉两侧，哪里更容易下雨？', volume: 'G7A', chapter: '天气与气候',
    question: '保持山高和来流湿度条件不变，只改变风向，迎风坡和背风坡怎样变化？',
    goal: '能按风向辨认迎风坡，用抬升—冷却—凝结解释降水条件，并计算给定凝结高度以上的抬升高度。',
    prerequisites: '已会读东西方向与米为单位的海拔；学生是否误把西坡固定当迎风坡尚待教师诊断。按15分钟教师投屏、学生纸笔作答设计。',
    misconception: '迎风坡不是固定的东坡或西坡；空气达到凝结条件不等于一定产生可测降雨，更不能由山高直接算年降水量。',
    steps: [
      '0—4分钟示范：西风、山顶2000 m、设定凝结高度1500 m。沿西坡描出抬升路径，写出2000−1500=500 m，并口述冷却和凝结条件。',
      '4—10分钟同类练习：保持高度不变，只把风改为东风。先独立预测哪坡迎风，再切换核对；需要时只提示“先找风从哪里来”，不直接报坡名。',
      '10—15分钟独立检验：遮住示范与指标，完成两道固定题并解释迎风坡判定。保留学生纸笔初稿；教师区分有提示与独立完成，下一课用同问法换高度复查。',
    ],
    example: '设定西风、山顶2000 m、凝结高度1500 m：西坡迎风，达到凝结高度后继续抬升500 m；这个500 m是高度差，不是500 mm降水。',
    transfer: '把风向改为东风而保持高度不变，要求学生解释为什么迎风坡换边、500 m高度差却不变。',
    controls: [
      { key: 'wind', label: '来风方向', options: [{ value: 1, label: '西风（西→东）' }, { value: -1, label: '东风（东→西）' }] },
      { key: 'summit', label: '山顶高度', options: [{ value: 1000, label: '1000 m' }, { value: 2000, label: '2000 m' }] },
      { key: 'cloudBase', label: '给定凝结高度（非预测）', options: [{ value: 500, label: '500 m' }, { value: 1500, label: '1500 m' }] },
    ],
    defaults: { wind: 1, summit: 2000, cloudBase: 1500 },
    comparison: { label: '只改变风向：东风', input: { wind: -1, summit: 2000, cloudBase: 1500 } },
    evaluate: input => {
      const m = mountainModel(input);
      return { metrics: [{ label: '山顶高度', value: m.summit, unit: 'm' }, { label: '给定凝结高度', value: m.cloudBase, unit: 'm' }, { label: '凝结高度以上抬升', value: m.saturatedRise, unit: 'm' }],
        message: `${m.windward}迎风，${m.leeward}背风。${m.saturatedRise > 0 ? '在来流含水汽且被迫越山的简化条件下，迎风上升段进入设定凝结层；有利于成云降水。' : '山顶未超过给定凝结高度，本模型不能据此判定地形雨形成。'}背风下沉增温通常不利于凝结；这里不计算实际雨量。` };
    },
    Diagram: MountainDiagram,
    questions: [
      { prompt: '不操作界面：西风，山顶2000 m，凝结高度1500 m。哪一项正确？', options: ['东坡迎风，降水500 mm', '西坡迎风，凝结高度以上抬升500 m', '西坡迎风，凝结高度以上抬升3500 m'], correct: 1, explanation: '风从西侧来，西坡迎风；2000−1500=500 m。高度差不能当雨量。' },
      { prompt: '等值迁移：仍为西风，山顶1000 m，给定凝结高度500 m。凝结高度以上还抬升多少？', options: ['500 m', '1500 m', '500 mm降水'], correct: 0, explanation: '1000−500=500 m，问法和计算规则相同；不能推导实际降水量。' },
    ],
    method: '固定0—2500 m纵轴；剖面原创且水平距离不计。凝结高度作为题设输入，超过它的抬升=max(0,山顶−凝结高度)。只表示湿润来流越山的原理，不建立降水量方程。',
    limitations: ['没有计算湿度、稳定度、风速、气温递减率和降水效率；不能作天气预测。', '迎风多雨、背风少雨是特定来流条件下的常见现象，不是每座山、每次天气都成立。', '已完成开发者模拟试讲走读，尚无真实师生试教；先备知识与15分钟时长须由教师核验。'],
    sources: [{ title: 'What do leeward and windward mean?', publisher: 'NOAA Ocean Service', url: 'https://oceanservice.noaa.gov/facts/windward-leeward.html', verifiedAt }],
  },
  {
    id: 'GQ-T044', slug: 'water-transfer', title: '跨流域调水：能调多少水？', volume: 'G8A', chapter: '中国的自然资源',
    question: '调出区必须留足生态用水，输水又有损耗，申请的水一定能够送到吗？',
    goal: '独立用同一期水量守恒计算可调量、输水损耗和受水区缺口，解释生态约束为何限制调水。',
    prerequisites: '已会减法与10%计算，知道水资源地区分布不均。未采集真实学情；按15分钟教师投屏与个人纸笔计算设计。',
    misconception: '申请调水量不是实际调出量，实际调出量也不是到水量；生态留水不是可以随意扣除的“浪费”。',
    steps: [
      '0—4分钟示范：来水100、生态留水40、申请60。板书可调60、损耗6、到水54；用100=40+6+54核账。',
      '4—10分钟同类练习：只把来水改为80。学生先算实际调出40，再算到水36及缺口14；提示按“先留水、再取水、后扣损耗”顺序，随后撤去提示。',
      '10—15分钟独立检验：关闭指标，完成两道固定题及一条守恒式。教师按是否用提示记录完成条件，下一课换等值来水量进行纸笔复查。',
    ],
    example: '模拟本期来水100万 m³，生态留水40，申请60：取水min(60,100−40)=60，损耗60×10%=6，到水54。受水区需求50，因此缺口0，超过本期需求4。',
    transfer: '用来水80的同类案例检验：不能继续照搬取水60；可调水只剩40，到水36，缺口14。',
    controls: [
      { key: 'supply', label: '调出区本期来水（万 m³）', options: [{ value: 40, label: '40' }, { value: 80, label: '80' }, { value: 100, label: '100' }] },
      { key: 'reserve', label: '原流域生态留水底线（万 m³）', options: [{ value: 40, label: '40' }, { value: 60, label: '60' }] },
      { key: 'request', label: '申请调出量（万 m³）', options: [{ value: 40, label: '40' }, { value: 60, label: '60' }] },
    ],
    defaults: { supply: 100, reserve: 40, request: 60 },
    comparison: { label: '只改变来水：80万 m³', input: { supply: 80, reserve: 40, request: 60 } },
    evaluate: input => {
      const m = transferModel(input);
      return { metrics: [
        { label: '留在原流域', value: m.retained, unit: '万 m³' }, { label: '实际调出', value: m.diverted, unit: '万 m³' },
        { label: '途中损耗', value: m.loss, unit: '万 m³', digits: 1 }, { label: '受水区到水', value: m.delivered, unit: '万 m³', digits: 1 },
        { label: '受水区缺口', value: m.deficit, unit: '万 m³', digits: 1 }, { label: '超过本期需求', value: m.surplus, unit: '万 m³', digits: 1 },
      ], message: m.ecologicalShortfall > 0 ? `来水本身不足生态底线，差${m.ecologicalShortfall}万 m³；本模型停止调出，受水区仍需其他方案。` : `生态底线满足。申请${m.request}，实际调出${m.diverted}；损耗率固定10%，受水区本期需求固定50万 m³。超过需求的量单列，不自动解释为有必要多调。` };
    },
    Diagram: TransferDiagram,
    questions: [
      { prompt: '独立计算：来水80、生态留水40、申请60，输水损耗10%，受水区需求50（均为万 m³）。到水与缺口分别多少？', options: ['到水54，缺口0', '到水40，缺口10', '到水36，缺口14'], correct: 2, explanation: '可调80−40=40；损耗4；到水36；缺口50−36=14。守恒：80=40+4+36。' },
      { prompt: '等值迁移：来水100、生态留水60、申请60，其他条件相同。到水与缺口分别多少？', options: ['到水36，缺口14', '到水54，缺口0', '到水60，缺口0'], correct: 0, explanation: '可调100−60=40；到水40×90%=36，缺口14。保持同一计算顺序。' },
    ],
    method: '虚构单期水账，无蓄水跨期调节。实际调出=min(申请量,max(0,来水−生态留水底线))；到水=调出×90%。固定受水区需求50万 m³。原流域留水+途中损耗+到水=来水。',
    limitations: ['10%为教学假设，不代表任何真实调水工程的损耗率；途中损耗指未到受水区，并非水从自然界消失。', '不评价真实线路、工程成本、水质、移民与跨期生态影响；生态底线也不是现实审批标准。', '开发者模拟走读已完成，真实试教与教师对答案、课时的审核尚未进行。'],
    sources: [{ title: '1995 Water-Use Guidelines: Glossary（conveyance loss）', publisher: 'U.S. Geological Survey', url: 'https://water.usgs.gov/usgs/watuse/1995guidelines/glossary.html', verifiedAt }],
  },
  {
    id: 'GQ-T063', slug: 'karez-water-budget', title: '坎儿井水账：省下的水从哪里来？', volume: 'G8B', chapter: '西北地区',
    question: '暗渠减少蒸发，是否意味着没有补给也能一直出水？',
    goal: '用自流剖面说明水沿落差流动，在相同补给下比较明暗渠到水量，并用守恒解释暗渠不能凭空增水。',
    prerequisites: '已知地下水需要补给，会求5%和20%。学生是否混淆竖井与抽水井尚待诊断；按15分钟教师投屏、纸笔个别完成设计。',
    misconception: '竖井用于施工维护，不等于每口井都抽水；暗渠省的是输送过程蒸发，不是创造补给，更不能保证永久有水。',
    steps: [
      '0—4分钟示范：沿入口100 m至出口90 m的线判断自流；补给100、先保留20，取水80，暗渠蒸发4，到水76，核对100=20+4+76。',
      '4—10分钟同类练习：只改成明渠，先预测再算80×20%=16、到水64。补给、取水上限、落差保持不变；需要时提供“补给=留存+蒸发+到水”空格式。',
      '10—15分钟独立检验：遮住数值与示范，完成两道固定题；教师要求指出暗渠节水来自哪里。下一课保留问法、换补给量纸笔复查，不把一次正确视为长期掌握。',
    ],
    example: '同一期模拟补给100万 m³，留存底线20，取水上限80，有10 m落差：取水80。暗渠假设蒸发5%，到水76；明渠假设20%，到水64。省12来自蒸发减少，补给没有改变。',
    transfer: '只降低补给至60万 m³，再用同一水账计算暗渠到水38；说明暗渠仍然可能无法满足50万 m³的需求。',
    controls: [
      { key: 'recharge', label: '本期地下水补给（万 m³）', options: [{ value: 0, label: '0' }, { value: 60, label: '60' }, { value: 100, label: '100' }] },
      { key: 'covered', label: '输水方式（教学假设蒸发率）', options: [{ value: 1, label: '暗渠：5%' }, { value: 0, label: '明渠对照：20%' }] },
      { key: 'drop', label: '入口至出口落差（不设水泵）', options: [{ value: 10, label: '10 m：可自流' }, { value: 0, label: '0 m：停止取水' }] },
    ],
    defaults: { recharge: 100, covered: 1, drop: 10 },
    comparison: { label: '只改变遮盖：明渠', input: { recharge: 100, covered: 0, drop: 10 } },
    evaluate: input => {
      const m = karezModel(input);
      return { metrics: [
        { label: '本期补给', value: m.recharge, unit: '万 m³' }, { label: '留在含水层', value: m.retained, unit: '万 m³' },
        { label: '取水', value: m.collected, unit: '万 m³' }, { label: '输水蒸发', value: m.evaporation, unit: '万 m³', digits: 1 },
        { label: '到水', value: m.delivered, unit: '万 m³', digits: 1 }, { label: '需求缺口', value: m.deficit, unit: '万 m³', digits: 1 },
      ], message: `${m.drop === 0 ? '无自流落差，本模型停止取水。' : '有自流落差，取水仍受本期补给与80万 m³取水上限限制。'}${m.reserveShortfall > 0 ? `补给不足20万 m³留存目标，差${m.reserveShortfall}万 m³；不能从不存在的补给中取水。` : '先留存20万 m³，避免把所有补给都视作可取水。'}固定需求50万 m³；所有水量与损耗比例均为教学假设。` };
    },
    Diagram: KarezDiagram,
    questions: [
      { prompt: '独立计算：补给60、先留存20、取水上限80（万 m³），有落差，暗渠假设蒸发5%。到水与50万 m³需求的缺口是多少？', options: ['到水57，缺口0', '到水38，缺口12', '到水40，缺口10'], correct: 1, explanation: '可取60−20=40，蒸发40×5%=2，到水38，缺口12。60=20+2+38。' },
      { prompt: '等值迁移：补给仍为60、留存20，有落差，只换明渠，假设蒸发20%。到水与缺口是多少？', options: ['到水48，缺口2', '到水38，缺口12', '到水32，缺口18'], correct: 2, explanation: '仍取水40；蒸发40×20%=8，到水32，缺口18。只改变输水方式，没有改变补给。' },
    ],
    method: '虚构单期水账，留存目标20万 m³、取水上限80万 m³；不动用历史储水。正落差时取水=min(80,max(0,补给−20))，无落差时取水0。暗渠/明渠蒸发率分别假设5%/20%，其余输送损失忽略。',
    limitations: ['百分比为教学对照，不是新疆或任何真实坎儿井实测值；原理参考亦不提供这些数值。', '实际出水受地下水位、渗透性、隧道坡度及多年储量变化影响，本模型不计算流速或工程施工参数。', '明渠对照只是相同取水量的无遮盖输水情境；图中地表随遮盖状态改变，仅用于区分暗渠与露天渠，不能据此推导施工成本。', '完成的是开发者模拟试讲走读，尚未真实课堂试教，不能宣称提升学习成效。'],
    sources: [
      { title: 'The Persian Qanat（重力自流原理）', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1506/', verifiedAt },
      { title: 'Qanat Irrigated Agricultural Heritage Systems of Kashan（减少蒸发）', publisher: 'FAO', url: 'https://www.fao.org/family-farming/detail/en/c/283205/', verifiedAt },
    ],
  },
];

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  agricultureFit,
  controlledErosionComparison,
  contourRoutes,
  dayLengthHours,
  erosionModel,
  erosionBaseline,
  farmDecisionScores,
  lakeHotspots,
  localTimeDifferenceHours,
  monsoonBaseline,
  populationSnapshots,
  shiftSeries,
  solarDeclination,
  terrainTransect,
  yangtzeTimeline,
  type AgricultureFactors,
  type ErosionInput,
  type ErosionVariable,
  type FarmScenario,
  type SeasonKey,
} from "./models";
import "./topics.css";

type EvidenceValue = string | number | boolean | readonly string[] | Record<string, unknown>;

function downloadEvidence(title: string, evidence: Record<string, EvidenceValue>) {
  const payload = JSON.stringify({ title, exportedAt: new Date().toISOString(), evidence }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replaceAll(" ", "-")}-evidence.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EvidenceCard({ title, evidence, children }: { title: string; evidence: Record<string, EvidenceValue>; children?: ReactNode }) {
  return (
    <section className="lab-evidence" aria-labelledby={`${title}-evidence-title`}>
      <h3 id={`${title}-evidence-title`}>我的证据卡</h3>
      {children}
      <ul className="evidence-list">
        {Object.entries(evidence).map(([key, value]) => (
          <li key={key}>
            <small>{key}</small>
            <div>{Array.isArray(value) ? value.join("、") : typeof value === "object" ? JSON.stringify(value) : String(value)}</div>
          </li>
        ))}
      </ul>
      <div className="button-row">
        <button className="lab-button" type="button" onClick={() => downloadEvidence(title, evidence)}>下载结构化证据</button>
        <button className="lab-button" type="button" onClick={() => window.print()}>打印证据卡</button>
      </div>
    </section>
  );
}

function LabNotice({ children }: { children: ReactNode }) {
  return <p className="lab-notice">{children}</p>;
}

interface NumericRangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

function NumericRange({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  formatValue = String,
  onChange,
}: NumericRangeProps) {
  const update = (next: number) => {
    if (!Number.isFinite(next)) return;
    onChange(Math.max(min, Math.min(max, next)));
  };
  return (
    <div className="numeric-range">
      <label>
        {label}：{formatValue(value)}
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
        />
      </label>
      <label className="numeric-input">
        <span>数值输入</span>
        <input
          type="number"
          aria-label={`${label}数值输入`}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

export function EarthMotionLab() {
  const [season, setSeason] = useState<SeasonKey>("june-solstice");
  const [tilt, setTilt] = useState(23.4);
  const [latitude, setLatitude] = useState(40);
  const [comparisonLongitude, setComparisonLongitude] = useState(90);
  const declination = solarDeclination(season, tilt);
  const dayLength = dayLengthHours(latitude, declination);
  const localTimeDifference = localTimeDifferenceHours(
    comparisonLongitude,
    120,
  );
  const seasonClass = season.split("-")[0];
  const evidence = {
    改变变量: "地轴倾角",
    实验值: `${tilt.toFixed(1)}°`,
    观测纬度: `${latitude}°`,
    太阳直射纬度: `${declination.toFixed(1)}°`,
    昼长: `${dayLength.toFixed(1)} 小时`,
    地方时对比: `${comparisonLongitude}°E 比 120°E 晚 ${localTimeDifference.toFixed(1)} 小时`,
    机制判断: tilt === 0 ? "没有地轴倾角时，季节昼长差异显著减弱" : "太阳直射点与昼长随公转位置改变",
  };
  return (
    <div className="topic-lab">
      <LabNotice>原创二维教学模型；天体大小、距离与速度不按比例。一次只比较一个变量。</LabNotice>
      <div className="lab-grid">
        <section className="lab-stage orbit-stage" aria-label="地球公转与光照示意">
          <div className="orbit">
            <div className="sun" role="img" aria-label="太阳" />
            <div className={`earth ${seasonClass}`} style={{ "--axis-tilt": `${tilt}deg` } as CSSProperties} role="img" aria-label={`地球，地轴倾角 ${tilt} 度`} />
          </div>
        </section>
        <section className="lab-panel">
          <h3>单变量实验</h3>
          <label>公转位置
            <select value={season} onChange={(event) => setSeason(event.target.value as SeasonKey)}>
              <option value="march-equinox">春分</option><option value="june-solstice">夏至</option>
              <option value="september-equinox">秋分</option><option value="december-solstice">冬至</option>
            </select>
          </label>
          <NumericRange label="地轴倾角" value={tilt} min={0} max={45} step={0.1} formatValue={(value) => `${value.toFixed(1)}°`} onChange={setTilt} />
          <NumericRange label="观测纬度" value={latitude} min={0} max={70} step={5} formatValue={(value) => `${value}°N`} onChange={setLatitude} />
          <NumericRange label="地方时对比经度" value={comparisonLongitude} min={60} max={120} step={15} formatValue={(value) => `${value}°E`} onChange={setComparisonLongitude} />
          <div className="metric-grid"><div className="metric">昼长<strong>{dayLength.toFixed(1)} h</strong></div><div className="metric">直射纬度<strong>{declination.toFixed(1)}°</strong></div><div className="metric">与 120°E 时差<strong>{localTimeDifference.toFixed(1)} h</strong></div></div>
          <button className="lab-button" type="button" onClick={() => { setSeason("june-solstice"); setTilt(23.4); setLatitude(40); setComparisonLongitude(90); }}>重置基准</button>
        </section>
      </div>
      <EvidenceCard title="earth-motion-lab" evidence={evidence} />
    </div>
  );
}

export function ContourRescue() {
  const [feature, setFeature] = useState("鞍部");
  const [route, setRoute] = useState<(typeof contourRoutes)[number]>(contourRoutes[2]!);
  const routeFeedback = route.id === "saddle"
    ? "按题设的坡度、谷地穿越与通视指标，这条路线相对稳妥"
    : route.id === "ridge"
      ? "通视较好，但总爬升和最大坡度偏高"
      : "坡度较缓，但需要穿越谷地且通视受限";
  const evidence = {
    地形判读: feature,
    选择路线: route.label,
    总爬升: `${route.climb} m`,
    最大坡度: `${route.maxSlope}°`,
    谷地穿越: route.valleyCrossings,
    相对判断: routeFeedback,
    仍需信息: ["天气", "道路", "植被", "落石风险"],
  };
  return (
    <div className="topic-lab">
      <LabNotice>原创虚构地形，等高距 50 米，不对应真实地点。等高线只能支持“按题设指标相对稳妥”的选择，不能代替现实救援研判。</LabNotice>
      <div className="lab-grid">
        <section className="lab-stage">
          <svg className="contour-map" viewBox="0 0 520 330" role="img" aria-label="包含两座山峰、鞍部、山脊、山谷和三条路线的原创等高线图">
            <rect width="520" height="330" rx="18" fill="#153847" />
            {[0, 1, 2, 3, 4].map((i) => <ellipse key={`left-${i}`} cx="165" cy="145" rx={125 - i * 19} ry={98 - i * 15} fill="none" stroke="#d9c286" strokeWidth="2" />)}
            {[0, 1, 2, 3].map((i) => <ellipse key={`right-${i}`} cx="365" cy="170" rx={105 - i * 20} ry={84 - i * 15} fill="none" stroke="#d9c286" strokeWidth="2" />)}
            <path d="M248 147 C278 128 300 132 323 151" fill="none" stroke="#d9c286" strokeWidth="2" />
            <path d="M35 275 C170 258 290 88 480 75" fill="none" stroke="#ff6b6b" strokeWidth="5" strokeDasharray="9 6" />
            <path d="M35 275 C160 300 300 295 480 75" fill="none" stroke="#57c7ff" strokeWidth="5" strokeDasharray="9 6" />
            <path d="M35 275 C170 220 275 177 480 75" fill="none" stroke="#5ee6a8" strokeWidth="5" />
            <circle cx="35" cy="275" r="8" fill="#fff" /><circle cx="480" cy="75" r="8" fill="#fff" />
            <text x="82" y="250" fill="#f4e3b2" fontSize="14">50 m 等高距</text>
          </svg>
        </section>
        <section className="lab-panel">
          <h3>递进判读</h3>
          <div className="lab-control-group">地形部位<div className="chip-row">{["山峰", "鞍部", "山脊", "山谷"].map((item) => <button type="button" className="lab-chip" aria-pressed={feature === item} onClick={() => setFeature(item)} key={item}>{item}</button>)}</div></div>
          <div className="lab-control-group">候选路线{contourRoutes.map((item) => <button type="button" className="route-card" data-selected={route.id === item.id} onClick={() => setRoute(item)} key={item.id}><strong>{item.label}</strong><br />爬升 {item.climb} m · 最大坡度 {item.maxSlope}° · 穿越谷地 {item.valleyCrossings} 次</button>)}</div>
          <p aria-live="polite">{routeFeedback}</p>
        </section>
      </div>
      <EvidenceCard title="contour-rescue" evidence={evidence} />
    </div>
  );
}

export function WorldPopulationMap() {
  const [year, setYear] = useState<keyof typeof populationSnapshots>(2020);
  const [selected, setSelected] = useState(0);
  const regions = populationSnapshots[year];
  const region = regions[selected] ?? regions[0]!;
  const evidence = {
    年份: year,
    密集区: regions.filter((item) => item.density > 100).map((item) => item.region),
    稀疏区: regions.filter((item) => item.density < 25).map((item) => item.region),
    纬度证据: region.latitudeBand,
    海拔证据: region.elevationBand,
    局限: "相关不等于因果；格网尺度会隐藏局部差异",
  };
  return (
    <div className="topic-lab">
      <LabNotice>当前为开发用脱敏汇总视图，不含未审核世界底图；正式发布前须用 GHSL/ETOPO 快照重建并完成地图门禁。</LabNotice>
      <div className="lab-grid">
        <section className="lab-stage">
          <div className="density-grid" role="list" aria-label={`${year} 年人口密度示意区域`}>
            {regions.map((item, index) => <button type="button" className="density-cell" style={{ "--density": `${Math.min(88, item.density / 8)}%` } as CSSProperties} onClick={() => setSelected(index)} key={item.region}><strong>{item.region}</strong><span>{item.density} 人/km²</span></button>)}
          </div>
          <p>区域编号视图保留核心数据探究流程，但不构成公开地图。</p>
        </section>
        <section className="lab-panel">
          <h3>筛选与反例</h3>
          <label>年份<select value={year} onChange={(event) => setYear(Number(event.target.value) as keyof typeof populationSnapshots)}><option value="2000">2000</option><option value="2010">2010</option><option value="2020">2020</option></select></label>
          <div className="metric-grid"><div className="metric">已选区域<strong>{region.region}</strong></div><div className="metric">人口密度<strong>{region.density}</strong></div></div>
          <p>思考：同处 10°–30°N，南亚平原与撒哈拉腹地为何差异巨大？这正是“纬度不能单独解释人口分布”的反例。</p>
        </section>
      </div>
      <EvidenceCard title="world-population-map" evidence={evidence} />
    </div>
  );
}

export function SouthAsiaMonsoon() {
  const [delay, setDelay] = useState(2);
  const delayed = shiftSeries(monsoonBaseline, delay, 0);
  const chartBaseline = [
    ...monsoonBaseline,
    ...Array<number>(delay).fill(0),
  ];
  const baselineWindow = monsoonBaseline.slice(3, 7).reduce((sum, value) => sum + value, 0);
  const delayedWindow = delayed.slice(3, 7).reduce((sum, value) => sum + value, 0);
  const max = Math.max(...monsoonBaseline);
  const baselineTotal = monsoonBaseline.reduce((sum, value) => sum + value, 0);
  const delayedTotal = delayed.reduce((sum, value) => sum + value, 0);
  const evidence = { 样区: "印度中部教学样区", 基准期: "1991—2020", 延迟天数: delay * 10, 基准窗口降水: baselineWindow, 延迟窗口降水: delayedWindow, 总降水守恒: baselineTotal === delayedTotal, 总量: delayedTotal, 风险判断: delayedWindow < baselineWindow * 0.8 ? "播种初期水分风险上升" : "风险接近基准", 局限: "未考虑灌溉、土壤、品种与市场" };
  return (
    <div className="topic-lab">
      <LabNotice>A 为气候基线的教学快照；B 是把同一降水过程平移后的反事实教学情景，不是历史观测、天气预报或产量预测。</LabNotice>
      <div className="lab-grid">
        <section className="lab-stage">
          <div className="bar-chart" role="img" aria-label="基准与延迟季风完整降水过程对比">
            {chartBaseline.map((value, index) => { const delayedValue = delayed[index] ?? 0; return <div className="bar-pair" key={index}><div className="bar" style={{ height: `${(value / max) * 100}%` }} title={`基准 ${value}`} /><div className="bar delayed" style={{ height: `${(delayedValue / max) * 100}%` }} title={`延迟 ${delayedValue}`} /></div>; })}
          </div>
          <p>青色：基准；橙色：延迟情景。完整序列的总降水保持不变。</p>
          <details className="data-table-details">
            <summary>查看图表数值</summary>
            <div className="data-table-scroll">
              <table>
                <caption>基准与延迟情景降水序列（教学值）</caption>
                <thead><tr><th scope="col">时段</th><th scope="col">基准</th><th scope="col">延迟</th></tr></thead>
                <tbody>{chartBaseline.map((value, index) => <tr key={index}><th scope="row">{index + 1}</th><td>{value}</td><td>{delayed[index] ?? 0}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </section>
        <section className="lab-panel">
          <h3>同步 A/B 对照</h3>
          <NumericRange label="季风延迟档位（每档 10 天）" value={delay} min={0} max={3} formatValue={(value) => `${value * 10} 天`} onChange={setDelay} />
          <div className="metric-grid"><div className="metric">基准窗口<strong>{baselineWindow}</strong></div><div className="metric">延迟窗口<strong>{delayedWindow}</strong></div></div>
          <p>可选应对：推迟播种、补灌、调整品种。结论只能指向早期水分风险。</p>
        </section>
      </div>
      <EvidenceCard title="south-asia-monsoon" evidence={evidence} />
    </div>
  );
}

const usZones = ["太平洋沿岸", "盆地山地", "北部大平原", "南部大平原", "草原门户", "密西西比河区", "东部高地", "北部新月", "水果蔬菜带"];
const crops = ["乳畜", "玉米—大豆", "小麦", "棉花", "水果蔬菜", "牧业/灌溉农业"];
const usZoneFactors = [
  { warmth: 74, water: 70, terrain: 58, market: 82, transport: 78 },
  { warmth: 54, water: 38, terrain: 42, market: 48, transport: 52 },
  { warmth: 48, water: 51, terrain: 82, market: 58, transport: 66 },
  { warmth: 83, water: 46, terrain: 78, market: 63, transport: 69 },
  { warmth: 66, water: 67, terrain: 88, market: 76, transport: 80 },
  { warmth: 81, water: 84, terrain: 82, market: 72, transport: 86 },
  { warmth: 70, water: 73, terrain: 45, market: 79, transport: 73 },
  { warmth: 46, water: 70, terrain: 72, market: 88, transport: 84 },
  { warmth: 88, water: 62, terrain: 66, market: 90, transport: 82 },
] satisfies readonly AgricultureFactors[];

export function UsFarmBelt() {
  const [selectedCrop, setSelectedCrop] = useState(0);
  const [assignments, setAssignments] = useState<number[]>([7, 4, 2, 3, 8, 1]);
  const zone = assignments[selectedCrop] ?? 0;
  const factors = usZoneFactors[zone] ?? usZoneFactors[0]!;
  const fit = agricultureFit(factors);
  const assignSelectedCrop = (zoneIndex: number) => {
    setAssignments((current) =>
      current.map((value, index) => index === selectedCrop ? zoneIndex : value),
    );
  };
  const evidence = {
    六项区域分配: Object.fromEntries(
      crops.map((crop, index) => [crop, usZones[assignments[index] ?? 0]]),
    ),
    当前农业类型: crops[selectedCrop] ?? crops[0]!,
    当前区域: usZones[zone] ?? usZones[0]!,
    五类证据: factors,
    综合匹配: fit,
    资源冲突: factors.water < 60 ? "水资源条件与扩大生产存在冲突" : "自然条件较好但仍需核对市场和运输",
    方案取舍: "允许不同分配；需要用同一组条件解释方案",
    数据口径: "开发期原创教学情景；正式版将实测汇总与教学变量分层展示",
  };
  return (
    <div className="topic-lab">
      <LabNotice>区域编号为原创教学示意，不是政治地图；正式版只使用审核后的 USDA 区域汇总和本地快照。现实分布用于对照，不是唯一答案。</LabNotice>
      <div className="lab-grid">
        <section className="lab-stage"><div className="farm-zone-grid">{usZones.map((item, index) => <button type="button" className="zone-card" data-selected={zone === index} onClick={() => assignSelectedCrop(index)} key={item}><strong>{index + 1}. {item}</strong><br /><small>{crops.filter((_, cropIndex) => assignments[cropIndex] === index).join("、") || "尚未分配"}</small></button>)}</div></section>
        <section className="lab-panel"><h3>九区农业规划面板</h3><p>先选农业卡，再把它分配到一个区域。六张卡都可反复调整。</p><div className="chip-row">{crops.map((crop, index) => <button type="button" className="lab-chip" aria-pressed={selectedCrop === index} onClick={() => setSelectedCrop(index)} key={crop}>{crop}</button>)}</div><div className="metric-grid"><div className="metric">当前分配<strong>{usZones[zone]}</strong></div><div className="metric">综合匹配<strong>{fit}</strong></div><div className="metric">水分条件<strong>{factors.water}</strong></div><div className="metric">市场条件<strong>{factors.market}</strong></div><div className="metric">运输条件<strong>{factors.transport}</strong></div></div><button className="lab-button" type="button" onClick={() => { setSelectedCrop(0); setAssignments([7, 4, 2, 3, 8, 1]); }}>重置示例方案</button></section>
      </div>
      <EvidenceCard title="us-farm-belt" evidence={evidence} />
    </div>
  );
}

export function ChinaTerrainSteps() {
  const [position, setPosition] = useState(0);
  const point = terrainTransect[position] ?? terrainTransect[0];
  const max = terrainTransect[0].elevation;
  const evidence = { 剖面类型: "境内折线观察剖面", 观察地点: point.place, 高程: `${point.elevation} m`, 所属阶梯: point.step, 过渡证据: ["昌都附近第一、二级过渡", "宜昌附近第二、三级过渡"], 影响判断: ["河流落差", "交通阻隔", "水能开发"], 尺度限制: "阶梯界线为教材概念示意" };
  return (
    <div className="topic-lab">
      <LabNotice>当前只呈现剖面和地点列表；合规中国标准地图与审图记录完成前，不加载或提交任何底图资产。</LabNotice>
      <div className="lab-grid"><section className="lab-stage"><div className="terrain-profile" role="img" aria-label="那曲到上海的折线观察剖面">{terrainTransect.map((item, index) => <button type="button" className="terrain-column" onClick={() => setPosition(index)} style={{ height: `${Math.max(10, (item.elevation / max) * 100)}%`, outline: index === position ? "3px solid #2dd4bf" : "none" }} key={item.place}>{item.place}<br />{item.elevation}m</button>)}</div></section><section className="lab-panel"><h3>剖面联动</h3><NumericRange label="观察位置编号" value={position} min={0} max={5} onChange={setPosition} /><div className="metric-grid"><div className="metric">地点<strong>{point.place}</strong></div><div className="metric">高程<strong>{point.elevation}m</strong></div></div><p>{point.step}。这是一条观察折线，不是实际交通路线，也不能自动识别阶梯边界。</p></section></div>
      <EvidenceCard title="china-terrain-steps" evidence={evidence} />
    </div>
  );
}

export function LakeRestoration() {
  const [swipe, setSwipe] = useState(50);
  const [hotspot, setHotspot] = useState(0);
  const [confidence, setConfidence] = useState("需要交叉证据");
  const current = lakeHotspots[hotspot] ?? lakeHotspots[0];
  const evidence = { 湖泊: "洞庭湖", 对比时期: ["1990—1994 年 10—12 月", "2020—2024 年 10—12 月"], 热点: current.label, 影像观察: current.observation, 证据等级: confidence, 替代解释: "水位、季节、传感器与治理措施可能共同影响影像变化", 结论边界: "影像不能直接判断水质或证明治理因果" };
  return (
    <div className="topic-lab">
      <LabNotice>当前为无地理边界的开发示意纹理，不是 Landsat 影像。正式影像共配准、许可与地图门禁通过后才替换。</LabNotice>
      <div className="lab-grid"><section className="lab-stage"><div className="image-swipe" style={{ "--swipe": `${swipe}%` } as CSSProperties} role="img" aria-label="洞庭湖两期同季节影像开发示意"><div className="image-after"><span>2020—2024 同季节合成（开发示意）</span></div></div></section><section className="lab-panel"><h3>影像标注</h3><NumericRange label="前后分割" value={swipe} min={5} max={95} formatValue={(value) => `${value}%`} onChange={setSwipe} />{lakeHotspots.map((item, index) => <button type="button" className="hotspot-card" data-selected={hotspot === index} onClick={() => setHotspot(index)} key={item.id}>{item.label}</button>)}<label>证据等级<select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option>影像直接支持</option><option>需要交叉证据</option><option>只能提出假设</option></select></label></section></div>
      <EvidenceCard title="lake-restoration" evidence={evidence} />
    </div>
  );
}

export function ChinaFarmChoice() {
  const [scenario, setScenario] = useState<FarmScenario>({ climate: "warm-wet", crop: "rice", irrigation: 2, market: 1, technology: 1 });
  const scores = farmDecisionScores(scenario);
  const plots: Record<FarmScenario["climate"], { name: string; climate: string; water: string }> = {
    "cold-wet": { name: "东北平原地块", climate: "冷凉、湿润，生长期较短", water: "雨热同期但低温风险较高" },
    "warm-wet": { name: "长江中下游平原地块", climate: "温暖、湿润，生长期较长", water: "降水较多但仍需调蓄" },
    "warm-dry": { name: "华北平原地块", climate: "暖温、偏干，季节差异明显", water: "灌溉可靠度影响突出" },
    "cold-dry": { name: "西北灌溉农业地块", climate: "冷凉、干旱，光照较强", water: "水源约束最强" },
  };
  const plot = plots[scenario.climate];
  const cropLabel = { rice: "稻谷", wheat: "小麦", maize: "玉米" }[scenario.crop];
  const evidence = {
    地块情景: plot.name,
    作物: cropLabel,
    配置: {
      irrigationLevel: scenario.irrigation,
      marketAccessLevel: scenario.market,
      technologyLevel: scenario.technology,
    },
    自然证据: [plot.climate, plot.water],
    社会经济证据: [
      `市场可达性 ${scenario.market}/2`,
      `技术投入 ${scenario.technology}/2`,
    ],
    四项指数: scores,
    可持续取舍: scores.water < 60 ? "需降低水资源压力" : "需权衡技术投入与风险韧性",
    模型版本: "DS-MODEL-FARM-V1",
  };
  const setNumber = (key: "irrigation" | "market" | "technology", value: number) => setScenario((current) => ({ ...current, [key]: value as 0 | 1 | 2 }));
  return (
    <div className="topic-lab"><LabNotice>原创教学决策模型，四项结果是比较指数，不是产量、收益或真实经营预测。</LabNotice><div className="lab-grid"><section className="lab-stage"><div className="slope-scene"><div className="slope-plane" style={{ "--cover-level": scenario.crop === "rice" ? 4 : 2, "--slope-level": 1 } as CSSProperties} /></div><div className="metric-grid">{Object.entries(scores).map(([key, value]) => <div className="metric" key={key}>{({ natural: "自然适宜", water: "水资源匹配", market: "市场匹配", resilience: "风险韧性" } as const)[key as keyof typeof scores]}<strong>{value}</strong></div>)}</div></section><section className="lab-panel"><h3>生产配置面板</h3><label>预设教学地块<select value={scenario.climate} onChange={(event) => setScenario((current) => ({ ...current, climate: event.target.value as FarmScenario["climate"] }))}><option value="cold-wet">东北平原</option><option value="warm-wet">长江中下游平原</option><option value="warm-dry">华北平原</option><option value="cold-dry">西北灌溉农业区</option></select></label><p>{plot.climate}；{plot.water}。</p><label>作物<select value={scenario.crop} onChange={(event) => setScenario((current) => ({ ...current, crop: event.target.value as FarmScenario["crop"] }))}><option value="rice">稻谷</option><option value="wheat">小麦</option><option value="maize">玉米</option></select></label>{(["irrigation", "market", "technology"] as const).map((key) => <NumericRange key={key} label={({ irrigation: "灌溉可靠度", market: "市场可达性", technology: "技术投入" } as const)[key]} value={scenario[key]} min={0} max={2} formatValue={(value) => `${value} / 2`} onChange={(value) => setNumber(key, value)} />)}<button className="lab-button" type="button" onClick={() => setScenario({ climate: "warm-wet", crop: "rice", irrigation: 2, market: 1, technology: 1 })}>重置基准</button></section></div><EvidenceCard title="china-farm-choice" evidence={evidence} /></div>
  );
}

export function YangtzeBelt() {
  const [index, setIndex] = useState(2);
  const node = yangtzeTimeline[index] ?? yangtzeTimeline[0];
  const [selectedSegments, setSelectedSegments] = useState<Array<"upstream" | "midstream" | "downstream">>([]);
  const [connection, setConnection] = useState("综合交通");
  const [responsibility, setResponsibility] = useState("生态联防");
  const segmentLabels = {
    upstream: `上游：${node.upstream}`,
    midstream: `中游：${node.midstream}`,
    downstream: `下游：${node.downstream}`,
  } as const;
  const chainComplete = selectedSegments.length === 3 && Boolean(connection) && Boolean(responsibility);
  const toggleSegment = (segment: "upstream" | "midstream" | "downstream") => {
    setSelectedSegments((current) =>
      current.includes(segment)
        ? current.filter((item) => item !== segment)
        : [...current, segment],
    );
  };
  const chooseNode = (itemIndex: number) => {
    setIndex(itemIndex);
    setSelectedSegments([]);
  };
  const evidence = {
    转折点: node.year,
    前一节点: index > 0 ? yangtzeTimeline[index - 1]?.year ?? "起点" : "起点",
    当前阶段: node.label,
    三段角色证据: selectedSegments.map((segment) => segmentLabels[segment]),
    跨区联系证据: connection,
    共同生态责任: responsibility,
    证据链顺序: ["政策/阶段", "上中下游分工", "跨区联系", "共同生态责任"],
    完整性反馈: chainComplete ? "已覆盖三段、联系与生态责任" : `尚需选择 ${3 - selectedSegments.length} 张区域角色卡`,
    来源ID: [...node.sourceIds],
    局限: "政策与少量官方事实组成固定教学快照，不能单独证明政策因果",
  };
  return (
    <div className="topic-lab"><LabNotice>时间轴使用本地教学快照；当前不使用 JRC 水面数据推断水质或治理成效。地图未审核前以三列区域泳道降级。</LabNotice><div className="lab-grid"><section className="lab-stage"><div className="button-row">{yangtzeTimeline.map((item, itemIndex) => <button type="button" className="timeline-card" data-selected={index === itemIndex} onClick={() => chooseNode(itemIndex)} key={item.year}><strong>{item.year}</strong><br />{item.label}</button>)}</div><h3>选择三段角色证据</h3><div className="metric-grid">{(["upstream", "midstream", "downstream"] as const).map((segment) => <button type="button" className="route-card" data-selected={selectedSegments.includes(segment)} aria-pressed={selectedSegments.includes(segment)} onClick={() => toggleSegment(segment)} key={segment}>{segmentLabels[segment]}</button>)}</div></section><section className="lab-panel"><h3>拼合协同证据链</h3><p>{node.label} → 三段分工 → 跨区联系 → 共同生态责任</p><div className="lab-control-group">跨区联系<div className="chip-row">{["综合交通", "产业协作", "公共服务网络"].map((item) => <button type="button" className="lab-chip" aria-pressed={connection === item} onClick={() => setConnection(item)} key={item}>{item}</button>)}</div></div><div className="lab-control-group">共同生态责任<div className="chip-row">{["生态联防", "岸线治理", "水源涵养"].map((item) => <button type="button" className="lab-chip" aria-pressed={responsibility === item} onClick={() => setResponsibility(item)} key={item}>{item}</button>)}</div></div><p aria-live="polite">{chainComplete ? "证据链完整：已覆盖上中下游、联系与生态责任。" : `证据链未完成：还需选择 ${3 - selectedSegments.length} 张区域角色卡。`}</p><button className="lab-button" type="button" onClick={() => { setSelectedSegments([]); setConnection("综合交通"); setResponsibility("生态联防"); }}>重置证据链</button></section></div><EvidenceCard title="yangtze-belt" evidence={evidence} /></div>
  );
}

export function LoessSoilWater() {
  const [input, setInput] = useState<ErosionInput>(erosionBaseline);
  const [completedVariables, setCompletedVariables] = useState<ErosionVariable[]>([]);
  const comparisons = completedVariables.map(controlledErosionComparison);
  const freeCombinationUnlocked = completedVariables.length === 4;
  const result = erosionModel(input);
  const evidence = {
    基准情景: "雨强2/坡度2/覆盖2/顺坡",
    控制变量对照: comparisons.map((comparison) =>
      `${comparison.variable}:${String(comparison.from)}→${String(comparison.to)}；径流Δ${comparison.runoffDelta}；侵蚀Δ${comparison.erosionDelta}`,
    ),
    对照完成状态: `${comparisons.length}/4`,
    最终组合: { ...input, runoffIndex: result.runoff, erosionIndex: result.erosion },
    主导因素代码: input.cover >= 3 ? "COVER-REDUCTION" : "RAIN-SLOPE-AMPLIFICATION",
    模型局限代码: "RELATIVE-TEACHING-MODEL-NOT-PREDICTION",
    模型版本: "DS-MODEL-LOESS-V1",
  };
  const setLevel = (key: "rain" | "slope" | "cover", value: number) => setInput((current) => ({ ...current, [key]: value } as ErosionInput));
  const recordComparison = (variable: ErosionVariable) => {
    setCompletedVariables((current) =>
      current.includes(variable) ? current : [...current, variable],
    );
  };
  const resetErosionLab = () => {
    setInput(erosionBaseline);
    setCompletedVariables([]);
  };
  const comparisonLabels: Record<ErosionVariable, string> = {
    rain: "雨强 2→3",
    slope: "坡度 2→4",
    cover: "植被覆盖 2→4",
    practice: "顺坡→梯田",
  };
  return (
    <div className="topic-lab"><LabNotice>原创、受 RUSLE 思路启发的相对侵蚀教学模型；所有数值仅用于比较方向，不代表吨/公顷或真实预测。</LabNotice><div className="lab-grid"><section className="lab-stage"><div className="slope-scene"><div className="rain-drops" style={{ "--rain-level": input.rain } as CSSProperties} /><div className="slope-plane" style={{ "--slope-level": input.slope, "--cover-level": input.cover } as CSSProperties} /></div><div className="metric-grid"><div className="metric">相对径流<strong>{result.runoff}</strong></div><div className="metric">相对侵蚀<strong>{result.erosion}</strong></div></div></section><section className="lab-panel"><h3>先完成四组单变量对照</h3><p>每组只改变一个条件；完成后解锁自由组合。</p><div className="comparison-grid">{(["rain", "slope", "cover", "practice"] as const).map((variable) => { const comparison = completedVariables.includes(variable) ? controlledErosionComparison(variable) : undefined; return <button type="button" className="route-card" data-selected={Boolean(comparison)} aria-pressed={Boolean(comparison)} onClick={() => recordComparison(variable)} key={variable}><strong>{comparisonLabels[variable]}</strong><br />{comparison ? `径流 Δ${comparison.runoffDelta}；侵蚀 Δ${comparison.erosionDelta}` : "记录这组对照"}</button>; })}</div><h3>自由组合 {freeCombinationUnlocked ? "已解锁" : `（${completedVariables.length}/4）`}</h3>{(["rain", "slope", "cover"] as const).map((key) => <NumericRange key={key} label={({ rain: "雨强", slope: "坡度", cover: "植被覆盖" } as const)[key]} value={input[key]} min={1} max={key === "rain" ? 3 : 4} disabled={!freeCombinationUnlocked} onChange={(value) => setLevel(key, value)} />)}<label>耕作措施<select value={input.practice} disabled={!freeCombinationUnlocked} onChange={(event) => setInput((current) => ({ ...current, practice: event.target.value as ErosionInput["practice"] }))}><option value="downslope">顺坡</option><option value="contour">等高</option><option value="terrace">梯田</option><option value="grass">林草</option></select></label><button className="lab-button" type="button" onClick={resetErosionLab}>重置全部</button></section></div><EvidenceCard title="loess-soil-water" evidence={evidence} /></div>
  );
}

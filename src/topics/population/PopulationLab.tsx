import {useEffect,useMemo,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {useExperienceMode} from "../../app/ExperienceMode";
import {
  combineCountries,
  countryCodesForSelection,
  countryFor,
  pairKey,
  populationCountries,
  populationDatasetUpdatedAt,
  populationYear,
  type CombinedPopulation,
  type CountryCode,
} from "./populationModel";
import "./population.css";

const stages = [
  {
    name: "提出预测",
    time: "0–3 分钟",
    question: "人口总量很大，就一定人口密度高吗？",
    task: "先猜一猜：把人口总量与陆地面积放在一起，哪一个国家的每平方千米人口最多？",
  },
  {
    name: "总量与密度",
    time: "3–8 分钟",
    question: "同一组国家，人口总量和密度会给出同一种排序吗？",
    task: "逐个查看 2023 年的人口与陆地面积，用人口 ÷ 陆地面积得到人 / km²，并记录至少两个国家。",
  },
  {
    name: "尺度比较",
    time: "8–15 分钟",
    question: "两个国家合在一起，密度应该怎样计算？",
    task: "选择两个不同国家，把总人口和总面积相加，再与“不按面积加权的简单平均”比较。",
  },
  {
    name: "证据解释",
    time: "15–20 分钟",
    question: "用数字解释你的判断，并说清楚它不能说明什么。",
    task: "回看记录，说明总量、密度和尺度的关系；区分统计证据、相关关系与因果解释。",
  },
] as const;

type Prediction = "总量大，所以密度一定高" | "面积也要一起比较";
type RankingMetric = "population" | "density";

interface CountryObservation {
  code: CountryCode;
  population: number;
  landAreaKm2: number;
  densityPerKm2: number;
}

interface PairObservation {
  pair: readonly [CountryCode, CountryCode];
  weightedDensityPerKm2: number;
  simpleAverageDensityPerKm2: number;
  totalPopulation: number;
  totalLandAreaKm2: number;
}

const numberFormat = new Intl.NumberFormat("zh-CN");
const decimalFormat = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
});

function fmt(value: number): string {
  return numberFormat.format(Math.round(value));
}

function fmtDecimal(value: number): string {
  return decimalFormat.format(value);
}

function countryLabel(code: CountryCode): string {
  return countryFor(code).name;
}

function downloadEvidence(
  prediction: Prediction | null,
  countryRecords: readonly CountryObservation[],
  pairRecords: readonly PairObservation[],
): void {
  const payload = {
    topic: "GQ-T009",
    slug: "world-population-map",
    version: "2.0.0",
    year: populationYear,
    units: {population: "人", landArea: "km²", density: "人/km²"},
    prediction,
    countryRecords,
    pairRecords,
    limitations: [
      "国家平均值不能说明一个国家内部各地均匀",
      "相关不等于因果",
      "两个国家合并只是统计实验，不是实际新区域",
    ],
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "GeoQuest-人口与区域-实验记录.json";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DensityGrid({
  selectedCode,
  onSelect,
  showDensity,
}: {
  selectedCode: CountryCode;
  onSelect: (code: CountryCode) => void;
  showDensity: boolean;
}): React.JSX.Element {
  const maximum = Math.max(...populationCountries.map((country) => country.densityPerKm2));
  return (
    <div className="population-visual" aria-label={`${showDensity ? "四国人口密度" : "四国人口总量"}等面积格示意，不是地理地图`}>
      <div className="population-visual-heading">
        <strong>2023 {showDensity ? "人口密度" : "人口总量"} · 等面积比较格</strong>
        <span>格子面积与位置不代表真实地图</span>
      </div>
      <div className="population-density-grid" role="group" aria-label={showDensity ? "四国人口密度" : "四国人口总量"}>
        {populationCountries.map((country) => (
          <button
            className="population-density-cell"
            type="button"
            key={country.code}
            aria-pressed={selectedCode === country.code}
            onClick={() => onSelect(country.code)}
            style={{"--density-level": showDensity ? `${(country.densityPerKm2 / maximum) * 100}%` : "0%"} as React.CSSProperties}
          >
            <span className="population-cell-name">{country.name}</span>
            <strong>{showDensity ? fmtDecimal(country.densityPerKm2) : fmt(country.population)}</strong>
            <small>{showDensity ? "人 / km²" : "人"}</small>
          </button>
        ))}
      </div>
      <p className="population-visual-caption">颜色只表示四国之间的相对强弱；四格等面积排列，不包含海岸线、方位或边界。</p>
    </div>
  );
}

function PairBars({result}: {result: CombinedPopulation}): React.JSX.Element {
  const maximum = Math.max(
    result.countries[0].densityPerKm2,
    result.countries[1].densityPerKm2,
    result.weightedDensityPerKm2,
    result.simpleAverageDensityPerKm2,
  );
  const bars = [
    {label: result.countries[0].name, value: result.countries[0].densityPerKm2, className: "country"},
    {label: result.countries[1].name, value: result.countries[1].densityPerKm2, className: "country"},
    {label: "合并后按总量÷总面积", value: result.weightedDensityPerKm2, className: "weighted"},
    {label: "简单平均（错误对比）", value: result.simpleAverageDensityPerKm2, className: "simple"},
  ];
  return (
    <div className="population-pair-visual" role="img" aria-label="两个国家与两种合并密度算法的原创条形比较图">
      <div className="population-visual-heading"><strong>尺度比较 · 数字条形</strong><span>同一单位：人 / km²</span></div>
      <div className="population-bars">
        {bars.map((bar) => (
          <div className="population-bar-row" key={bar.label}>
            <span>{bar.label}</span>
            <div className="population-bar-track"><i className={`population-bar ${bar.className}`} style={{width: `${(bar.value / maximum) * 100}%`}} /></div>
            <strong>{fmtDecimal(bar.value)}</strong>
          </div>
        ))}
      </div>
      <p className="population-visual-caption">条形长度只表示计算结果；它不呈现国家在地球上的位置。</p>
    </div>
  );
}

function PopulationRanking({
  metric,
  onMetricChange,
}: {
  metric: RankingMetric;
  onMetricChange: (metric: RankingMetric) => void;
}): React.JSX.Element {
  const ranked = [...populationCountries].sort((first, second) =>
    metric === "population"
      ? second.population - first.population
      : second.densityPerKm2 - first.densityPerKm2,
  );
  const maximum = metric === "population"
    ? Math.max(...ranked.map((country) => country.population))
    : Math.max(...ranked.map((country) => country.densityPerKm2));
  return (
    <section className="population-ranking" aria-label="四国指标排序条形">
      <div className="population-ranking-heading">
        <strong>同组排序 · 先看顺序再解释</strong>
        <div className="population-ranking-switch" role="group" aria-label="排序指标">
          <button type="button" aria-pressed={metric === "population"} onClick={() => onMetricChange("population")}>人口总量</button>
          <button type="button" aria-pressed={metric === "density"} onClick={() => onMetricChange("density")}>人口密度</button>
        </div>
      </div>
      <ol className="population-ranking-list">
        {ranked.map((country, index) => {
          const value = metric === "population" ? country.population : country.densityPerKm2;
          return <li key={country.code}><span>{index + 1}</span><strong>{country.name}</strong><i><b style={{width: `${(value / maximum) * 100}%`}} /></i><em>{metric === "population" ? `${fmt(value)} 人` : `${fmtDecimal(value)} 人/km²`}</em></li>;
        })}
      </ol>
      <p className="population-visual-caption">两组排序使用同一四国样本；条形长度只在当前指标内表示相对大小。</p>
    </section>
  );
}

export default function PopulationLab(): React.JSX.Element {
  const {isClassroom} = useExperienceMode();
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AUS");
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("population");
  const [firstCode, setFirstCode] = useState<CountryCode>("AUS");
  const [secondCode, setSecondCode] = useState<CountryCode>("BGD");
  const [countryRecords, setCountryRecords] = useState<CountryObservation[]>([]);
  const [pairRecords, setPairRecords] = useState<PairObservation[]>([]);
  const [reference, setReference] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const [exitAnswer,setExitAnswer]=useState<string|null>(null);

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const selected = countryFor(selectedCountry);
  const pairIsDistinct = firstCode !== secondCode;
  const combination = useMemo(
    () => (pairIsDistinct ? combineCountries([firstCode, secondCode]) : null),
    [firstCode, pairIsDistinct, secondCode],
  );
  const selectedPairKey = pairIsDistinct ? pairKey([firstCode, secondCode]) : "";
  const pairAlreadyRecorded = pairRecords.some((record) => pairKey(record.pair) === selectedPairKey);
  const explainablePair = pairRecords.find((record) =>
    record.pair.every((code) => countryRecords.some((countryRecord) => countryRecord.code === code)),
  );
  const canExplain = Boolean(explainablePair);
  const lesson = stages[step]!;

  function go(nextStep: number): void {
    setStep(nextStep);
    setReference(false);
    setMessage("");
    requestAnimationFrame(() => root.current?.scrollIntoView({behavior: "instant", block: "start"}));
  }

  function recordCountry(): void {
    if (countryRecords.some((record) => record.code === selected.code)) {
      setMessage(`${selected.name} 已经记录过；请换一个国家形成对照。`);
      return;
    }
    setCountryRecords((records) => [
      ...records,
      {
        code: selected.code,
        population: selected.population,
        landAreaKm2: selected.landAreaKm2,
        densityPerKm2: selected.densityPerKm2,
      },
    ]);
    setReference(false);
    setMessage(`已记录 ${selected.name} 的总量、陆地面积和密度。`);
  }

  function recordPair(): void {
    if (!combination) {
      setMessage("请选择两个不同国家，再进行合并实验。");
      return;
    }
    if (pairAlreadyRecorded) {
      setMessage("这组国家已经记录过；可以换一组进行比较。");
      return;
    }
    setPairRecords((records) => [
      ...records,
      {
        pair: combination.pair,
        weightedDensityPerKm2: combination.weightedDensityPerKm2,
        simpleAverageDensityPerKm2: combination.simpleAverageDensityPerKm2,
        totalPopulation: combination.totalPopulation,
        totalLandAreaKm2: combination.totalLandAreaKm2,
      },
    ]);
    setReference(false);
    setMessage(`已记录 ${combination.countries[0].name} + ${combination.countries[1].name} 的尺度实验。`);
  }

  function removeCountry(code: CountryCode): void {
    setCountryRecords((records) => records.filter((record) => record.code !== code));
    setReference(false);
    setMessage(`已移除 ${countryLabel(code)} 的记录。`);
  }

  function removePair(key: string): void {
    setPairRecords((records) => records.filter((record) => pairKey(record.pair) !== key));
    setReference(false);
    setMessage("已移除这组尺度实验记录。");
  }

  function reset(): void {
    setExitAnswer(null);
    setStep(0);
    setPrediction(null);
    setSelectedCountry("AUS");
    setRankingMetric("population");
    setFirstCode("AUS");
    setSecondCode("BGD");
    setCountryRecords([]);
    setPairRecords([]);
    setReference(false);
    setMessage("");
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setMessage("此浏览器未允许全屏，可继续使用课堂布局。");
    }
  }

  function changeFirst(next: CountryCode): void {
    setFirstCode(next);
    if (next === secondCode) {
      setSecondCode(countryCodesForSelection(next)[0]!);
    }
  }

  return (
    <article ref={root} className={`population-lab population-step-${step} ${isClassroom ? "population-classroom" : ""}`}>
      <header className="population-heading">
        <div><span>05 / 人口与区域 · 七年级 · 20 分钟探究</span><h1>人口与区域</h1></div>
        <div className="population-actions">
          <Link to={isClassroom ? "/topics/world-population-map" : "/topics/world-population-map?mode=classroom"}>{isClassroom ? "退出课堂" : "课堂展示"}</Link>
          <button type="button" onClick={() => void toggleFullscreen()}>{fullscreen ? "退出全屏" : "全屏投影"}</button>
          <button type="button" onClick={reset}>重置实验</button>
        </div>
      </header>
      {message && <p className="population-status" role="status">{message}</p>}
      <nav className="population-steps" aria-label="人口探究步骤">
        {stages.map((stage, index) => (
          <button key={stage.name} type="button" aria-current={step === index ? "step" : undefined} onClick={() => go(index)}>
            <span>0{index + 1}</span>{stage.name}<small>{stage.time}</small>
          </button>
        ))}
      </nav>
      <section className="population-prompt" aria-label="本环节任务"><h2>{lesson.question}</h2><p>{lesson.task}</p></section>

      {step === 0 && <div className="population-board">
        <div className="population-visual-column"><DensityGrid selectedCode={selectedCountry} onSelect={setSelectedCountry} showDensity={false} /><p className="population-plain-note">四个格子大小相同，先只看人口总量；密度要到下一步再计算。</p></div>
        <aside className="population-panel" aria-label="预测与开始实验">
          <span className="population-kicker">我的预测</span>
          <h2>人口总量大，<br />密度一定高吗？</h2>
          {(["总量大，所以密度一定高", "面积也要一起比较"] as const).map((option) => <button key={option} className="population-choice" type="button" aria-pressed={prediction === option} onClick={() => setPrediction(option)}>{option}</button>)}
          <p>{prediction ? `已预测：${prediction}。接下来用 2023 数据检验。` : "先说出你的判断，再开始记录。"}</p>
          <button className="population-primary" type="button" disabled={!prediction} onClick={() => go(1)}>开始总量与密度 →</button>
          <p className="population-small">本主题使用 2023 年同一时期的真实国家记录。图形为原创数字示意，不是地图。</p>
        </aside>
      </div>}

      {step === 1 && <div className="population-board">
        <div className="population-visual-column"><DensityGrid selectedCode={selectedCountry} onSelect={setSelectedCountry} showDensity /><PopulationRanking metric={rankingMetric} onMetricChange={setRankingMetric} /></div>
        <aside className="population-panel" aria-label="总量与密度记录">
          <h2>逐国读数</h2>
          <p>选择一个格子，先读人口总量和陆地面积，再看密度。公式：人口 ÷ 陆地面积。</p>
          <div className="population-reading-grid"><div><span>当前国家</span><strong>{selected.name}</strong></div><div><span>人口总量</span><strong>{fmt(selected.population)} 人</strong></div><div><span>陆地面积</span><strong>{fmtDecimal(selected.landAreaKm2)} km²</strong></div><div><span>人口密度</span><strong>{fmtDecimal(selected.densityPerKm2)} 人/km²</strong></div></div>
          <button className="population-primary" type="button" disabled={countryRecords.some((record) => record.code === selected.code)} onClick={recordCountry}>{countryRecords.some((record) => record.code === selected.code) ? "该国已记录" : "记录该国数据"}</button>
          <p className="population-record-status" role="status">已记录 {countryRecords.length} / 4 个国家；至少两条记录后进入尺度比较。</p>
          <div className="population-record-chips">{countryRecords.map((record) => <button type="button" key={record.code} aria-label={`移除 ${countryLabel(record.code)} 记录`} onClick={() => removeCountry(record.code)}>{countryLabel(record.code)} ×</button>)}</div>
          <button className="population-secondary" type="button" disabled={countryRecords.length < 2} onClick={() => go(2)}>进入尺度比较 →</button>
        </aside>
      </div>}

      {step === 2 && <div className="population-board">
        <div className="population-visual-column">{combination ? <PairBars result={combination} /> : <div className="population-empty-visual">请选择两个不同国家后，条形图会显示计算结果。</div>}<div className="population-statistical-note"><strong>统计实验</strong><p>把两个国家的总人口和总面积暂时相加，只为检验尺度与权重；这不表示现实中出现了一个新的区域。</p></div></div>
        <aside className="population-panel" aria-label="尺度合并实验">
          <h2>选择两个国家</h2>
          <label>第一个国家<select aria-label="合并实验第一个国家" value={firstCode} onChange={(event) => changeFirst(event.target.value as CountryCode)}>{populationCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label>第二个国家<select aria-label="合并实验第二个国家" value={secondCode} onChange={(event) => setSecondCode(event.target.value as CountryCode)}>{populationCountries.map((country) => <option key={country.code} value={country.code} disabled={country.code === firstCode}>{country.name}</option>)}</select></label>
          {!pairIsDistinct && <p className="population-warning" role="alert">两个选择必须不同，不能把同一国家重复计算。</p>}
          {combination && <div className="population-combination-readings"><div><span>合并总人口</span><strong>{fmt(combination.totalPopulation)} 人</strong></div><div><span>合并总面积</span><strong>{fmtDecimal(combination.totalLandAreaKm2)} km²</strong></div><div><span>按总量 ÷ 总面积</span><strong>{fmtDecimal(combination.weightedDensityPerKm2)} 人/km²</strong></div><div><span>简单平均（错误）</span><strong>{fmtDecimal(combination.simpleAverageDensityPerKm2)} 人/km²</strong></div></div>}
          <button className="population-primary" type="button" disabled={!combination || pairAlreadyRecorded} onClick={recordPair}>{pairAlreadyRecorded ? "这组已记录" : "记录这组尺度实验"}</button>
          <p className="population-record-status" role="status">已记录 {pairRecords.length} 组；记录后到“证据解释”核对两种算法。</p>
          <p className="population-small">简单平均把两个国家当成同等面积，忽略了面积权重；它在本实验中是用来暴露错误的对比值。</p>
        </aside>
      </div>}

      {step === 3 && <section className="population-synthesis">
        <div className="population-notebook"><h2>我的证据记录 <small>{countryRecords.length} 个国家 · {pairRecords.length} 组尺度实验</small></h2>
          {countryRecords.length > 0 || pairRecords.length > 0 ? <div className="population-table-scroll"><table><caption>只显示本页记录的结构化数值</caption><thead><tr><th scope="col">记录</th><th scope="col">人口</th><th scope="col">面积 km²</th><th scope="col">密度 人/km²</th><th scope="col"><span className="population-sr-only">操作</span></th></tr></thead><tbody>{countryRecords.map((record) => <tr key={`country-${record.code}`}><th scope="row">{countryLabel(record.code)}</th><td>{fmt(record.population)}</td><td>{fmtDecimal(record.landAreaKm2)}</td><td>{fmtDecimal(record.densityPerKm2)}</td><td><button type="button" aria-label={`移除 ${countryLabel(record.code)} 记录`} onClick={() => removeCountry(record.code)}>移除</button></td></tr>)}{pairRecords.map((record) => <tr key={`pair-${pairKey(record.pair)}`}><th scope="row">{countryLabel(record.pair[0])} + {countryLabel(record.pair[1])}</th><td>{fmt(record.totalPopulation)}</td><td>{fmtDecimal(record.totalLandAreaKm2)}</td><td>{fmtDecimal(record.weightedDensityPerKm2)} <small>/ 错误平均 {fmtDecimal(record.simpleAverageDensityPerKm2)}</small></td><td><button type="button" aria-label={`移除 ${countryLabel(record.pair[0])}与${countryLabel(record.pair[1])}尺度记录`} onClick={() => removePair(pairKey(record.pair))}>移除</button></td></tr>)}</tbody></table></div> : <p>还没有证据记录。回到前两步，记录至少两个国家和一组尺度实验。</p>}
          <div className="population-button-row"><button className="population-secondary" type="button" onClick={() => downloadEvidence(prediction, countryRecords, pairRecords)}>导出 JSON ↓</button><button className="population-secondary" type="button" onClick={() => window.print()}>打印证据卡</button></div>
          <p className="population-small">记录只留在本页；切换课堂模式保持，刷新清除；不上传学习记录。</p>
        </div>
        <div className="population-explanation"><h2>先解释，再看参考</h2><ul><li>{countryRecords.length >= 2 ? "✓" : "○"} 至少两国的总量、面积与密度</li><li>{explainablePair ? "✓" : "○"} 合并实验的两个国家也各有单国记录</li></ul><p>句式提示：保持年份和指标不变，改变国家组合，从总人口、总面积和密度读出尺度差异。这不能说明国家内部处处相同，也不能把相关关系说成因果。</p><button className="population-primary" type="button" disabled={!canExplain} aria-expanded={reference && canExplain} onClick={() => setReference((value) => !value)}>{reference ? "收起讨论参考" : "显示讨论参考"}</button>{!canExplain && <p className="population-small">{pairRecords.length > 0 ? "当前合并记录中的两个国家没有都留下单国记录；请回到“总量与密度”补齐后再解锁参考。" : "完成至少两国单国记录和一组尺度实验后解锁参考，先保留自己的判断。"}</p>}{reference && explainablePair && <div className="population-answer"><p>你记录的国家平均密度只描述该国整体平均。一个国家内部可能有城市、荒漠、山区等不同区域，国家平均值不能说明一个国家内部各地均匀。</p><p>{`${countryLabel(explainablePair.pair[0])} 与 ${countryLabel(explainablePair.pair[1])} 的合并实验中，按总人口 ÷ 总面积为 ${fmtDecimal(explainablePair.weightedDensityPerKm2)} 人/km²；简单平均为 ${fmtDecimal(explainablePair.simpleAverageDensityPerKm2)} 人/km²。后者没有按面积加权，只是错误对比。`}</p><p>人口密度与自然条件、历史、经济、交通等因素可能同时相关，但相关不等于因果。本主题不把自然条件当作决定人口的评分，也不从四个国家推断普遍规律。</p></div>}<fieldset className="population-transfer"><legend>离堂一问：判断一个国家内部人口集中在哪里，需要什么？</legend>{['更细尺度的人口分布资料','只看国家平均密度就够了'].map(a=><button type="button" key={a} aria-pressed={exitAnswer===a} onClick={()=>setExitAnswer(a)}>{a}</button>)}{exitAnswer&&<p role="status">{exitAnswer.startsWith('更细')?'对。需要城市、地区或网格等更细尺度资料；解释原因还要结合自然、历史与经济证据。':'国家平均值不能定位内部聚集区。请补充更细尺度人口分布资料，再讨论原因。'}</p>}</fieldset></div>
      </section>}

      <details className="population-method"><summary>数据、图形与适用范围</summary><p>四国数据来自 World Bank World Development Indicators 2023 年指标：SP.POP.TOTL（人口总量）和 AG.LND.TOTL.K2（陆地面积）。本地快照更新时间标记为 {populationDatasetUpdatedAt}，主题离线运行时不请求 API。来源许可为 CC BY 4.0，署名 World Bank；本主题只保留四国 2023 记录并用人口 ÷ 陆地面积计算密度。</p><p>所有格子与条形均为原创等面积数字图形。它们不冒充地理地图，不表达方位、边界或国家形状。国家合并只是统计实验，不是现实中新区域的建议。</p><p>密度是平均值；它不能描述国家内部的均匀程度。四个国家是一个课堂样本，不能据此给出自然条件决定人口的评分或因果结论。</p><p>官方来源：<a href="https://api.worldbank.org/v2/country/AUS;BGD;NLD;JPN/indicator/SP.POP.TOTL?date=2023&amp;format=json&amp;per_page=100" rel="noreferrer">World Bank 人口 API</a>、<a href="https://api.worldbank.org/v2/country/AUS;BGD;NLD;JPN/indicator/AG.LND.TOTL.K2?date=2023&amp;format=json&amp;per_page=100" rel="noreferrer">World Bank 陆地面积 API</a>、<a href="https://datacatalog.worldbank.org/public-licenses" rel="noreferrer">World Bank 数据许可</a>。</p></details>
    </article>
  );
}

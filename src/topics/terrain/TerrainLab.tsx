import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useExperienceMode } from "../../app/ExperienceMode";
import TerrainScene from "./TerrainScene";
import TerrainMap from "./TerrainMap";
import TerrainProfile from "./TerrainProfile";
import { routeAnalyses, type RouteId } from "./terrainModel";
import "./terrain.css";

const stages = [
  {name:"提出预测", time:"0–3 分钟", question:"从 S 到 T，直达一定更省力吗？", task:"先观察三条线的走向。暂不看数值：哪条路线的最大坡度可能较小？说出你的理由。"},
  {name:"读懂山形", time:"3–8 分钟", question:"怎样从等高线判断山顶和陡缓？", task:"切换俯视，找两处山顶和中间的低处。在同一张图上比较疏密，再把等高距改为 50 m：山真的变陡了吗？"},
  {name:"测量取证", time:"8–15 分钟", question:"路程短与坡度缓，能同时做到吗？", task:"先记录 B、C 两线，定位最陡段并对照等高线。有余力再看 A：为何同起终点，累计爬升却更多？"},
  {name:"解释迁移", time:"15–20 分钟", question:"你会怎样取舍？请引用两条路线的证据。", task:"用“我优先考虑……，因此选择……，代价是……”解释。再想一想：这些证据能直接确定真实出行安全吗？"},
];
const bRoute = routeAnalyses.find(r=>r.id==="B")!;
const cRoute = routeAnalyses.find(r=>r.id==="C")!;

export default function TerrainLab() {
  const { isClassroom } = useExperienceMode();
  const rootRef = useRef<HTMLElement>(null);
  const [routeId, setRouteId] = useState<RouteId>("B");
  const [progress, setProgress] = useState(0);
  const [interval, setInterval] = useState(100);
  const [slice, setSlice] = useState(600);
  const [showSlice, setShowSlice] = useState(false);
  const [exaggeration, setExaggeration] = useState(1);
  const [view, setView] = useState<"perspective" | "top">("perspective");
  const [bearing, setBearing] = useState(28);
  const [cameraReset, setCameraReset] = useState(0);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<RouteId[]>([]);
  const [prediction, setPrediction] = useState<RouteId | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const selected = routeAnalyses.find(r => r.id === routeId)!;
  const point = selected.samples[Math.round(progress / 100 * (selected.samples.length - 1))]!;
  const recorded = routeAnalyses.filter(r=>saved.includes(r.id));
  const canCompare = saved.includes("B") && saved.includes("C");
  const stage = stages[step]!;
  useEffect(()=>{
    const changed = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange",changed);
    return ()=>document.removeEventListener("fullscreenchange",changed);
  },[]);
  function changeStep(next:number) {
    setStep(next);
    rootRef.current?.scrollIntoView({block:"start",behavior:"instant"});
  }
  function resetCamera() { setView("perspective"); setBearing(28); setCameraReset(n=>n+1); }
  function reset() {
    setRouteId("B"); setProgress(0); setInterval(100); setSlice(600); setShowSlice(false); setExaggeration(1); resetCamera();
    setStep(0); setSaved([]); setPrediction(null); setShowReference(false); setShowReading(false); setTransfer(null); setOverlay(true);
  }
  function chooseRoute(id:RouteId) {setRouteId(id); setProgress(0);}
  async function toggleFullscreen() {
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
      setFullscreenError("");
    } catch {setFullscreenError("当前浏览器不支持全屏，可使用课堂布局继续展示。");}
  }
  function steepest() {
    let index=1, steepness=0;
    selected.samples.slice(1).forEach((p,i)=>{
      const before=selected.samples[i]!;
      const slope=Math.abs(p.elevation-before.elevation)/(p.distance-before.distance);
      if(slope>steepness){steepness=slope;index=i+1;}
    });
    setProgress(index/(selected.samples.length-1)*100);
  }
  function download() {
    const rows = ["路线,水平路程_km,累计爬升_m,最大局部坡度_deg", ...recorded.map(r=>`${r.id} ${r.name},${(r.distance/1000).toFixed(2)},${Math.round(r.climb)},${r.maxSlope.toFixed(1)}`), "说明,GeoQuest虚构地形教学模型v2.0,241个等水平距离采样点,不用于真实出行"];
    const url = URL.createObjectURL(new Blob(["\uFEFF"+rows.join("\n")], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "GeoQuest-路线证据.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return <article ref={rootRef} className={`terrain-lab terrain-lesson step-${step} ${isClassroom ? "terrain-classroom" : ""}`}>
    <header className="terrain-heading">
      <div><div className="terrain-eyebrow">地形实验室 · 七年级 · 20 分钟探究</div><h1>把等高线，读成一座山。</h1></div>
      <div className="terrain-heading-actions"><Link to={isClassroom ? "/topics/contour-rescue" : "/topics/contour-rescue?mode=classroom"}>{isClassroom ? "退出课堂" : "课堂展示 ↗"}</Link><button onClick={()=>void toggleFullscreen()}>{fullscreen ? "退出全屏" : "全屏投影"}</button><button onClick={reset}>重置实验</button></div>
    </header>
    {fullscreenError && <p role="status">{fullscreenError}</p>}
    <nav className="terrain-steps" aria-label="探究步骤">{stages.map((s,i)=><button key={s.name} aria-current={step===i ? "step":undefined} onClick={()=>changeStep(i)}><span>0{i+1}</span>{s.name}<small>{s.time}</small></button>)}<div className="terrain-step-arrows"><button disabled={step===0} onClick={()=>changeStep(step-1)} aria-label="上一环节">←</button><button disabled={step===3} onClick={()=>changeStep(step+1)} aria-label="下一环节">→</button></div></nav>
    <section className="terrain-prompt" aria-label="本环节任务"><div><h2>{stage.question}</h2><p>{stage.task}</p></div>
      {step===0 ? <div className="terrain-prediction"><span>我的预测 · 最大坡度较小</span><div>{routeAnalyses.map(r=><button key={r.id} aria-label={`预测 ${r.id} 线最大坡度较小`} aria-pressed={prediction===r.id} onClick={()=>setPrediction(r.id)}>{r.id} 线</button>)}</div><small aria-live="polite">{prediction ? `已预测 ${prediction} 线，稍后用证据检验。` : "可先口头讨论，再选择。"}</small></div>
      : <div className="terrain-route-picker"><span>当前路线{prediction ? ` · 原预测 ${prediction}` : ""}</span><div>{routeAnalyses.map(r=><button key={r.id} style={{"--route-color":r.color} as React.CSSProperties} aria-label={`${r.id} ${r.name}`} aria-pressed={r.id===routeId} onClick={()=>chooseRoute(r.id)}>{r.id}<small>{r.name}</small>{saved.includes(r.id) && <span aria-label="已记录">✓</span>}</button>)}</div></div>}
    </section>
    <div className="terrain-workspace" hidden={step===3}>
      <section className="terrain-stage" aria-label="三维地形工作台">
        <div className="terrain-stage-heading"><span>三维地形 <small>虚构山地 · 垂直 {exaggeration}×</small></span><div><button aria-pressed={view==="perspective"} onClick={()=>{setView("perspective");setCameraReset(n=>n+1);}}>立体</button><button aria-pressed={view==="top"} onClick={()=>{setView("top");setCameraReset(n=>n+1);}}>俯视</button></div></div>
        <TerrainScene routeId={routeId} progress={progress} interval={interval} slice={slice} showSlice={showSlice} exaggeration={exaggeration} view={view} bearing={bearing} cameraReset={cameraReset}/>
        <div className="terrain-stage-bottom"><span>拖动旋转 · 双指缩放<br/><small>S 起点 → T 终点 · A 西侧 / B 直达 / C 折返</small></span><div><button aria-label="向左旋转地形" onClick={()=>{setView("perspective");setBearing(b=>b-30);}}>↶</button><button aria-label="向右旋转地形" onClick={()=>{setView("perspective");setBearing(b=>b+30);}}>↷</button><button onClick={resetCamera}>复位视角</button></div></div>
        <div className="terrain-height-legend"><span>海拔 m</span><span className="terrain-ramp"><i/><span>0</span><span>600</span><span>1,200+</span></span></div>
      </section>
      <aside className="terrain-map-panel" aria-label="等高线与显示设置">
        <div className="terrain-panel-heading"><h2>同一座山的等高线</h2><span>上北下南</span></div>
        <TerrainMap interval={interval} routeId={routeId} progress={progress} showSlice={showSlice} slice={slice}/>
        <div className="terrain-map-caption">水平范围 4 × 3 km · 等高距 {interval} m</div>
        {step<2 && <><div className="terrain-settings"><label>等高距<select aria-label="等高距" value={interval} onChange={e=>setInterval(Number(e.target.value))}><option value={50}>50 m</option><option value={100}>100 m</option><option value={200}>200 m</option></select></label><label>垂直夸张<select aria-label="垂直夸张" value={exaggeration} onChange={e=>setExaggeration(Number(e.target.value))}><option value={1}>1× · 原始比例</option><option value={1.5}>1.5× · 放大</option><option value={2}>2× · 放大</option></select></label></div>
        <label className="terrain-toggle"><input type="checkbox" checked={showSlice} onChange={e=>setShowSlice(e.target.checked)}/>显示水平切片 <strong>{slice} m</strong></label>
        {showSlice && <label className="terrain-range">同一海拔面（非水面）<input aria-label="切片高度" type="range" min={200} max={1000} step={50} value={slice} onChange={e=>setSlice(Number(e.target.value))}/></label>}
        <p className="terrain-note">同一张图内比较疏密；改变等高距或垂直夸张，原始地形不变。</p></>}
      </aside>
    </div>
    {step===1 && <div className="terrain-reading"><button onClick={()=>setShowReading(s=>!s)} aria-expanded={showReading}>{showReading ? "收起读图提示" : "展开读图提示"}</button>{showReading && <p>闭合线内侧标高逐渐增大，对应山顶；两山顶之间的低处是鞍部。只有在比例尺、等高距相同时，才可直接用等高线疏密比较坡度。切片与山体相交的位置具有相同海拔。</p>}</div>}
    {step>=2 && <section className="terrain-evidence" aria-label="路线比较与剖面">
      <div className="terrain-profile"><div className="terrain-panel-heading"><h2>{routeId} 线 · 沿途高程</h2><span>观察点 {Math.round(point.elevation)} m · 已走 {(point.distance/1000).toFixed(2)} km</span></div>
        <TerrainProfile routeId={routeId} progress={progress} comparison={step===3 && overlay ? saved : []}/>
        <div className="terrain-progress"><label htmlFor="terrain-progress">沿路线观察</label><input id="terrain-progress" aria-label="沿路线观察" type="range" min={0} max={100} step="any" value={progress} onChange={e=>setProgress(Number(e.target.value))}/><output>{Math.round(progress)}%</output><button onClick={steepest}>定位最陡段</button></div>
        {step===3 && <label className="terrain-toggle"><input type="checkbox" checked={overlay} onChange={e=>setOverlay(e.target.checked)}/>叠加已记录路线 · 相同横纵刻度</label>}
      </div>
      <div className="terrain-numbers" aria-live="polite"><div><small>水平路程</small><strong>{(selected.distance/1000).toFixed(2)}<em> km</em></strong></div><div><small>累计爬升</small><strong>{Math.round(selected.climb)}<em> m</em></strong></div><div><small>最大局部坡度 ≈</small><strong>{selected.maxSlope.toFixed(1)}<em> °</em></strong></div><button disabled={saved.includes(routeId)} onClick={()=>setSaved(s=>s.includes(routeId)?s:[...s,routeId])}>{saved.includes(routeId) ? "已记入证据" : "＋ 记入证据"}</button><p className="terrain-record-status" role="status">已记录 {saved.length} / 3{!canCompare ? " · 请对照 B、C" : " · 可进入解释环节"}</p></div>
      {step===2 && <p className="terrain-measure-note">累计爬升 = 各上坡段升高之和（下坡不抵扣）；最大局部坡度为采样估计。剖面纵向放大，请读数比较，不直接量图上角度。</p>}
    </section>}
    {step===3 && <section className="terrain-reflection" aria-label="探究结论">
      <div className="terrain-discussion"><h2>先展示证据，再解释取舍</h2><p>相同起终点的净高差约 {Math.round(bRoute.samples.at(-1)!.elevation-bRoute.samples[0]!.elevation)} m。它和累计爬升是同一个概念吗？</p><button disabled={!canCompare} onClick={()=>setShowReference(s=>!s)} aria-expanded={showReference && canCompare}>{showReference && canCompare ? "收起讨论参考" : "显示讨论参考"}</button>{!canCompare && <p>先记录 B、C 两线，形成可核对的对照。</p>}
        {showReference && canCompare && <div className="terrain-answer"><p>B 线较短（{(bRoute.distance/1000).toFixed(2)} km）；C 线绕行更长（{(cRoute.distance/1000).toFixed(2)} km），但最大局部坡度较小（约 {cRoute.maxSlope.toFixed(1)}°，B 约 {bRoute.maxSlope.toFixed(1)}°）。</p><p>两线爬升都约 1,040 m，相差约 {Math.round(bRoute.climb-cRoute.climb)} m。不能用这几米就断言哪条“更省力”；还需考虑路程、陡坡和体能。{saved.includes("A") ? "A 线翻越西侧山体后下降再上升，因此有额外爬升。" : "还可记录 A 线，检查翻越西侧山体是否增加爬升。"}</p></div>}
        <fieldset className="terrain-transfer"><legend>离堂一问：等高距从 100 m 改为 50 m，线更密，说明……</legend>{["山变陡了","表示更细了，山没有变"].map(answer=><button key={answer} aria-pressed={transfer===answer} onClick={()=>setTransfer(answer)}>{answer}</button>)}{transfer && <p role="status">{transfer==="山变陡了" ? "再想想：改变的是绘图间隔，高程和水平距离没有改变。" : "对。比较陡缓前，先确认比例尺与等高距相同。"}</p>}</fieldset>
      </div>
      <div className="terrain-notebook"><strong>我的路线证据 <span>{saved.length} / 3</span></strong>{saved.length ? <><div className="terrain-table-scroll"><table><caption>已记录路线</caption><thead><tr><th>路线</th><th>路程 km</th><th>爬升 m</th><th>最大坡度 °</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{recorded.map(r=><tr key={r.id}><th scope="row">{r.id}</th><td>{(r.distance/1000).toFixed(2)}</td><td>{Math.round(r.climb)}</td><td>{r.maxSlope.toFixed(1)}</td><td><button aria-label={`移除 ${r.id} 线证据`} onClick={()=>{setSaved(s=>s.filter(id=>id!==r.id));setShowReference(false);}}>移除</button></td></tr>)}</tbody></table></div><button onClick={download}>导出证据 CSV ↓</button></> : <p>切换路线并点击“记入证据”，即可在这里对照。</p>}<p>证据留在本页；刷新前可导出保存。</p></div>
    </section>}
    <details className="terrain-method"><summary>模型、来源与适用范围</summary><p>这是原创虚构山地，不对应真实地点。三维网格、等高线、路线剖面共用同一高程函数。D3 从 121 × 91 个高程采样点生成等高线；每条路线用 241 个等水平距离采样点计算爬升与局部坡度。水平路程不含高差，最大局部坡度为采样估计值。垂直夸张不改变计算。所有剖面使用相同刻度，图上的角度不是真实坡度角。</p><p>水平切片表示同一海拔面，并非洪水淹没范围。模型没有道路、天气、植被、地质灾害和体能条件，不能据此判断真实出行或救援安全。</p><p>渲染与相机：<a href="https://github.com/mrdoob/three.js">Three.js / OrbitControls（MIT）</a>；等高线：<a href="https://github.com/d3/d3-contour">d3-contour（ISC）</a>。库随站点自托管，核心操作无需外部接口。预测与证据只保留在当前页面，刷新清除。</p></details>
  </article>;
}

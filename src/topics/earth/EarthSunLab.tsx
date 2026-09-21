import {useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {useExperienceMode} from "../../app/ExperienceMode";
import EarthScene,{type EarthSceneProps} from "./EarthScene";
import {OrbitDiagram,DaylightBar,SolarPath} from "./EarthDiagrams";
import {earthState,measureSeason,seasons,orbitLabel,evidenceKey,comparablePair,type EarthEvidence} from "./earthModel";
import "./earth.css";
const lessons=[
  {name:"提出预测",time:"0–3 分钟",question:"同一个地点，为什么会从白天走进黑夜？",task:"先找到地表观测点 P。预测：一天之内，主要是哪一种运动让它进入、离开受光区？"},
  {name:"跟随一天",time:"3–8 分钟",question:"让地球自转，跟着 P 看一次昼夜交替。",task:"固定三月分点、40°N。分别观察 00:00、06:00、12:00、18:00，记录一个白昼和一个黑夜时刻。"},
  {name:"比较一年",time:"8–15 分钟",question:"同一纬度，两次至日的日照有什么不同？",task:"先记录 23.4°倾角下的六月、十二月至日；保持纬度不变，再改为 0°重复记录，检验四季的成因。"},
  {name:"证据解释",time:"15–20 分钟",question:"用对照证据，解释昼夜和季节的变化。",task:"说明实验改变了什么、保持了什么。比较南北半球，再回答：在距离固定的模型中，季节差异还能出现吗？"},
];
const clock=(hour:number)=>{const minutes=Math.round(hour*60);return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;};
export default function EarthSunLab(){
  const {isClassroom}=useExperienceMode();const root=useRef<HTMLElement>(null);
  const [step,setStep]=useState(0),[orbit,setOrbit]=useState(90),[tilt,setTilt]=useState(23.4),[latitude,setLatitude]=useState(40),[hour,setHour]=useState(12);
  const [view,setView]=useState<EarthSceneProps["view"]>("light"),[cameraReset,setCameraReset]=useState(0);
  const [prediction,setPrediction]=useState<string|null>(null),[records,setRecords]=useState<EarthEvidence[]>([]);
  const [dayRecords,setDayRecords]=useState<{hour:number;light:string;altitude:number}[]>([]);
  const [playing,setPlaying]=useState(false),[reduced,setReduced]=useState(()=>matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [reference,setReference]=useState(false),[transfer,setTransfer]=useState<string|null>(null),[full,setFull]=useState(false),[message,setMessage]=useState("");
  const effectiveOrbit=step<2?0:orbit,effectiveTilt=step<2?23.4:tilt,effectiveLatitude=step<2?40:latitude,effectiveHour=step===1?hour:12;
  const state=earthState(effectiveOrbit,effectiveTilt,effectiveLatitude,effectiveHour),reading=measureSeason(orbit,tilt,latitude);
  const realPair=comparablePair(records,23.4),zeroPair=comparablePair(realPair?records.filter(r=>r.latitude===realPair[0].latitude):records,0);
  const matchingZero=realPair&&zeroPair&&realPair[0].latitude===zeroPair[0].latitude;
  const already=records.some(r=>evidenceKey(r)===evidenceKey(reading));
  const lesson=lessons[step]!;
  useEffect(()=>{
    const media=matchMedia("(prefers-reduced-motion: reduce)");const motion=()=>{setReduced(media.matches);if(media.matches)setPlaying(false);};
    const visibility=()=>{if(document.hidden)setPlaying(false);};const fullscreen=()=>setFull(document.fullscreenElement===root.current);
    media.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility);document.addEventListener("fullscreenchange",fullscreen);
    return()=>{media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);document.removeEventListener("fullscreenchange",fullscreen);};
  },[]);
  useEffect(()=>{
    if(!playing||step!==1||reduced)return;
    let frame=0,last=0;
    const tick=(t:number)=>{if(last)setHour(h=>(h+Math.min((t-last)/1000,.1)*.9)%24);last=t;frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[playing,step,reduced]);
  function go(next:number){setPlaying(false);setStep(next);requestAnimationFrame(()=>root.current?.scrollIntoView({block:"start",behavior:"instant"}));}
  function setTime(value:number){setPlaying(false);setHour(Math.max(0,Math.min(24,value)));}
  function reset(){setStep(0);setOrbit(90);setTilt(23.4);setLatitude(40);setHour(12);setView("light");setCameraReset(n=>n+1);setPrediction(null);setRecords([]);setDayRecords([]);setPlaying(false);setReference(false);setTransfer(null);setMessage("");}
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen();setMessage("");}catch{setMessage("此浏览器未允许全屏，可继续使用课堂布局。");}}
  function recordSeason(){if(already)return;setRecords(rows=>[...rows,reading]);setReference(false);}
  function download(){
    const payload={topic:"GQ-T003",version:"2.0.0",prediction,dayObservations:dayRecords,seasonObservations:records,units:{orbit:"deg from March equinox",tilt:"deg from orbital normal",latitude:"deg N; south uses opposite latitude",north:"hours",south:"hours",noon:"deg",declination:"deg"},model:"Circular orbit, constant axis, 24-hour solar day, point Sun and ideal horizon; no refraction or weather."};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="GeoQuest-地球与太阳-实验记录.json";a.click();URL.revokeObjectURL(url);
  }
  return <article ref={root} className={`earth-lab earth-step-${step} ${isClassroom?"earth-classroom":""}`}>
    <header className="earth-heading"><div><span>02 / 地球实验室 · 七年级 · 20 分钟探究</span><h1>地球与太阳</h1></div><div className="earth-actions"><Link to={isClassroom?"/topics/earth-motion-lab":"/topics/earth-motion-lab?mode=classroom"}>{isClassroom?"退出课堂":"课堂展示"}</Link><button onClick={()=>void fullscreen()}>{full?"退出全屏":"全屏投影"}</button><button onClick={reset}>重置实验</button></div></header>
    {message&&<p role="status">{message}</p>}
    <nav className="earth-steps" aria-label="地球探究步骤">{lessons.map((l,i)=><button key={l.name} aria-current={step===i?"step":undefined} onClick={()=>go(i)}><span>0{i+1}</span>{l.name}<small>{l.time}</small></button>)}<div><button disabled={step===0} aria-label="上一环节" onClick={()=>go(step-1)}>←</button><button disabled={step===3} aria-label="下一环节" onClick={()=>go(step+1)}>→</button></div></nav>
    <section className="earth-prompt" aria-label="本环节任务"><div><h2>{lesson.question}</h2><p>{lesson.task}</p></div>{step===0?<div className="earth-prediction"><span>我的预测</span><div>{["地球自转","地球公转"].map(p=><button key={p} aria-pressed={prediction===p} onClick={()=>setPrediction(p)}>{p}</button>)}</div><small>{prediction?`已预测：${prediction}，接下来验证。`:"先说理由，再选择。"}</small></div>:<span className="earth-context">{step===1?"固定条件：三月分点 · 40°N":step===2?"固定距离 · 改变公转位置与地轴倾角":"先核对条件，再引用数字"}{prediction&&<small>原预测：{prediction}</small>}</span>}</section>
    <div className="earth-board" hidden={step===3}>
      <section className="earth-stage" aria-label="地球光照工作台"><div className="earth-stage-head"><strong>地球近景 <small>地轴倾角 {effectiveTilt}°</small></strong><span>黄色箭头：太阳光</span></div>
        <EarthScene orbit={effectiveOrbit} tilt={effectiveTilt} latitude={effectiveLatitude} hour={effectiveHour} view={view} reset={cameraReset}/>
        <div className="earth-view-controls">{([["light","光照视角"],["observer","跟随 P 点"],["north","北极上空"]] as const).map(([v,label])=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);setCameraReset(n=>n+1);}}>{label}</button>)}<button onClick={()=>{setView("light");setCameraReset(n=>n+1);}}>复位视角</button></div>
        <div className="earth-stage-key"><span>金线：赤道</span><span>青线：{effectiveLatitude}°N</span><span>拖动旋转 · 滚轮缩放</span></div>
        {step!==1&&<aside className="earth-orbit-inset"><strong>公转位置 · 轨道北侧俯视</strong><OrbitDiagram orbit={effectiveOrbit} tilt={effectiveTilt}/><small>{effectiveTilt===0?"地轴垂直轨道面（圆点表示）":"黄色轴标记：北端朝向始终相同"}</small></aside>}
        <p className="earth-scale-note">球体与轨道分开示意，不按大小、距离比例绘制</p>
      </section>
      <aside className="earth-panel" aria-label="实验控制与读数">
        {step===0&&<div className="earth-intro"><span>一个点 · 两种时间尺度</span><h2>先看一天，<br/>再比较一年。</h2><p>近景中的 P 是地表固定点。地球自转时，它跟着地表移动。</p><p>小图显示地球在公转轨道上的位置。大图用于看清地轴、光照与观测点。</p><button onClick={()=>go(1)}>开始跟随一天 →</button><p className="earth-small">这里没有大陆底图；经纬线与观测点用于解释光照，不代表真实地点。</p></div>}
        {step===1&&<><div className="earth-panel-title"><h2>只改变一天中的时刻</h2><span>地方太阳时</span></div><div className="earth-time-presets">{[0,6,12,18].map(h=><button key={h} aria-pressed={Math.abs(hour-h)<.01} onClick={()=>setTime(h)}>{clock(h)}</button>)}</div><label className="earth-slider">地方太阳时 <output>{clock(hour)}</output><input aria-label="地方太阳时" type="range" min="0" max="24" step="0.25" value={hour} onChange={e=>setTime(Number(e.target.value))}/></label><div className="earth-play"><button disabled={reduced} aria-pressed={playing} onClick={()=>setPlaying(p=>!p)}>{playing?"暂停自转":"播放自转"}</button><span>从北极上空看：逆时针</span></div>{reduced&&<p className="earth-small">已开启减少动态效果，请用时刻按钮逐步观察。</p>}
          <div className="earth-current" aria-live={playing?"off":"polite"}><strong>{state.light}</strong><span>太阳高度 <b>{state.altitude.toFixed(1)}°</b></span></div><SolarPath orbit={0} tilt={23.4} latitude={40} hour={hour}/><p className="earth-small">横轴：地方太阳时；负太阳高度表示地平线以下。</p><button className="earth-primary" disabled={dayRecords.some(r=>Math.abs(r.hour-hour)<.01)||dayRecords.length>=6} onClick={()=>{setPlaying(false);setDayRecords(rows=>[...rows,{hour,light:state.light,altitude:state.altitude}]);}}>记录这个时刻</button><div className="earth-day-records" aria-live="polite">{dayRecords.map((r,i)=><button key={i} aria-label={`移除 ${clock(r.hour)} ${r.light}记录`} onClick={()=>setDayRecords(rows=>rows.filter((_,j)=>j!==i))}>{clock(r.hour)} {r.light} ×</button>)}{!dayRecords.length&&<small>先记录白昼，再记录黑夜；最多 6 条。</small>}</div></>}
        {step===2&&<><div className="earth-panel-title"><h2>一次只改变一个条件</h2><span>读数均为理论值</span></div><div className="earth-seasons">{seasons.map(s=><button key={s.orbit} aria-pressed={orbit%360===s.orbit} onClick={()=>setOrbit(s.orbit)}>{s.name}</button>)}</div><label className="earth-slider">公转位置 <output>{orbit}°</output><input aria-label="公转位置" type="range" min="0" max="360" step="5" value={orbit} onChange={e=>setOrbit(Number(e.target.value))}/></label>
          <div className="earth-condition-row"><fieldset><legend>地轴倾角（相对轨道面垂线）</legend><button aria-pressed={tilt===23.4} onClick={()=>setTilt(23.4)}>23.4° 实际近似</button><button aria-pressed={tilt===0} onClick={()=>setTilt(0)}>0° 对照实验</button></fieldset><label>南北对照纬度<select aria-label="南北对照纬度" value={latitude} onChange={e=>setLatitude(Number(e.target.value))}><option value="0">赤道 0°</option><option value="20">南北纬 20°</option><option value="40">南北纬 40°</option><option value="70">南北纬 70°</option><option value="80">南北纬 80°</option></select></label></div>
          <div className="earth-sun-reading" aria-live="polite"><span>直射纬度 <strong>{Math.abs(reading.declination).toFixed(1)}°{Math.abs(reading.declination)<.01?"（赤道）":reading.declination>0?"N":"S"}</strong></span><span>{latitude}°N 正午太阳高度 <strong>{reading.noon.toFixed(1)}°</strong></span></div>
          <div className="earth-daylight" aria-live="polite"><DaylightBar hours={reading.north} label={latitude===0?"赤道":`北纬 ${latitude}°`}/><DaylightBar hours={reading.south} label={latitude===0?"赤道对照":`南纬 ${latitude}°`}/><p>金色为白昼，深色为黑夜 · 每条均为 24 h</p></div>
          <button className="earth-primary" disabled={already||records.length>=12} onClick={recordSeason}>{already?"已记录此情景":"记录此情景"}</button><p className="earth-record-status" role="status">已记录 {records.length} 条{records.length>=12?" · 可在解释环节移除":realPair?" · 已有同纬度至日对照":" · 先对照六月与十二月"}</p><p className="earth-small">固定在地方正午；近景随公转调整，地轴朝向见轨道图。</p></>}
      </aside>
    </div>
    {step===3&&<section className="earth-synthesis"><div className="earth-notebook"><div className="earth-panel-title"><h2>我的四季证据</h2><span>{records.length} / 12 条</span></div>{records.length?<><div className="earth-table-scroll"><table><caption>同纬度、同倾角，才能直接比较公转位置的影响</caption><thead><tr><th>公转位置</th><th>倾角</th><th>纬度</th><th>北昼 h</th><th>南昼 h</th><th>北正午 °</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{records.map(r=><tr key={evidenceKey(r)}><th scope="row">{orbitLabel(r.orbit)}</th><td>{r.tilt}°</td><td>±{r.latitude}°</td><td>{r.north.toFixed(1)}</td><td>{r.south.toFixed(1)}</td><td>{r.noon.toFixed(1)}</td><td><button aria-label={`移除 ${orbitLabel(r.orbit)} ${r.tilt}度 ${r.latitude}纬度记录`} onClick={()=>{setRecords(rows=>rows.filter(row=>evidenceKey(row)!==evidenceKey(r)));setReference(false);}}>移除</button></td></tr>)}</tbody></table></div><button onClick={download}>导出实验记录 JSON ↓</button></>:<p>还没有四季证据。返回“比较一年”，记录六月和十二月至日。</p>}<p className="earth-small">预测与证据只留在本页，刷新即清除。改变模式不清除。</p><div className="earth-day-summary"><h3>一天的观察</h3>{dayRecords.length?<p>{dayRecords.map(r=>`${clock(r.hour)} ${r.light}（${r.altitude.toFixed(1)}°）`).join("；")}</p>:<p>可回到“跟随一天”记录 P 点的昼夜变化。</p>}</div></div>
      <div className="earth-explanation"><h2>先解释，再展开参考</h2><p>“我们保持……不变，改变……，发现北纬……的昼长从……变成……，而南纬……。”</p><button disabled={!realPair} aria-expanded={reference&&!!realPair} onClick={()=>setReference(v=>!v)}>{reference&&realPair?"收起讨论参考":"显示讨论参考"}</button>{!realPair&&<p className="earth-small">先记录同一个非零纬度、23.4°倾角下的六月与十二月至日。</p>}{reference&&realPair&&<div className="earth-answer"><p>{realPair[0].latitude}°N 的理论昼长：六月 {realPair[0].north.toFixed(1)} h，十二月 {realPair[1].north.toFixed(1)} h；同纬度南半球的变化方向相反。距离相同，日照仍有季节差异。</p><p>{matchingZero?`同纬度改为 0°倾角后，两次昼长都为 ${zeroPair[0].north.toFixed(1)} h。地轴倾斜与公转共同改变直射纬度、昼长和正午太阳高度。`:"再在相同纬度记录 0°倾角的两次至日，才能补齐倾角对照。"}</p><p>自转让地点进入、离开受光半球；四季主因是地轴倾斜与公转，不能把昼夜和四季都归因于日地距离。日照变化也不等于当天气温。</p></div>}
      <fieldset className="earth-transfer"><legend>离堂一问：北半球六月昼长较长，同纬度南半球怎样？</legend>{["也更长，因为离太阳近","较短，两半球变化相反"].map(t=><button key={t} aria-pressed={transfer===t} onClick={()=>setTransfer(t)}>{t}</button>)}{transfer&&<p role="status">{transfer.startsWith("较短")?"对。请再从证据表找出一对数字支持解释。":"检查南北昼长条：两地与太阳的距离近似相同，但倾向太阳的一侧不同。"}</p>}</fieldset></div>
    </section>}
    <details className="earth-method"><summary>模型、来源与适用范围</summary><p>光照、P 点位置、太阳高度和理论昼长共用一套球面几何。昼夜实验固定三月分点与 40°N；一年实验使用圆形轨道、保持地轴空间朝向，日地距离不变。真实轨道略呈椭圆，本模型用于控制变量，不按实际大小、距离、运行速度绘制。23.4°为地轴相对轨道面垂线的倾角。</p><p>一天按 24 小时太阳日表示，自转展示是固定公转位置下的近似；不等于约 23 小时 56 分的恒星日。理论日出日落以太阳中心跨越理想地平线为界，忽略大气折射、太阳视半径、地形、时区与均时差；不能当作当地钟表时间或天气预报。观测范围限于 ±80°，不处理极点分日退化情形；负太阳高度保留以表示极夜。</p><p>事实核对：<a href="https://science.nasa.gov/earth/facts/">NASA Earth Facts</a>、<a href="https://spaceplace.nasa.gov/seasons/en/">NASA 四季成因</a>、<a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF">NOAA 太阳位置公式</a>（2026-09-17 核验，仅参考事实与公式，不复制图片）。三维复用自托管的 <a href="https://github.com/mrdoob/three.js">Three.js / OrbitControls（MIT）</a>，其余图形与任务为原创，无外部课程接口。</p></details>
  </article>;
}

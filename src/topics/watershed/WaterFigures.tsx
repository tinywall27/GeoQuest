import {type WaterResult,type WaterFrame} from './waterModel';
const fmt=(n:number)=>Math.round(n).toLocaleString('en-US');
export function SlopeFigure({result,frame,label}:{result:WaterResult;frame:WaterFrame;label:string}){
  const cover=result.input.cover;
  return <svg viewBox="0 0 380 245" role="img" aria-label={`${label}，植被覆盖${cover}%，累计降雨${frame.rainfall.toFixed(1)}毫米，入渗${frame.infiltration.toFixed(1)}毫米，坡面径流${fmt(frame.runoff)}立方米`}>
    <rect width="380" height="245" rx="10" fill="#eaf3f2"/><text x="18" y="27" className="wf-title">{label} · 覆盖 {cover}%</text>
    <path d="M18 88L358 180V232H18Z" fill="#c8a574"/><path d="M18 108L358 200M18 140L320 222" stroke="#aa8058" fill="none"/>
    {Array.from({length:cover===80?18:4},(_,i)=>{const x=30+i*(310/(cover===80?18:4)),y=88+(x-18)*92/340;return <g key={i} stroke="#426c42" strokeWidth="2"><path d={`M${x} ${y}v-20m0 13-7-8m7 4 7-8`}/><path d={`M${x} ${y+1}l-6 12m6-12 6 12`} stroke="#7d7950" strokeWidth="1"/></g>;})}
    {frame.intensity>0&&Array.from({length:16},(_,i)=>{const x=30+i*21,y=40+((i*11+frame.minute*2)%35);return <path key={i} d={`M${x} ${y}l-3 11`} stroke="#367ea0" strokeWidth={frame.intensity>60?2.4:1.5}/>;})}
    {[70,150,230].map(x=><path key={x} d={`M${x} ${104+(x-18)*92/340}v28m-4-5 4 5 4-5`} stroke="#27686c" strokeWidth="2" fill="none" opacity={frame.rainfall>0?1:.25}/>)}
    <path d="M48 104L326 179l-9-11m9 11-15 2" stroke="#266d94" strokeWidth={frame.inflow>0?2+frame.inflow/5:1} fill="none" opacity={frame.inflow>0?1:.25}/>
    <rect x="321" y="177" width="44" height="26" rx="3" fill="#b7d5dc" stroke="#6e8c8b"/>
    {frame.runoff>0&&Array.from({length:Math.max(1,Math.round(12*(result.erosion/100)*frame.runoff/result.runoff))},(_,i)=><circle key={i} cx={325+(i*7)%35} cy={183+(i*11)%15} r="1.6" fill="#90633b"/>)}
    <text x="23" y="220">↓ 入渗</text><text x="228" y="220">→ 地表径流</text>
    <text x="18" y="54" className="wf-small">同一雨型 · 同种土壤 · 同一坡度</text>
  </svg>;
}
export function BasinFigure({result,frame,focus}:{result:WaterResult;frame:WaterFrame;focus:string}){
  const cap=result.input.capacity,ratio=cap?frame.storage/cap:0;
  return <svg viewBox="0 0 720 270" role="img" aria-label={`虚构流域示意，分水岭内坡面汇入支流、滞蓄区和共同出口。第${frame.minute}分钟，入流${frame.inflow.toFixed(2)}、出流${frame.outflow.toFixed(2)}立方米每秒，暂存${fmt(frame.storage)}立方米`}>
    <defs><linearGradient id="water-land" x2="0" y2="1"><stop stopColor="#dae3bc"/><stop offset="1" stopColor="#a5c3a8"/></linearGradient></defs>
    <path d="M30 140L315 25L674 148L391 254Z" fill="url(#water-land)" stroke="#748b61" strokeWidth="2"/>
    <path d="M30 140v13l361 113v-12M391 266l283-105v-13" fill="#b59468" stroke="#8d7453"/>
    <path d="M52 135L315 40L647 148L390 238Z" fill="none" stroke="#5f7259" strokeDasharray="6 5"/>
    <path d="M78 132L177 39L255 114L310 57L395 137L481 86L601 153L426 194Z" fill="#b9cbb0" stroke="#94ae91"/>
    <path d="M177 39L160 104L198 96M310 57L294 117L335 106M481 86L463 127L503 134" fill="#e8ead2"/>
    <g stroke="#487346" strokeWidth="3">{Array.from({length:result.input.cover===80?20:5},(_,i)=>{const x=92+(i*37)%415,y=129+(i*13)%36;return <path key={i} d={`M${x} ${y}v-15m-7 9 7-12 7 12`}/>;})}</g>
    <g fill="none" stroke="#347b9a" strokeLinecap="round"><path d="M205 114Q218 145 337 165M325 124Q321 148 337 165M483 143Q439 170 365 179" strokeWidth={3+frame.inflow/7}/><path d="M337 165Q350 176 376 185T489 218" strokeWidth={5+frame.outflow/7}/></g>
    {cap>0?<g><ellipse cx="376" cy="185" rx={cap===12000?58:32} ry="23" fill="#d5e7e5" stroke="#447a80" strokeWidth="2"/><ellipse cx="376" cy="185" rx={(cap===12000?54:29)*Math.sqrt(ratio)} ry={20*Math.sqrt(ratio)} fill="#4e99b7"/><text x="376" y="189" textAnchor="middle" className="wf-small">{Math.round(ratio*100)}%</text></g>:<text x="365" y="208" className="wf-small">无滞蓄区</text>}
    <circle cx={focus==='坡面'?205:focus==='滞蓄区'?376:489} cy={focus==='坡面'?114:focus==='滞蓄区'?185:218} r="16" fill="none" stroke="#9a5b25" strokeWidth="3"/>
    <g className="wf-label"><text x="18" y="25">虚构流域 · 分水岭内的水汇向共同出口</text><text x="531" y="105">虚线：分水岭</text><text x="66" y="204">坡面 → 支流 → 滞蓄区 → 出口</text><text x="493" y="240">下游出口</text></g>
    {frame.spill>0&&<text x="442" y="181" fill="#994820">本时段有溢流</text>}
  </svg>;
}
export function Hydrograph({direct,stored,index,horizon}:{direct:WaterResult;stored:WaterResult;index:number;horizon:number}){
  const max=direct.input.rain===60?30:15,x=(m:number)=>45+m/horizon*635,y=(q:number)=>155-q/max*128;
  const path=(r:WaterResult)=>r.frames.slice(1,horizon/10+1).map((f,i)=>`${i?'L':'M'}${x(f.minute-10)},${y(f.outflow)}L${x(f.minute)},${y(f.outflow)}`).join('');
  return <svg className="water-hydro" viewBox="0 0 720 195" role="img" aria-label={`下游流量过程，共同坐标，横轴0至${horizon}分钟，纵轴0至${max}立方米每秒；无滞蓄峰值${direct.peak.toFixed(2)}，当前方案峰值${stored.peak.toFixed(2)}`}>
    {[0,max/2,max].map(q=><g key={q}><path d={`M45 ${y(q)}H680`} stroke="#dbe3df"/><text x="38" y={y(q)+4} textAnchor="end">{q}</text></g>)}
    <rect x={45} y={27} width={635*60/horizon} height={128} fill="#9abac6" opacity=".15"/><text x="50" y="20">降雨 0–60 分钟</text><text className="wf-unit" x="481" y="20">时段平均流量（m³/s）</text>
    <path d={path(direct)} fill="none" stroke="#9b662b" strokeWidth="2.5" strokeDasharray="6 4"/><path d={path(stored)} fill="none" stroke="#247780" strokeWidth="3"/>
    <path d={`M${x(index*10)} 27V155`} stroke="#344b57" strokeWidth="1.5"/>
    {(horizon===120?[0,30,60,90,120]:[0,60,120,240,360,480]).map(m=><text key={m} x={x(m)} y="175" textAnchor="middle">{m}</text>)}<text className="wf-unit" x="680" y="192" textAnchor="end">分钟（每段 10 分钟）</text>
  </svg>;
}
export function WaterBudget({rain,infiltration,runoff}:{rain:number;infiltration:number;runoff:number}){
  const fraction=rain?infiltration/rain:0;
  return <div className="water-budget"><div className="water-budget-bar" role="img" aria-label={`降雨${rain.toFixed(1)}毫米等于入渗${infiltration.toFixed(1)}毫米加径流${(runoff/1000).toFixed(1)}毫米`}><span style={{width:`${fraction*100}%`}}/></div><p><span>入渗 {infiltration.toFixed(1)} mm</span><span>径流 {(runoff/1000).toFixed(1)} mm</span></p></div>;
}

import {earthState,seasons,normalizeOrbit} from "./earthModel";
export function OrbitDiagram({orbit,tilt}:{orbit:number;tilt:number}){
  const r=normalizeOrbit(orbit)*Math.PI/180,x=130-70*Math.sin(r),y=105+70*Math.cos(r);
  return <svg viewBox="0 0 260 215" role="img" aria-label={`从轨道北侧看圆形公转轨道，太阳在中心，地球位于${normalizeOrbit(orbit)}度，日地距离保持不变，地轴朝向保持不变`}>
    <circle cx="130" cy="105" r="70" fill="none" stroke="#8ca5b7" strokeDasharray="4 5"/>
    <circle cx="130" cy="105" r="13" fill="#f4c569"/><text x="130" y="132" textAnchor="middle" fill="#f8dc9a" fontSize="12">太阳</text>
    {seasons.map(s=>{const a=s.orbit*Math.PI/180,px=130-70*Math.sin(a),py=105+70*Math.cos(a);return <g key={s.orbit}><circle cx={px} cy={py} r="6" fill="#55758c"/>{tilt>0&&<path d={`M${px-12} ${py}h26l-5 -3m5 3-5 3`} stroke="#f5d4a2" fill="none"/>}<text x={s.orbit===90 ? 28 : s.orbit===270 ? 233 : px} y={s.orbit===0 ? 205 : s.orbit===180 ? 15 : py+4} textAnchor="middle" fill="#e6eff5" fontSize="13">{s.short}</text></g>;})}
    <g transform={`translate(${x} ${y}) rotate(${Math.atan2(105-y,130-x)*180/Math.PI})`}><circle r="9" fill="#0b2035" stroke="#85c8e6" strokeWidth="1.5"/><path d="M0 -9A9 9 0 0 1 0 9Z" fill="#62b7d6"/></g>
    {tilt>0 ? <path d={`M${x-13} ${y}h30l-5 -4m5 4-5 4`} stroke="#ffe1ab" strokeWidth="2" fill="none"/> : <circle cx={x} cy={y} r="2" fill="#ffe1ab"/>}
    <path d="M178 166l-7 3 2-7" fill="none" stroke="#bdcedc" strokeWidth="2"/>
  </svg>;
}
export function DaylightBar({hours,label}:{hours:number;label:string}){
  return <div className="earth-day-row"><span>{label}</span><div className="earth-day-track" role="img" aria-label={`${label}理论昼长${hours.toFixed(1)}小时，夜长${(24-hours).toFixed(1)}小时`}><i style={{left:`${(24-hours)/48*100}%`,width:`${hours/24*100}%`}}/></div><strong>{hours.toFixed(1)} h</strong></div>;
}
export function SolarPath({orbit,tilt,latitude,hour}:{orbit:number;tilt:number;latitude:number;hour:number}){
  const points=Array.from({length:97},(_,i)=>earthState(orbit,tilt,latitude,i/4).altitude);
  const current=earthState(orbit,tilt,latitude,hour);
  return <svg className="earth-solar-path" viewBox="0 0 390 148" role="img" aria-label={`观测点一天的太阳高度曲线，地平线上为白昼，当前高度${current.altitude.toFixed(1)}度`}>
    <rect x="34" y="13" width="336" height="57" fill="#fff3d6"/><rect x="34" y="70" width="336" height="57" fill="#e2eaf1"/>
    {[60,0,-60].map(h=><g key={h}><path d={`M34 ${70-h*.6}H370`} stroke={h===0 ? "#677f92" : "#cdd8de"}/><text x="29" y={74-h*.6} textAnchor="end" fontSize="12" fill="#3e596c">{h}°</text></g>)}
    <path d={points.map((a,i)=>`${i?"L":"M"}${34+i/96*336} ${70-a*.6}`).join(" ")} stroke="#916119" strokeWidth="2" fill="none"/>
    <path d={`M${34+hour/24*336} 13V127`} stroke="#385d79" strokeDasharray="3 3"/><circle cx={34+hour/24*336} cy={70-current.altitude*.6} r="4" fill="#224f6d"/>
    {[0,6,12,18,24].map(h=><text key={h} x={34+h/24*336} y="143" textAnchor="middle" fontSize="13" fill="#3e596c">{h}</text>)}
    <text x="362" y="65" textAnchor="end" fontSize="12" fill="#3e596c">地平线</text>
  </svg>;
}

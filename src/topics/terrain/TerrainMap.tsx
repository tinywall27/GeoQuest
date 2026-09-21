import { useMemo } from "react";
import { contourPoint, elevationColor, getContours, routeAnalyses, type RouteId } from "./terrainModel";
export default function TerrainMap({interval, routeId, progress, showSlice, slice}: {interval:number; routeId:RouteId; progress:number; showSlice:boolean; slice:number}) {
  const selected = routeAnalyses.find(r => r.id === routeId)!;
  const point = selected.samples[Math.round(progress / 100 * (selected.samples.length - 1))]!;
  const contourShapes = useMemo(() => getContours(interval), [interval]);
  const pathFor = (points: readonly (readonly [number,number])[]) => points.map(([x,y],i) => `${i ? "L" : "M"}${x*400},${y*300}`).join(" ");
  return (<svg className="terrain-map" viewBox="0 0 400 300" role="img" aria-label={`等高距${interval}米的等高线图，当前${routeId}线，观察点海拔${Math.round(point.elevation)}米`}>
          <rect width="400" height="300" fill="#476f5b"/>
          {contourShapes.map(c=><path key={c.value} d={c.coordinates.map(p=>p.map(r=>pathFor(r.map(contourPoint))+"Z").join(" ")).join(" ")} fill={elevationColor(c.value)} fillRule="evenodd" stroke="#344d38" strokeWidth=".75"/>)}
          {contourShapes.filter(c=>c.value%200===0).map(c=>{
            const raw=c.coordinates[0]?.[0]?.find(p=>{const [x,y]=contourPoint(p);return x>.15&&x<.85&&y>.15&&y<.85;});
            if(!raw)return null;
            const [x,y]=contourPoint(raw);
            return <text key={c.value} x={x*400} y={y*300-3} fontSize="14" fill="#23392b" stroke="#e5e7d4" strokeWidth="2" paintOrder="stroke" textAnchor="middle">{c.value}</text>;
          })}
          {showSlice && getContours(slice).filter(c=>c.value===slice).map(c=><path key={c.value} d={c.coordinates.map(p=>p.map(r=>pathFor(r.map(contourPoint))+"Z").join(" ")).join(" ")} fill="none" stroke="#124e65" strokeWidth="2.5"/>)}
          {routeAnalyses.map(r=><path key={r.id} d={pathFor(r.points)} fill="none" stroke={r.color} strokeWidth={r.id===routeId ? 4 : 2} opacity={r.id===routeId ? 1 : .7} strokeDasharray={r.id===routeId ? undefined : "5 4"}/>)}
          {routeAnalyses.map(r=>{const p=r.samples[r.id==="A" ? 115 : r.id==="B" ? 150 : 60]!; return <text key={r.id} x={p.x*400-8} y={p.y*300-7} textAnchor="middle" fontSize="16" fontWeight="700" fill="#19352e" stroke="white" strokeWidth="3" paintOrder="stroke">{r.id}</text>;})}
          <circle cx={point.x*400} cy={point.y*300} r="5" fill="white" stroke="#173c35" strokeWidth="2"/>
          <g fontSize="12" fontWeight="700" textAnchor="middle"><circle cx="40" cy="264" r="11" fill="#19352e"/><text x="40" y="268" fill="white">S</text><circle cx="280" cy="99" r="11" fill="#19352e"/><text x="280" y="103" fill="white">T</text></g>
          <path d="M20 38V14l-4 8m4-8 4 8" stroke="white" strokeWidth="2" fill="none"/><text x="16" y="52" fill="white" fontSize="12">N</text>
          <path d="M285 276v5h100v-5" fill="none" stroke="white" strokeWidth="2"/><text x="335" y="270" fill="white" textAnchor="middle" fontSize="13">1 km</text>
        </svg>);
}

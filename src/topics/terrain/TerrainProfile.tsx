import { routeAnalyses, type RouteId } from "./terrainModel";

// Every route uses the same distance axis. Never stretch shorter routes to fit.
export const PROFILE_DISTANCE = 6000;
export const profileX = (distance: number) => 45 + distance / PROFILE_DISTANCE * 510;
const profileY = (height: number) => 166 - height / 1300 * 143;

export default function TerrainProfile({ routeId, progress, comparison }: {
  routeId: RouteId; progress: number; comparison: RouteId[];
}) {
  const selected = routeAnalyses.find(r => r.id === routeId)!;
  const point = selected.samples[Math.round(progress / 100 * (selected.samples.length - 1))]!;
  const visible = routeAnalyses.filter(r => r.id === routeId || comparison.includes(r.id));
  return <svg viewBox="0 0 580 205" role="img" aria-label="路线高程剖面；所有路线共用横轴0至6千米、纵轴0至1300米，图示纵向放大，不可直接量角度">
    <text x="4" y="14" fontSize="16" fill="#445346">海拔 m</text>
    {[0, 400, 800, 1200].map(h => <g key={h}><path d={`M45 ${profileY(h)}H555`} stroke="#d6dfd1"/><text x="38" y={profileY(h)+4} textAnchor="end" fontSize="16" fill="#445346">{h}</text></g>)}
    {[0, 1, 2, 3, 4, 5, 6].map(km => <g key={km}><path d={`M${profileX(km*1000)} 23V170`} stroke="#e4e9e0"/><text x={profileX(km*1000)} y="188" textAnchor="middle" fontSize="16" fill="#445346">{km}</text></g>)}
    <text x="555" y="203" textAnchor="end" fontSize="14" fill="#445346">水平路程 km（统一刻度）</text>
    {visible.map(r => <g key={r.id} data-profile-route={r.id}>
      <path d={r.samples.map((p,i) => `${i ? "L" : "M"}${profileX(p.distance)},${profileY(p.elevation)}`).join(" ")} fill="none" stroke={r.id === "A" ? "#8a5b00" : r.id === "B" ? "#ae4732" : "#176e91"} strokeWidth={r.id === routeId ? 3 : 2} strokeDasharray={r.id === "A" ? "7 3" : r.id === "C" ? "3 2" : undefined}/>
      <text x={profileX(r.distance)+5} y={profileY(r.samples.at(-1)!.elevation)+(r.id==="A" ? -6 : r.id==="B" ? 9 : 2)} fontWeight="700" fontSize="14" fill="#284334">{r.id}</text>
    </g>)}
    <path d={`M${profileX(point.distance)} 23V166`} stroke="#72501e" strokeDasharray="3 3"/>
    <circle cx={profileX(point.distance)} cy={profileY(point.elevation)} r="5" fill="white" stroke="#72501e" strokeWidth="2"/>
  </svg>;
}

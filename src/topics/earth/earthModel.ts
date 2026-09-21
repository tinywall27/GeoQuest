/** Circular-orbit teaching geometry; metres, dates and real-time ephemerides are not modeled. */
export type Vec3 = readonly [number, number, number];
const rad = (d:number) => d*Math.PI/180;
const deg = (r:number) => r*180/Math.PI;
const clamp = (n:number) => Math.max(-1,Math.min(1,n));
export const dot = (a:Vec3,b:Vec3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross = (a:Vec3,b:Vec3):Vec3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const scale = (v:Vec3,s:number):Vec3 => [v[0]*s,v[1]*s,v[2]*s];
const add = (a:Vec3,b:Vec3):Vec3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const seasons = [{orbit:0,name:"三月分点",short:"春分"},{orbit:90,name:"六月至日",short:"夏至"},{orbit:180,name:"九月分点",short:"秋分"},{orbit:270,name:"十二月至日",short:"冬至"}] as const;
export const normalizeOrbit = (n:number) => ((n%360)+360)%360;
export function orbitLabel(orbit:number) {
  const value=normalizeOrbit(orbit);
  return seasons.find(s=>Math.abs(s.orbit-value)<.001)?.name ?? `公转位置 ${Math.round(value)}°`;
}
export function dayHours(latitude:number,declination:number) {
  const a=Math.sin(rad(latitude))*Math.sin(rad(declination));
  const b=Math.cos(rad(latitude))*Math.cos(rad(declination));
  // The UI limits observation to ±80°, away from the degenerate equinox at a pole.
  if(a>=b-1e-12)return 24;
  if(a<=-b+1e-12)return 0;
  return 24*Math.acos(clamp(-a/b))/Math.PI;
}
export function earthState(orbit:number,tilt:number,latitude:number,hour:number) {
  const e=rad(tilt),l=rad(normalizeOrbit(orbit)),phi=rad(latitude),h=rad((hour-12)*15);
  // XZ is the orbital plane. The north axis stays fixed in space throughout a year.
  const axis:Vec3=[Math.sin(e),Math.cos(e),0];
  const sun:Vec3=[Math.sin(l),0,Math.cos(l)];
  const sinDelta=clamp(dot(axis,sun));
  const declination=deg(Math.asin(sinDelta));
  const projected=add(sun,scale(axis,-sinDelta));
  const noon=scale(projected,1/Math.sqrt(dot(projected,projected)));
  const east=cross(axis,noon);
  const observer=add(scale(axis,Math.sin(phi)),add(scale(noon,Math.cos(phi)*Math.cos(h)),scale(east,Math.cos(phi)*Math.sin(h))));
  const altitude=deg(Math.asin(clamp(dot(observer,sun))));
  const light=altitude>1e-7 ? "白昼" : altitude< -1e-7 ? "黑夜" : "晨昏交界";
  const equatorX:Vec3=[Math.cos(e),-Math.sin(e),0];
  const spinAngle=Math.atan2(dot(sun,cross(axis,equatorX)),dot(sun,equatorX))+h;
  return {axis,sun,observer,declination,altitude,light,spinAngle,daylight:dayHours(latitude,declination),noonAltitude:90-Math.abs(latitude-declination)};
}
export interface EarthEvidence {orbit:number;tilt:number;latitude:number;north:number;south:number;noon:number;declination:number}
export const evidenceKey = (r:Pick<EarthEvidence,"orbit"|"tilt"|"latitude">) => `${normalizeOrbit(r.orbit)}:${r.tilt}:${r.latitude}`;
export function measureSeason(orbit:number,tilt:number,latitude:number):EarthEvidence {
  const s=earthState(orbit,tilt,latitude,12);
  return {orbit:normalizeOrbit(orbit),tilt,latitude,north:s.daylight,south:dayHours(-latitude,s.declination),noon:s.noonAltitude,declination:s.declination};
}
export function comparablePair(rows:EarthEvidence[],tilt:number) {
  const june=rows.find(r=>r.orbit===90&&r.tilt===tilt&&r.latitude>0&&rows.some(s=>s.orbit===270&&s.latitude===r.latitude&&s.tilt===tilt));
  return june ? [june,rows.find(r=>r.orbit===270&&r.latitude===june.latitude&&r.tilt===tilt)!] as const : undefined;
}

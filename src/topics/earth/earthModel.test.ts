import {describe,it,expect} from "vitest";
import {earthState,dayHours,dot,measureSeason,comparablePair,orbitLabel} from "./earthModel";
describe("earth and sun shared geometry",()=>{
  it("keeps the north axis fixed and places solstice light on the correct hemisphere",()=>{
    const base=earthState(0,23.4,40,12);
    for(const [o,d] of [[0,0],[90,23.4],[180,0],[270,-23.4],[360,0]]){
      const s=earthState(o!,23.4,40,12);expect(s.axis).toEqual(base.axis);expect(s.declination).toBeCloseTo(d!,8);
      expect(dot(s.sun,s.sun)).toBeCloseTo(1,10);
    }
    expect(orbitLabel(360)).toBe("三月分点");expect(orbitLabel(355)).toBe("公转位置 355°");
  });
  it("links the rendered observer to independent solar altitude geometry",()=>{
    for(const orbit of [0,65,90,270])for(const lat of [-70,0,40,80])for(const hour of [0,6,12,18,23]){
      const s=earthState(orbit,23.4,lat,hour),r=Math.PI/180;
      const expected=Math.sin(lat*r)*Math.sin(s.declination*r)+Math.cos(lat*r)*Math.cos(s.declination*r)*Math.cos((hour-12)*15*r);
      expect(dot(s.observer,s.sun)).toBeCloseTo(expected,10);expect(dot(s.observer,s.observer)).toBeCloseTo(1,10);
    }
  });
  it("shows dawn, noon, dusk and night at the equinox",()=>{
    expect(earthState(0,23.4,40,0).light).toBe("黑夜");
    expect(earthState(0,23.4,40,6).light).toBe("晨昏交界");
    expect(earthState(0,23.4,40,12).altitude).toBeCloseTo(50,8);
    expect(earthState(0,23.4,40,18).light).toBe("晨昏交界");
    earthState(0,23.4,40,24).observer.forEach((n,i)=>expect(n).toBeCloseTo(earthState(0,23.4,40,0).observer[i]!,10));
  });
  it("has opposite hemispheric seasons with an unchanged Earth-Sun distance",()=>{
    const summer=measureSeason(90,23.4,40),winter=measureSeason(270,23.4,40);
    expect(summer.north).toBeCloseTo(14.8,1);expect(winter.north).toBeCloseTo(9.2,1);
    expect(summer.north).toBeCloseTo(winter.south,10);expect(summer.north+summer.south).toBeCloseTo(24,10);
  });
  it("has twelve-hour days with zero tilt at every modeled latitude and orbital position",()=>{
    for(const lat of [-80,-40,0,40,80])for(const o of [0,45,90,180,270])expect(earthState(o,0,lat,12).daylight).toBeCloseTo(12,8);
  });
  it("retains negative noon altitude in polar night rather than clamping to zero",()=>{
    expect(earthState(270,23.4,80,12).noonAltitude).toBeCloseTo(-13.4,8);
    expect(dayHours(80,-23.4)).toBe(0);expect(dayHours(80,23.4)).toBe(24);
    expect(dayHours(66.6,23.4)).toBe(24);expect(dayHours(66.6,-23.4)).toBe(0);
  });
  it("does not infer a seasonal comparison from different latitudes or tilts",()=>{
    expect(comparablePair([measureSeason(90,23.4,40),measureSeason(270,23.4,70)],23.4)).toBeUndefined();
    expect(comparablePair([measureSeason(90,23.4,40),measureSeason(270,0,40)],23.4)).toBeUndefined();
    expect(comparablePair([measureSeason(90,23.4,40),measureSeason(270,23.4,40)],23.4)).toHaveLength(2);
  });
});

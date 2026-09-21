import {describe,it,expect} from 'vitest';
import {runWater,baseline,evidencePairs,DT} from './waterModel';
describe('water event conservation and controlled comparisons',()=>{
  it('has an independently calculated 30 mm baseline and 14 m³/s interval peak',()=>{
    const r=runWater(baseline);expect(r.rain).toBeCloseTo(30);expect(r.infiltration).toBeCloseTo(9.6);expect(r.runoff).toBeCloseTo(20400);expect(r.erosion).toBeCloseTo(100);expect(r.peak).toBeCloseTo(14);expect(r.peakMinute).toBe(30);
  });
  it('keeps every time interval and whole event balanced for every classroom condition',()=>{
    for(const rain of [30,60])for(const cover of [20,80])for(const capacity of [0,3000,12000]){
      const r=runWater({rain,cover,capacity});
      expect(r.rain*1000).toBeCloseTo(r.infiltration*1000+r.runoff,7);
      for(let i=1;i<r.frames.length;i++){
        const f=r.frames[i]!,p=r.frames[i-1]!;
        expect(p.storage+f.inflow*DT).toBeCloseTo(f.storage+f.outflow*DT,7);
        expect(f.runoff).toBeCloseTo(f.storage+f.discharged,7);
        expect(f.storage).toBeGreaterThanOrEqual(0);expect(f.storage).toBeLessThanOrEqual(capacity);expect(f.outflow).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('cover changes slope production; storage changes neither production nor erosion',()=>{
    const low=runWater(baseline),high=runWater({...baseline,cover:80}),lake=runWater({...baseline,capacity:12000});
    expect(high.runoff).toBeCloseTo(12400);expect(high.infiltration).toBeCloseTo(17.6);expect(high.erosion).toBeLessThan(low.erosion);
    expect(lake.runoff).toBe(low.runoff);expect(lake.erosion).toBe(low.erosion);expect(lake.peak).toBeLessThan(low.peak);expect(lake.peakMinute).toBeGreaterThan(low.peakMinute);expect(lake.storage).toBeGreaterThan(0);
  });
  it('finite storage spills and continues releasing after rain stops',()=>{
    const r=runWater({...baseline,rain:60,capacity:3000});expect(r.spilled).toBeGreaterThan(0);
    const later=r.frames[7]!;expect(later.intensity).toBe(0);expect(later.inflow).toBe(0);expect(later.outflow).toBeGreaterThan(0);
  });
  it('zero rain gives zero water and erosion even with storage',()=>{
    const r=runWater({...baseline,rain:0,capacity:12000});expect(r.runoff+r.erosion+r.peak+r.storage+r.discharged).toBe(0);
  });
  it('only accepts comparisons that keep the other conditions unchanged',()=>{
    const low=runWater(baseline),wrong=runWater({...baseline,rain:60,cover:80}),high=runWater({...baseline,cover:80}),lake=runWater({...baseline,capacity:12000});
    expect(evidencePairs([low,wrong]).high).toBeUndefined();expect(evidencePairs([low,lake]).retained).toBe(lake);expect(evidencePairs([low,high]).high).toBe(high);
  });
});

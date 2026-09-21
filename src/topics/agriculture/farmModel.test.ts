import {it,expect} from 'vitest';
import {farmModel,farmBase,farmPairs} from './farmModel';
it('conserves the complete rainfall when shifted, including its tail',()=>{for(const delay of [0,20,40])expect(farmModel({...farmBase,delay}).rain).toBeCloseTo(320);});
it('uses independent crop demand sums',()=>{expect(farmModel(farmBase).totalDemand).toBe(350);expect(farmModel({...farmBase,crop:'millet'}).totalDemand).toBe(180);});
it('balances all 180 daily root-zone budgets for all classroom plans',()=>{
 for(const delay of [0,20,40])for(const sow of [20,40,60])for(const crop of ['maize','millet'] as const)for(const irrigation of [0,60]){
  const r=farmModel({delay,sow,crop,irrigation});let prev=20;
  for(const d of r.days){expect(prev+d.rain*.8+d.irrigation).toBeCloseTo(d.actual+d.storage+d.overflow,8);expect(d.storage).toBeGreaterThanOrEqual(0);expect(d.storage).toBeLessThanOrEqual(60);prev=d.storage;}
  expect(20+r.rain*.8+r.irrigated).toBeCloseTo(r.actual+r.storage+r.overflow,7);expect(r.totalDemand).toBeCloseTo(r.actual+r.deficit);expect(r.irrigated).toBeLessThanOrEqual(irrigation+1e-8);
 }
});
it('finite irrigation reduces modeled deficit but does not remove cold exposure',()=>{const a=farmModel({...farmBase,delay:40,sow:60}),b=farmModel({...farmBase,delay:40,sow:60,irrigation:60});expect(b.deficit).toBeLessThanOrEqual(a.deficit);expect(b.coldDays).toBe(a.coldDays);expect(a.coldDays).toBe(30);});
it('requires actual baseline, shifted case and one-variable response records',()=>{const b=farmModel(farmBase),l=farmModel({...farmBase,delay:20}),both=farmModel({...farmBase,delay:20,sow:40,irrigation:60}),r=farmModel({...farmBase,delay:20,irrigation:60});expect(farmPairs([b,l,both]).response).toBeUndefined();expect(farmPairs([b,l,r]).response).toBe(r);});

it('finds a valid pair even when an unmatched delayed case was recorded first',()=>{const b=farmModel(farmBase),l40=farmModel({...farmBase,delay:40}),l20=farmModel({...farmBase,delay:20}),r=farmModel({...farmBase,delay:20,sow:40});expect(farmPairs([b,l40,l20,r]).late).toBe(l20);expect(farmPairs([b,l40,l20,r]).response).toBe(r);});

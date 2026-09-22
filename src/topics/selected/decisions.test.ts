import { describe, expect, it } from 'vitest';
import { decisionLabs, factories, factoryModel, polarModel, routeModel, settlementModel } from './decisions';

describe('聚落选址约束', () => {
  it('接路最近的丙仍因坡度超限被排除', () => {
    expect(settlementModel({ site: 2, demand: 50 })).toMatchObject({ feasible: false, shortage: 0 });
  });
  it('供水恰好满足时可行，缺一立方米即不可行', () => {
    expect(settlementModel({ site: 0, demand: 60 }).feasible).toBe(true);
    expect(settlementModel({ site: 0, demand: 61 })).toMatchObject({ shortage: 1, feasible: false });
  });
  it('提高需水使甲失去资格，乙仍可行', () => {
    expect(settlementModel({ site: 0, demand: 80 })).toMatchObject({ shortage: 20, feasible: false });
    expect(settlementModel({ site: 1, demand: 80 }).feasible).toBe(true);
  });
});
describe('科考站费用与题设设备限制', () => {
  it('补给增加可改变甲乙费用排序', () => {
    expect(polarModel({ site: 0, cargo: 10 }).total).toBe(21600);
    expect(polarModel({ site: 1, cargo: 10 }).total).toBe(19800);
    expect(polarModel({ site: 0, cargo: 20 }).total).toBe(23200);
    expect(polarModel({ site: 1, cargo: 20 }).total).toBe(24600);
  });
  it('14 m/s 恰好满足条件，增加风速只影响资格不偷改距离运费', () => {
    expect(polarModel({ site: 0, windExtra: 2 }).feasible).toBe(true);
    const calm = polarModel({ site: 0, cargo: 10, windExtra: 0 });
    const wind = polarModel({ site: 0, cargo: 10, windExtra: 5 });
    expect(wind.feasible).toBe(false);
    expect(wind.total).toBe(calm.total);
    expect(wind.site.distance).toBe(calm.site.distance);
    expect(polarModel({ site: 1, windExtra: 5 }).feasible).toBe(true);
  });
});
describe('工业两段运费', () => {
  it('算入两段质量和距离', () => {
    expect(factoryModel({ site: 0, output: 10, ratio: 3 })).toMatchObject({ raw: 30, inbound: 150, outbound: 450, total: 600 });
    expect(factoryModel({ site: 1, output: 10, ratio: 3 }).total).toBe(1000);
    expect(factoryModel({ site: 2, output: 10, ratio: 3 }).total).toBe(1400);
  });
  it('无重量差且总运距相同应出现并列，不虚构唯一优解', () => {
    expect(factories.map((_, site) => factoryModel({ site, output: 10, ratio: 1 }).total)).toEqual([500, 500, 500]);
  });
  it('产能恰好可行和超限分别判断', () => {
    expect(factoryModel({ site: 1, output: 12, ratio: 3 }).feasible).toBe(true);
    expect(factoryModel({ site: 1, output: 15, ratio: 3 }).feasible).toBe(false);
    expect(factoryModel({ site: 0, output: 15, ratio: 3 }).feasible).toBe(true);
  });
});
describe('运输约束及无解情景', () => {
  it('默认情景拒绝低价但超时的水运', () => {
    expect(routeModel({ route: 0, cargo: 5, deadline: 24 })).toMatchObject({ feasible: true, total: 2580 });
    expect(routeModel({ route: 1, cargo: 5, deadline: 24 })).toMatchObject({ feasible: true, total: 1400 });
    expect(routeModel({ route: 2, cargo: 5, deadline: 24 })).toMatchObject({ feasible: false, total: 660 });
  });
  it('放宽时限只改变资格，不改变费用', () => {
    expect(routeModel({ route: 2, cargo: 5, deadline: 72 })).toMatchObject({ feasible: true, total: 660 });
  });
  it('载量和时限均可取等号', () => {
    expect(routeModel({ route: 0, cargo: 10, deadline: 12 }).feasible).toBe(true);
    expect(routeModel({ route: 0, cargo: 11, deadline: 12 }).feasible).toBe(false);
  });
  it('无法交付时不推荐任何最低价方案', () => {
    const lab = decisionLabs.find(l => l.slug === 'china-route-designer')!;
    for (const route of [0, 1, 2]) expect(routeModel({ route, cargo: 15, deadline: 16 }).feasible).toBe(false);
    expect(lab.evaluate({ route: 0, cargo: 15, deadline: 16 }).message).toContain('三种方案均不可行');
  });
});
describe('课堂情景完整性', () => {
  it.each(decisionLabs)('$slug 对照仅改一个变量，全部离散组合返回有限单位数值', (lab) => {
    expect(Object.keys(lab.defaults).filter(key => lab.defaults[key] !== lab.comparison.input[key])).toHaveLength(1);
    let inputs = [{}];
    for (const control of lab.controls) inputs = inputs.flatMap(input => control.options.map(option => ({ ...input, [control.key]: option.value })));
    for (const input of inputs) for (const metric of lab.evaluate(input).metrics) {
      expect(Number.isFinite(metric.value)).toBe(true);
      expect(metric.unit.length).toBeGreaterThan(0);
    }
    for (const question of lab.questions) expect(question.options[question.correct]).toBeTruthy();
  });
});

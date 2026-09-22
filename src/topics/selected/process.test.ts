import { describe, expect, it } from 'vitest';
import { karezModel, mountainModel, processLabs, transferModel } from './process';

describe('山地抬升原理', () => {
  it('改变风向交换迎背风坡，不改变同一几何高度差', () => {
    const west = mountainModel({ wind: 1, summit: 2000, cloudBase: 1500 });
    const east = mountainModel({ wind: -1, summit: 2000, cloudBase: 1500 });
    expect(west.windward).toBe(east.leeward);
    expect(east.windward).toBe(west.leeward);
    expect(west.saturatedRise).toBe(500);
    expect(east.saturatedRise).toBe(500);
  });
  it('凝结阈值等于或高于山顶时，不产生负的抬升高度', () => {
    expect(mountainModel({ summit: 1000, cloudBase: 1500 }).saturatedRise).toBe(0);
    expect(mountainModel({ summit: 1000, cloudBase: 1000 }).saturatedRise).toBe(0);
    expect(mountainModel({ summit: 1000, cloudBase: 500 }).saturatedRise).toBe(500);
  });
  it('固定纵轴范围内钳制异常输入，所有结果有限', () => {
    expect(mountainModel({ summit: -100, cloudBase: 9000 }).saturatedRise).toBe(0);
    expect(mountainModel({ summit: Infinity, cloudBase: NaN }).saturatedRise).toBe(500);
  });
});

describe('跨流域调水守恒', () => {
  it('先满足原流域留水约束，再扣除真实调出量的输水损耗', () => {
    expect(transferModel({ supply: 80, reserve: 40, request: 60 })).toMatchObject({ diverted: 40, retained: 40, loss: 4, delivered: 36, deficit: 14 });
    expect(transferModel({ supply: 100, reserve: 60, request: 60 })).toMatchObject({ diverted: 40, delivered: 36, deficit: 14 });
    expect(transferModel({ supply: 100, reserve: 40, request: 60 })).toMatchObject({ delivered: 54, deficit: 0, surplus: 4 });
  });
  it('来水不足生态底线时不调水，也不虚报生态目标已达成', () => {
    expect(transferModel({ supply: 40, reserve: 60, request: 60 })).toMatchObject({ diverted: 0, delivered: 0, retained: 40, ecologicalShortfall: 20, deficit: 50 });
  });
  it('全控件组合守恒；调出不超申请且不挤占有条件保留的生态水', () => {
    for (const supply of [0, 40, 80, 100, 120]) for (const reserve of [0, 40, 60, 80]) for (const request of [0, 40, 60, 80]) {
      const m = transferModel({ supply, reserve, request });
      expect(m.retained + m.loss + m.delivered).toBeCloseTo(m.supply);
      expect(m.diverted).toBeLessThanOrEqual(request);
      expect(m.retained).toBeGreaterThanOrEqual(Math.min(reserve, supply));
      expect(m.deficit).toBeGreaterThanOrEqual(0);
      expect(m.loss).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('坎儿井自流与补给约束', () => {
  it('同一补给下暗渠仅减少蒸发，不增加取水或补给', () => {
    const underground = karezModel({ recharge: 100, covered: 1, drop: 10 });
    const surface = karezModel({ recharge: 100, covered: 0, drop: 10 });
    expect(underground.collected).toBe(surface.collected);
    expect(underground.delivered - surface.delivered).toBeCloseTo(surface.evaporation - underground.evaporation);
    expect(underground.delivered).toBe(76);
    expect(surface.delivered).toBe(64);
  });
  it('补给不足或无自流落差时不能凭空取水', () => {
    expect(karezModel({ recharge: 100, covered: 1, drop: 0 })).toMatchObject({ collected: 0, retained: 100, delivered: 0 });
    expect(karezModel({ recharge: 0, covered: 1, drop: 10 })).toMatchObject({ collected: 0, delivered: 0, reserveShortfall: 20 });
    expect(karezModel({ recharge: 10, covered: 1, drop: 10 })).toMatchObject({ collected: 0, retained: 10, reserveShortfall: 10 });
  });
  it('独立题与等值迁移题可由同一模型复核', () => {
    expect(karezModel({ recharge: 60, covered: 1, drop: 10 })).toMatchObject({ collected: 40, evaporation: 2, delivered: 38, deficit: 12 });
    expect(karezModel({ recharge: 60, covered: 0, drop: 10 })).toMatchObject({ collected: 40, evaporation: 8, delivered: 32, deficit: 18 });
  });
  it('全控件组合满足补给=留存+蒸发+到水，取水上限80', () => {
    for (const recharge of [0, 10, 20, 60, 100, 120]) for (const covered of [0, 1]) for (const drop of [0, 10]) {
      const m = karezModel({ recharge, covered, drop });
      expect(m.retained + m.evaporation + m.delivered).toBeCloseTo(recharge);
      expect(m.collected).toBeLessThanOrEqual(Math.max(0, recharge - 20));
      expect(m.collected).toBeLessThanOrEqual(80);
      expect(m.delivered).toBeGreaterThanOrEqual(0);
      expect(m.delivered).toBeLessThanOrEqual(m.collected);
    }
  });
});

it('每个演示对照只改变一个控件，所有开放组合给出有限指标与说明', () => {
  for (const lab of processLabs) {
    expect(Object.keys(lab.defaults).filter(key => lab.defaults[key] !== lab.comparison.input[key])).toHaveLength(1);
    let scenarios = [lab.defaults];
    for (const control of lab.controls) scenarios = scenarios.flatMap(input => control.options.map(option => ({ ...input, [control.key]: option.value })));
    for (const input of scenarios) {
      const result = lab.evaluate(input);
      expect(result.message.length).toBeGreaterThan(20);
      for (const metric of result.metrics) expect(Number.isFinite(metric.value)).toBe(true);
    }
    expect(lab.questions).toHaveLength(2);
    for (const question of lab.questions) expect(question.options[question.correct]).toBeTruthy();
  }
});

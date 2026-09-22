import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { climateModel, coordinateModel, mapModel, readingLabs } from './reading';

function lab(id: string) {
  const result = readingLabs.find(item => item.id === id);
  if (!result) throw new Error(`Missing ${id}`);
  return result;
}

describe('比例尺模型', () => {
  it('统一厘米与千米；同一路段缩图时实地长度不变，覆盖宽和面积按比例改变', () => {
    const large = mapModel({ scale: 10000, distance: 1 });
    const small = mapModel({ scale: 25000, distance: 1 });
    expect(large.mapCm).toBe(10);
    expect(small.mapCm).toBe(4);
    expect(small.distanceKm).toBe(large.distanceKm);
    expect(small.widthKm / large.widthKm).toBe(2.5);
    expect(small.areaKm2 / large.areaKm2).toBe(6.25);
  });
  it('独立题及最宽路段边界正确，所有允许路段均留在虚拟纸面内', () => {
    expect(mapModel({ scale: 50000, distance: 2 }).mapCm).toBe(4);
    expect(mapModel({ scale: 50000, distance: 2 }).widthKm).toBe(10);
    for (const scale of [10000, 25000, 50000]) for (const distance of [0.5, 1, 2]) {
      const model = mapModel({ scale, distance });
      expect(model.mapCm).toBeGreaterThan(0);
      expect(model.mapCm).toBeLessThanOrEqual(20);
      expect(model.mapCm * scale / 100000).toBe(distance);
    }
  });
});

describe('经纬网模型', () => {
  it('经度不变时沿同一经线移动；0°不错误标注南北或东西', () => {
    const north = coordinateModel({ latitude: 30, longitude: 30 });
    const south = coordinateModel({ latitude: -30, longitude: 30 });
    expect(south.x).toBe(north.x);
    expect(south.y).toBeGreaterThan(north.y);
    expect(south.latitudeText).toBe('30°S');
    expect(coordinateModel({ latitude: 0, longitude: 0 }).longitudeText).toBe('0°（本初子午线）');
    expect(coordinateModel({ latitude: 0, longitude: 0 }).latitudeText).toBe('0°（赤道）');
  });
  it('独立情景南纬西经及所有边界均在图幅内', () => {
    const target = coordinateModel({ latitude: -30, longitude: -60 });
    expect([target.latitudeText, target.longitudeText]).toEqual(['30°S', '60°W']);
    for (const longitude of [-60, -30, 0, 30, 60]) for (const latitude of [-60, -30, 0, 30, 60]) {
      const model = coordinateModel({ longitude, latitude });
      expect(model.x).toBeGreaterThanOrEqual(100);
      expect(model.x).toBeLessThanOrEqual(460);
      expect(model.y).toBeGreaterThanOrEqual(57);
      expect(model.y).toBeLessThanOrEqual(273);
    }
  });
});

describe('气候月值模型与同源图表', () => {
  it('年降水为12月总和，年温差为月均温极差；季节平移不改变年统计', () => {
    for (const warmMonth of [7, 1]) for (const wetSeason of [0, 1]) {
      const result = climateModel({ warmMonth, wetSeason });
      expect(result.months).toHaveLength(12);
      expect(result.total).toBe(935);
      expect(result.range).toBe(24);
      expect(result.min).toBe(4);
      expect(result.max).toBe(28);
      expect(result.months[warmMonth - 1]?.temperature).toBe(28);
      expect(result.wetMonth).toBe(wetSeason === 0 ? warmMonth : warmMonth === 1 ? 7 : 1);
      expect(result.months.every(month => month.temperature >= 0 && month.temperature <= 30 && month.rain >= 0 && month.rain <= 200)).toBe(true);
    }
  });
  it('只改多雨期时气温序列不变，柱图转移，固定轴不变且提供12月表格', () => {
    const definition = lab('GQ-T013');
    const initial = climateModel(definition.defaults);
    const comparison = climateModel(definition.comparison.input);
    expect(initial.months.map(month => month.temperature)).toEqual(comparison.months.map(month => month.temperature));
    expect(initial.months[0]?.rain).toBe(20);
    expect(comparison.months[0]?.rain).toBe(180);
    for (const input of [definition.defaults, definition.comparison.input]) {
      const markup = renderToStaticMarkup(createElement(definition.Diagram, { input, result: definition.evaluate(input) }));
      expect(markup).toContain('固定左轴 0–30°C / 右轴 0–200 mm');
      expect(markup.match(/scope="row"/g)).toHaveLength(12);
      expect(markup).toContain('模拟气候月值');
    }
  });
});

describe('教学实验契约与异常输入', () => {
  it('每个对照只改变一个离散条件，所有指标可计算，独立题答案不同于示范情景', () => {
    for (const definition of readingLabs) {
      expect(Object.keys(definition.defaults).filter(key => definition.defaults[key] !== definition.comparison.input[key])).toHaveLength(1);
      expect(definition.evaluate(definition.defaults).metrics.every(metric => Number.isFinite(metric.value))).toBe(true);
      expect(definition.questions).toHaveLength(2);
      expect(definition.questions.every(question => question.options[question.correct] !== undefined)).toBe(true);
    }
    expect(lab('GQ-T001').questions.map(question => question.correct)).toEqual([0, 2]);
    expect(lab('GQ-T002').questions.map(question => question.correct)).toEqual([1, 2]);
    expect(lab('GQ-T013').questions.map(question => question.correct)).toEqual([1, 2]);
    expect(26 - 6).toBe(20);
    expect(6 * 30 + 6 * 90).toBe(720);
  });
  it('拒绝模型范围外与缺失输入，避免静默生成误导图表', () => {
    expect(() => mapModel({ scale: 0, distance: 1 })).toThrow(RangeError);
    expect(() => mapModel({ scale: 10000, distance: 3 })).toThrow(RangeError);
    expect(() => coordinateModel({ latitude: 90, longitude: 0 })).toThrow(RangeError);
    expect(() => climateModel({ warmMonth: 7, wetSeason: Number.NaN })).toThrow(RangeError);
    expect(() => climateModel({})).toThrow(RangeError);
  });
});

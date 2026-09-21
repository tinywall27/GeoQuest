import { describe, expect, it } from "vitest";
import {
  agricultureFit,
  controlledErosionComparison,
  dayLengthHours,
  daylightDurationForSolarDay,
  detailedErosionBaseline,
  detailedErosionModel,
  erosionModel,
  farmDecisionScores,
  localTimeDifferenceHours,
  monsoonBaseline,
  mostSuitableRelativeRoute,
  contourRoutes,
  relativeRouteRiskIndex,
  shiftSeries,
  solarDeclination,
  solarDeclinationAtOrbit,
  solarNoonAltitude,
} from "./models";

describe("earth motion model", () => {
  it("keeps equinox day length close to 12 hours", () => {
    expect(dayLengthHours(60, solarDeclination("march-equinox"))).toBeCloseTo(12, 5);
  });

  it("matches the expected 60N solstice contrast", () => {
    expect(dayLengthHours(60, solarDeclination("june-solstice"))).toBeCloseTo(18.5, 1);
    expect(dayLengthHours(60, solarDeclination("december-solstice"))).toBeCloseTo(5.5, 1);
  });

  it("uses fifteen degrees per local-time hour", () => {
    expect(localTimeDifferenceHours(90, 120)).toBe(2);
  });

  it("moves solar declination continuously around the four key orbit positions", () => {
    expect(solarDeclinationAtOrbit(0)).toBeCloseTo(0, 6);
    expect(solarDeclinationAtOrbit(90)).toBeCloseTo(23.4, 6);
    expect(solarDeclinationAtOrbit(180)).toBeCloseTo(0, 6);
    expect(solarDeclinationAtOrbit(270)).toBeCloseTo(-23.4, 6);
    expect(solarDeclinationAtOrbit(90, 0)).toBeCloseTo(0, 6);
  });

  it("keeps the extended-day teaching comparison internally consistent", () => {
    const declination = solarDeclinationAtOrbit(90, 23.4);
    expect(solarNoonAltitude(40, declination)).toBeCloseTo(73.4, 1);
    expect(daylightDurationForSolarDay(40, declination, 48)).toBeCloseTo(
      dayLengthHours(40, declination) * 2,
      6,
    );
  });
});

describe("teaching scenario models", () => {
  it("shifts a monsoon sequence deterministically", () => {
    const baseline = [1, 2, 3, 4];
    const shifted = shiftSeries(baseline, 2, 0);
    expect(shifted).toEqual([0, 0, 1, 2, 3, 4]);
    expect(shifted.reduce((sum, value) => sum + value, 0)).toBe(
      baseline.reduce((sum, value) => sum + value, 0),
    );
  });

  it("preserves the complete 1991—2020 teaching baseline when shifted 20 days", () => {
    const shifted = shiftSeries(monsoonBaseline, 2, 0);
    expect(shifted).toHaveLength(monsoonBaseline.length + 2);
    expect(shifted.slice(0, 2)).toEqual([0, 0]);
    expect(shifted.slice(2)).toEqual(monsoonBaseline);
    expect(shifted.reduce((sum, value) => sum + value, 0)).toBe(
      monsoonBaseline.reduce((sum, value) => sum + value, 0),
    );
  });

  it("selects one unambiguous relatively suitable contour route", () => {
    const scores = contourRoutes.map(relativeRouteRiskIndex);
    expect(new Set(scores).size).toBe(contourRoutes.length);
    expect(mostSuitableRelativeRoute()?.id).toBe("saddle");
  });

  it("keeps decision indices bounded", () => {
    expect(agricultureFit({ warmth: 200, water: 200, terrain: 200, market: 200, transport: 200 })).toBe(100);
    const scores = farmDecisionScores({ climate: "warm-wet", crop: "rice", irrigation: 2, market: 1, technology: 1 });
    Object.values(scores).forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
  });

  it("returns deterministic bounded feedback for four plots and three crops", () => {
    const climates = ["cold-wet", "warm-wet", "warm-dry", "cold-dry"] as const;
    const crops = ["rice", "wheat", "maize"] as const;
    for (const climate of climates) {
      for (const crop of crops) {
        const scenario = { climate, crop, irrigation: 1, market: 1, technology: 1 } as const;
        const first = farmDecisionScores(scenario);
        expect(farmDecisionScores(scenario)).toEqual(first);
        Object.values(first).forEach((value) => {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      }
    }
  });

  it("keeps the erosion model monotonic in the planned directions", () => {
    const base = erosionModel({ rain: 1, slope: 1, cover: 1, practice: "downslope" });
    const moreRain = erosionModel({ rain: 3, slope: 1, cover: 1, practice: "downslope" });
    const moreSlope = erosionModel({ rain: 1, slope: 4, cover: 1, practice: "downslope" });
    const moreCover = erosionModel({ rain: 1, slope: 1, cover: 4, practice: "downslope" });
    const terrace = erosionModel({ rain: 1, slope: 1, cover: 1, practice: "terrace" });
    expect(moreRain.erosion).toBeGreaterThanOrEqual(base.erosion);
    expect(moreSlope.erosion).toBeGreaterThanOrEqual(base.erosion);
    expect(moreCover.erosion).toBeLessThanOrEqual(base.erosion);
    expect(terrace.erosion).toBeLessThanOrEqual(base.erosion);
  });

  it("defines four single-variable erosion comparisons", () => {
    const variables = ["rain", "slope", "cover", "practice"] as const;
    const comparisons = variables.map(controlledErosionComparison);
    expect(comparisons).toHaveLength(4);
    expect(comparisons.map((comparison) => comparison.variable)).toEqual(variables);
    expect(comparisons[0]?.erosionDelta).toBeGreaterThanOrEqual(0);
    expect(comparisons[1]?.erosionDelta).toBeGreaterThanOrEqual(0);
    expect(comparisons[2]?.erosionDelta).toBeLessThanOrEqual(0);
    expect(comparisons[3]?.erosionDelta).toBeLessThanOrEqual(0);
  });

  it("keeps every erosion combination finite and bounded", () => {
    const practices = ["downslope", "contour", "terrace", "grass"] as const;
    for (const rain of [1, 2, 3] as const) {
      for (const slope of [1, 2, 3, 4] as const) {
        for (const cover of [1, 2, 3, 4] as const) {
          for (const practice of practices) {
            const result = erosionModel({ rain, slope, cover, practice });
            Object.values(result).forEach((value) => {
              expect(Number.isFinite(value)).toBe(true);
              expect(value).toBeGreaterThanOrEqual(0);
              expect(value).toBeLessThanOrEqual(100);
            });
          }
        }
      }
    }
  });

  it("keeps the continuous erosion field bounded and deterministic", () => {
    const practices = ["downslope", "contour", "terrace", "grass"] as const;
    for (const rainIntensity of [10, 24, 42, 63, 80]) {
      for (const slopeDegrees of [5, 14, 21, 35]) {
        for (const vegetationCover of [0, 35, 60, 90]) {
          for (const practice of practices) {
            const input = { rainIntensity, slopeDegrees, vegetationCover, practice };
            const first = detailedErosionModel(input);
            expect(detailedErosionModel(input)).toEqual(first);
            for (const value of [first.runoff, first.erosion, first.protection]) {
              expect(Number.isFinite(value)).toBe(true);
              expect(value).toBeGreaterThanOrEqual(0);
              expect(value).toBeLessThanOrEqual(100);
            }
          }
        }
      }
    }
  });

  it("changes continuously in the planned directions across adjacent slider values", () => {
    const rainSeries = Array.from({ length: 71 }, (_, index) => detailedErosionModel({ ...detailedErosionBaseline, rainIntensity: 10 + index }));
    const slopeSeries = Array.from({ length: 31 }, (_, index) => detailedErosionModel({ ...detailedErosionBaseline, slopeDegrees: 5 + index }));
    const coverSeries = Array.from({ length: 91 }, (_, index) => detailedErosionModel({ ...detailedErosionBaseline, vegetationCover: index }));
    for (let index = 1; index < rainSeries.length; index += 1) {
      expect(rainSeries[index]!.erosion).toBeGreaterThanOrEqual(rainSeries[index - 1]!.erosion);
      expect(rainSeries[index]!.runoff).toBeGreaterThanOrEqual(rainSeries[index - 1]!.runoff);
    }
    for (let index = 1; index < slopeSeries.length; index += 1) {
      expect(slopeSeries[index]!.erosion).toBeGreaterThanOrEqual(slopeSeries[index - 1]!.erosion);
      expect(slopeSeries[index]!.runoff).toBeGreaterThanOrEqual(slopeSeries[index - 1]!.runoff);
    }
    for (let index = 1; index < coverSeries.length; index += 1) {
      expect(coverSeries[index]!.erosion).toBeLessThanOrEqual(coverSeries[index - 1]!.erosion);
      expect(coverSeries[index]!.runoff).toBeLessThanOrEqual(coverSeries[index - 1]!.runoff);
    }
  });

  it("orders all four conservation practices from less to more protective", () => {
    const practices = ["downslope", "contour", "terrace", "grass"] as const;
    const results = practices.map((practice) => detailedErosionModel({ ...detailedErosionBaseline, practice }));
    for (let index = 1; index < results.length; index += 1) {
      expect(results[index]!.erosion).toBeLessThanOrEqual(results[index - 1]!.erosion);
      expect(results[index]!.runoff).toBeLessThanOrEqual(results[index - 1]!.runoff);
      expect(results[index]!.protection).toBeGreaterThanOrEqual(results[index - 1]!.protection);
    }
  });

  it("keeps runoff and erosion monotonic across every adjacent level", () => {
    const practices = ["downslope", "contour", "terrace", "grass"] as const;
    for (const slope of [1, 2, 3, 4] as const) {
      for (const cover of [1, 2, 3, 4] as const) {
        for (const practice of practices) {
          const rain1 = erosionModel({ rain: 1, slope, cover, practice });
          const rain2 = erosionModel({ rain: 2, slope, cover, practice });
          const rain3 = erosionModel({ rain: 3, slope, cover, practice });
          expect(rain2.runoff).toBeGreaterThanOrEqual(rain1.runoff);
          expect(rain3.runoff).toBeGreaterThanOrEqual(rain2.runoff);
          expect(rain2.erosion).toBeGreaterThanOrEqual(rain1.erosion);
          expect(rain3.erosion).toBeGreaterThanOrEqual(rain2.erosion);
        }
      }
    }
    for (const rain of [1, 2, 3] as const) {
      for (const cover of [1, 2, 3, 4] as const) {
        for (const practice of practices) {
          const levels = ([1, 2, 3, 4] as const).map((slope) =>
            erosionModel({ rain, slope, cover, practice }),
          );
          for (let index = 1; index < levels.length; index += 1) {
            expect(levels[index]?.runoff).toBeGreaterThanOrEqual(levels[index - 1]?.runoff ?? 0);
            expect(levels[index]?.erosion).toBeGreaterThanOrEqual(levels[index - 1]?.erosion ?? 0);
          }
        }
      }
    }
    for (const rain of [1, 2, 3] as const) {
      for (const slope of [1, 2, 3, 4] as const) {
        for (const practice of practices) {
          const levels = ([1, 2, 3, 4] as const).map((cover) =>
            erosionModel({ rain, slope, cover, practice }),
          );
          for (let index = 1; index < levels.length; index += 1) {
            expect(levels[index]?.runoff).toBeLessThanOrEqual(levels[index - 1]?.runoff ?? 100);
            expect(levels[index]?.erosion).toBeLessThanOrEqual(levels[index - 1]?.erosion ?? 100);
          }
        }
      }
    }
    for (const rain of [1, 2, 3] as const) {
      for (const slope of [1, 2, 3, 4] as const) {
        for (const cover of [1, 2, 3, 4] as const) {
          const levels = practices.map((practice) => erosionModel({ rain, slope, cover, practice }));
          for (let index = 1; index < levels.length; index += 1) {
            expect(levels[index]?.runoff).toBeLessThanOrEqual(levels[index - 1]?.runoff ?? 100);
            expect(levels[index]?.erosion).toBeLessThanOrEqual(levels[index - 1]?.erosion ?? 100);
          }
        }
      }
    }
  });
});

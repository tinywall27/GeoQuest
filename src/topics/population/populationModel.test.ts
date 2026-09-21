import {describe, expect, test} from "vitest";
import {
  combineCountries,
  densityPerKm2,
  pairKey,
} from "./populationModel";

describe("population density model", () => {
  test("uses people per square kilometre", () => {
    expect(densityPerKm2(1_000, 10)).toBe(100);
    expect(densityPerKm2(26_659_922, 7_692_020)).toBeCloseTo(3.4659, 3);
  });

  test("recalculates a combined density with population and area totals", () => {
    const result = combineCountries(["AUS", "BGD"]);
    expect(result.totalPopulation).toBe(198_126_912);
    expect(result.totalLandAreaKm2).toBe(7_822_000);
    expect(result.weightedDensityPerKm2).toBeCloseTo(25.33, 1);
    expect(result.simpleAverageDensityPerKm2).toBeGreaterThan(
      result.weightedDensityPerKm2,
    );
  });

  test("rejects duplicate country selection and normalizes pair keys", () => {
    expect(() => combineCountries(["AUS", "AUS"])).toThrow("两个不同国家");
    expect(pairKey(["JPN", "NLD"])).toBe("JPN+NLD");
    expect(pairKey(["NLD", "JPN"])).toBe("JPN+NLD");
  });

  test("requires a positive land area", () => {
    expect(() => densityPerKm2(10, 0)).toThrow("大于 0");
    expect(() => densityPerKm2(10, -2)).toThrow("大于 0");
  });
});

import snapshot from "./data/world-bank-2023.json";

export type CountryCode = "AUS" | "BGD" | "NLD" | "JPN";

export interface PopulationCountry {
  code: CountryCode;
  name: string;
  englishName: string;
  population: number;
  landAreaKm2: number;
  densityPerKm2: number;
}

export interface CombinedPopulation {
  pair: readonly [CountryCode, CountryCode];
  countries: readonly [PopulationCountry, PopulationCountry];
  totalPopulation: number;
  totalLandAreaKm2: number;
  weightedDensityPerKm2: number;
  simpleAverageDensityPerKm2: number;
  simpleAverageErrorPerKm2: number;
  simpleAverageOverstatementPercent: number;
}

const supportedCodes: readonly CountryCode[] = ["AUS", "BGD", "NLD", "JPN"];

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} 必须是非负有限数`);
  }
}

/** 人口密度单位固定为人 / km²；面积必须大于 0。 */
export function densityPerKm2(population: number, landAreaKm2: number): number {
  assertFiniteNonNegative(population, "人口");
  if (!Number.isFinite(landAreaKm2) || landAreaKm2 <= 0) {
    throw new Error("陆地面积必须是大于 0 的有限数");
  }
  return population / landAreaKm2;
}

export const populationCountries: readonly PopulationCountry[] = snapshot.records.map(
  (record) => ({
    code: record.code as CountryCode,
    name: record.name,
    englishName: record.englishName,
    population: record.population,
    landAreaKm2: record.landAreaKm2,
    densityPerKm2: densityPerKm2(record.population, record.landAreaKm2),
  }),
);

export const populationYear = snapshot.year;
export const populationDatasetUpdatedAt = snapshot.lastUpdated;

export function countryFor(code: CountryCode): PopulationCountry {
  const country = populationCountries.find((item) => item.code === code);
  if (!country) throw new Error(`没有找到国家 ${code} 的快照记录`);
  return country;
}

export function pairKey(codes: readonly [CountryCode, CountryCode]): string {
  assertDistinctPair(codes);
  return [...codes].sort().join("+");
}

export function assertDistinctPair(
  codes: readonly [CountryCode, CountryCode],
): void {
  if (codes[0] === codes[1]) {
    throw new Error("合并实验必须选择两个不同国家");
  }
  for (const code of codes) {
    if (!supportedCodes.includes(code)) {
      throw new Error(`不支持的国家代码 ${code}`);
    }
  }
}

/**
 * 把两个国家作为统计实验合并：总人口和总面积相加后重新计算密度。
 * 简单平均只作反例展示，不能代表合并后区域的密度。
 */
export function combineCountries(
  codes: readonly [CountryCode, CountryCode],
): CombinedPopulation {
  assertDistinctPair(codes);
  const first = countryFor(codes[0]);
  const second = countryFor(codes[1]);
  const totalPopulation = first.population + second.population;
  const totalLandAreaKm2 = first.landAreaKm2 + second.landAreaKm2;
  const weightedDensityPerKm2 = densityPerKm2(totalPopulation, totalLandAreaKm2);
  const simpleAverageDensityPerKm2 =
    (first.densityPerKm2 + second.densityPerKm2) / 2;
  const simpleAverageErrorPerKm2 =
    simpleAverageDensityPerKm2 - weightedDensityPerKm2;

  return {
    pair: codes,
    countries: [first, second],
    totalPopulation,
    totalLandAreaKm2,
    weightedDensityPerKm2,
    simpleAverageDensityPerKm2,
    simpleAverageErrorPerKm2,
    simpleAverageOverstatementPercent:
      weightedDensityPerKm2 === 0
        ? 0
        : (simpleAverageErrorPerKm2 / weightedDensityPerKm2) * 100,
  };
}

export function countryCodesForSelection(
  excluded?: CountryCode,
): readonly CountryCode[] {
  return excluded
    ? supportedCodes.filter((code) => code !== excluded)
    : supportedCodes;
}

export type SeasonKey = "march-equinox" | "june-solstice" | "september-equinox" | "december-solstice";

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function solarDeclination(season: SeasonKey, axialTilt = 23.4): number {
  if (season === "june-solstice") return axialTilt;
  if (season === "december-solstice") return -axialTilt;
  return 0;
}

export function dayLengthHours(latitude: number, declination: number): number {
  const phi = toRadians(Math.max(-89.999, Math.min(89.999, latitude)));
  const delta = toRadians(declination);
  const cosineHourAngle = -Math.tan(phi) * Math.tan(delta);
  if (cosineHourAngle <= -1) return 24;
  if (cosineHourAngle >= 1) return 0;
  const hourAngle = Math.acos(cosineHourAngle);
  return (2 * toDegrees(hourAngle)) / 15;
}

export function localTimeDifferenceHours(longitudeA: number, longitudeB: number): number {
  return (longitudeB - longitudeA) / 15;
}

/**
 * Continuous solar declination for the field-lab animation.
 * 0° is the March equinox, 90° the June solstice.
 */
export function solarDeclinationAtOrbit(
  orbitDegrees: number,
  axialTilt = 23.4,
): number {
  const longitude = toRadians(((orbitDegrees % 360) + 360) % 360);
  const tilt = toRadians(Math.max(0, Math.min(45, axialTilt)));
  return toDegrees(Math.asin(Math.sin(tilt) * Math.sin(longitude)));
}

export function solarNoonAltitude(
  latitude: number,
  declination: number,
): number {
  return Math.max(0, 90 - Math.abs(latitude - declination));
}

export function daylightDurationForSolarDay(
  latitude: number,
  declination: number,
  solarDayHours = 24,
): number {
  return (dayLengthHours(latitude, declination) / 24) * solarDayHours;
}

export function localTimeDifferenceForSolarDay(
  longitudeA: number,
  longitudeB: number,
  solarDayHours = 24,
): number {
  return ((longitudeB - longitudeA) / 360) * solarDayHours;
}

export type RouteMetrics = {
  id: "ridge" | "valley" | "saddle";
  label: string;
  climb: number;
  maxSlope: number;
  valleyCrossings: number;
  lineOfSight: boolean;
};

export const contourRoutes: RouteMetrics[] = [
  { id: "ridge", label: "山脊线", climb: 350, maxSlope: 32, valleyCrossings: 0, lineOfSight: true },
  { id: "valley", label: "谷地线", climb: 210, maxSlope: 18, valleyCrossings: 2, lineOfSight: false },
  { id: "saddle", label: "鞍部线", climb: 260, maxSlope: 14, valleyCrossings: 0, lineOfSight: true },
];

export function relativeRouteRiskIndex(route: RouteMetrics): number {
  return (
    route.maxSlope * 2 +
    route.climb / 20 +
    route.valleyCrossings * 25 +
    (route.lineOfSight ? 0 : 18)
  );
}

export function mostSuitableRelativeRoute(
  routes: readonly RouteMetrics[] = contourRoutes,
): RouteMetrics | undefined {
  return [...routes].sort(
    (left, right) => relativeRouteRiskIndex(left) - relativeRouteRiskIndex(right),
  )[0];
}

export function relativeSlope(contourSpacing: number): "陡" | "中" | "缓" {
  if (contourSpacing < 18) return "陡";
  if (contourSpacing < 36) return "中";
  return "缓";
}

export const populationSnapshots = {
  2000: [
    { region: "东亚沿海", density: 420, latitudeBand: "20°–40°N", elevationBand: "0–200 m" },
    { region: "南亚平原", density: 510, latitudeBand: "10°–30°N", elevationBand: "0–200 m" },
    { region: "撒哈拉腹地", density: 2, latitudeBand: "10°–30°N", elevationBand: "200–1000 m" },
  ],
  2010: [
    { region: "东亚沿海", density: 475, latitudeBand: "20°–40°N", elevationBand: "0–200 m" },
    { region: "南亚平原", density: 590, latitudeBand: "10°–30°N", elevationBand: "0–200 m" },
    { region: "撒哈拉腹地", density: 2.3, latitudeBand: "10°–30°N", elevationBand: "200–1000 m" },
  ],
  2020: [
    { region: "东亚沿海", density: 515, latitudeBand: "20°–40°N", elevationBand: "0–200 m" },
    { region: "南亚平原", density: 675, latitudeBand: "10°–30°N", elevationBand: "0–200 m" },
    { region: "撒哈拉腹地", density: 2.7, latitudeBand: "10°–30°N", elevationBand: "200–1000 m" },
  ],
} as const;

export const monsoonBaseline = [18, 24, 41, 86, 132, 168, 152, 117, 72, 39, 23, 17];

export function shiftSeries<T>(values: readonly T[], steps: number, fill: T): T[] {
  if (steps <= 0) return [...values];
  return [...Array<T>(steps).fill(fill), ...values];
}

export type AgricultureFactors = {
  warmth: number;
  water: number;
  terrain: number;
  market: number;
  transport: number;
};

export function agricultureFit(factors: AgricultureFactors): number {
  const weighted =
    factors.warmth * 0.22 +
    factors.water * 0.22 +
    factors.terrain * 0.18 +
    factors.market * 0.2 +
    factors.transport * 0.18;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

export const terrainTransect = [
  { place: "那曲", elevation: 4500, step: "第一级阶梯" },
  { place: "昌都", elevation: 3240, step: "第一、二级过渡" },
  { place: "成都", elevation: 510, step: "第二级阶梯" },
  { place: "宜昌", elevation: 90, step: "第二、三级过渡" },
  { place: "武汉", elevation: 24, step: "第三级阶梯" },
  { place: "上海", elevation: 4, step: "第三级阶梯" },
] as const;

export const lakeHotspots = [
  { id: "shore", label: "岸线与洲滩", observation: "同季节影像中的水陆边界发生变化" },
  { id: "wetland", label: "湿地修复区", observation: "植被覆盖与水面镶嵌格局发生变化" },
  { id: "production", label: "生产活动区", observation: "围垦、养殖或清退痕迹在不同证据中出现" },
] as const;

export type FarmScenario = {
  climate: "cold-wet" | "warm-wet" | "warm-dry" | "cold-dry";
  crop: "rice" | "wheat" | "maize";
  irrigation: 0 | 1 | 2;
  market: 0 | 1 | 2;
  technology: 0 | 1 | 2;
};

export function farmDecisionScores(input: FarmScenario) {
  const climateCrop = {
    "cold-wet": { rice: 48, wheat: 72, maize: 68 },
    "warm-wet": { rice: 92, wheat: 64, maize: 78 },
    "warm-dry": { rice: 42, wheat: 75, maize: 70 },
    "cold-dry": { rice: 28, wheat: 62, maize: 58 },
  }[input.climate][input.crop];
  const irrigationNeed = input.crop === "rice" ? 2 : input.crop === "maize" ? 1 : 0;
  const water = Math.max(18, 92 - Math.abs(input.irrigation - irrigationNeed) * 28);
  const market = 45 + input.market * 20;
  const resilience = Math.min(100, 48 + input.technology * 18 + input.irrigation * 7);
  return { natural: climateCrop, water, market, resilience };
}

export const yangtzeTimeline = [
  { year: 2005, label: "沿线合作起步", upstream: "生态屏障", midstream: "枢纽衔接", downstream: "港口协作", sourceIds: ["DS-NDRC-YREB-TIMELINE"] },
  { year: 2014, label: "依托黄金水道", upstream: "清洁能源", midstream: "综合交通", downstream: "开放门户", sourceIds: ["DS-NDRC-YREB-TIMELINE", "DS-MOT-YREB"] },
  { year: 2016, label: "生态优先、绿色发展", upstream: "涵养水源", midstream: "产业转型", downstream: "创新协同", sourceIds: ["DS-NDRC-YREB-TIMELINE"] },
  { year: 2021, label: "保护法施行", upstream: "源头保护", midstream: "岸线治理", downstream: "污染联防", sourceIds: ["DS-NDRC-YREB-TIMELINE"] },
  { year: 2024, label: "固定成效快照", upstream: "生态产品", midstream: "绿色制造", downstream: "服务网络", sourceIds: ["DS-MOT-YREB", "DS-NBS-YREB-2023", "DS-MEE-YANGTZE-2024"] },
] as const;

export type ErosionInput = {
  rain: 1 | 2 | 3;
  slope: 1 | 2 | 3 | 4;
  cover: 1 | 2 | 3 | 4;
  practice: "downslope" | "contour" | "terrace" | "grass";
};

export const erosionBaseline: ErosionInput = {
  rain: 2,
  slope: 2,
  cover: 2,
  practice: "downslope",
};

export type ErosionVariable = keyof ErosionInput;

const erosionComparisonTargets = {
  rain: 3,
  slope: 4,
  cover: 4,
  practice: "terrace",
} as const;

export function erosionModel(input: ErosionInput) {
  const practiceFactor = { downslope: 1, contour: 0.72, terrace: 0.46, grass: 0.3 }[input.practice];
  const coverFactor = [1, 0.78, 0.5, 0.28][input.cover - 1] ?? 1;
  const runoff = Math.round(Math.min(100, input.rain * 21 + input.slope * 9 - input.cover * 8) * practiceFactor);
  const erosion = Math.round(
    Math.min(100, input.rain * input.rain * 8 + input.slope * 13) * coverFactor * practiceFactor,
  );
  return { runoff: Math.max(0, runoff), erosion: Math.max(0, erosion) };
}

export function controlledErosionComparison(variable: ErosionVariable) {
  const scenario = {
    ...erosionBaseline,
    [variable]: erosionComparisonTargets[variable],
  } as ErosionInput;
  const before = erosionModel(erosionBaseline);
  const after = erosionModel(scenario);
  return {
    variable,
    from: erosionBaseline[variable],
    to: scenario[variable],
    runoffDelta: after.runoff - before.runoff,
    erosionDelta: after.erosion - before.erosion,
  };
}

export type DetailedErosionPractice =
  | "downslope"
  | "contour"
  | "terrace"
  | "grass";

export type DetailedErosionInput = {
  rainIntensity: number;
  slopeDegrees: number;
  vegetationCover: number;
  practice: DetailedErosionPractice;
};

export const detailedErosionBaseline: DetailedErosionInput = {
  rainIntensity: 42,
  slopeDegrees: 14,
  vegetationCover: 35,
  practice: "downslope",
};

const detailedPracticeFactor: Record<DetailedErosionPractice, number> = {
  downslope: 1,
  contour: 0.72,
  terrace: 0.45,
  grass: 0.3,
};

export function detailedErosionModel(input: DetailedErosionInput) {
  const rain = Math.max(10, Math.min(80, input.rainIntensity));
  const slope = Math.max(5, Math.min(35, input.slopeDegrees));
  const cover = Math.max(0, Math.min(90, input.vegetationCover));
  const practiceFactor = detailedPracticeFactor[input.practice];

  const rainFactor = Math.pow(rain / 42, 1.28);
  const referenceSine = Math.sin(toRadians(14));
  const slopeFactor = Math.pow(Math.sin(toRadians(slope)) / referenceSine, 1.18);
  const coverFactor = Math.exp(-0.022 * (cover - 35));

  const erosion = Math.round(
    Math.max(
      0,
      Math.min(100, 48 * rainFactor * slopeFactor * coverFactor * practiceFactor),
    ),
  );

  const runoffPotential =
    (rain / 80) * 63 +
    (slope / 35) * 24 +
    ((90 - cover) / 90) * 20;
  const runoff = Math.round(
    Math.max(0, Math.min(100, runoffPotential * Math.sqrt(practiceFactor))),
  );

  const protection = Math.round(
    Math.max(0, Math.min(100, 100 - erosion * 0.72 - runoff * 0.28)),
  );

  return {
    runoff,
    erosion,
    protection,
    factors: {
      rain: Number(rainFactor.toFixed(2)),
      slope: Number(slopeFactor.toFixed(2)),
      cover: Number(coverFactor.toFixed(2)),
      practice: practiceFactor,
    },
  };
}

import { contours } from "d3-contour";

export type Point = readonly [number, number];
export const WIDTH = 4000;
export const DEPTH = 3000;
export const COLS = 121;
export const ROWS = 91;

/** Metres; a fictional, deterministic surface. x eastward, y southward. */
export function elevation(x: number, y: number): number {
  const hill = (cx: number, cy: number, sx: number, sy: number, height: number) =>
    height * Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  return 110 + hill(.35, .38, .18, .29, 790)
    + hill(.7, .33, .19, .23, 1020)
    + hill(.58, .7, .3, .18, 340)
    + hill(.48, .45, .4, .08, 130);
}

export const heights = Array.from({ length: COLS * ROWS }, (_, i) =>
  elevation((i % COLS) / (COLS - 1), Math.floor(i / COLS) / (ROWS - 1)));

export function getContours(interval: number) {
  const levels = Array.from({ length: Math.floor(1200 / interval) }, (_, i) => (i + 1) * interval);
  return contours().size([COLS, ROWS]).thresholds(levels)(heights);
}

/** d3 sample i is at i + .5, while our mesh vertex i is at i. */
export function contourPoint(point: number[]): Point {
  return [Math.max(0, Math.min(1, (point[0]! - .5) / (COLS - 1))),
    Math.max(0, Math.min(1, (point[1]! - .5) / (ROWS - 1)))];
}

export const routes = [
  { id: "A", name: "西侧登山线", color: "#efbd53", points: [[.1, .88], [.19, .66], [.28, .46], [.35, .38], [.5, .36], [.7, .33]] },
  { id: "B", name: "直达线", color: "#ed8975", points: [[.1, .88], [.7, .33]] },
  { id: "C", name: "折返线", color: "#8dd3f2", points: [[0.1,0.88],[0.16,0.82],[0.33,0.82],[0.32,0.81],[0.34,0.81],[0.33,0.8],[0.34,0.8],[0.33,0.79],[0.35,0.79],[0.34,0.78],[0.35,0.78],[0.34,0.77],[0.36,0.77],[0.35,0.76],[0.36,0.76],[0.35,0.75],[0.36,0.75],[0.35,0.74],[0.37,0.74],[0.36,0.73],[0.37,0.73],[0.36,0.72],[0.37,0.72],[0.36,0.71],[0.37,0.71],[0.36,0.7],[0.37,0.7],[0.36,0.69],[0.37,0.69],[0.36,0.68],[0.37,0.68],[0.36,0.67],[0.37,0.67],[0.36,0.66],[0.37,0.66],[0.36,0.65],[0.37,0.65],[0.36,0.64],[0.37,0.64],[0.36,0.63],[0.37,0.63],[0.36,0.62],[0.39,0.62],[0.43,0.58],[0.41,0.58],[0.42,0.57],[0.41,0.57],[0.42,0.56],[0.41,0.56],[0.43,0.54],[0.42,0.54],[0.55,0.41],[0.57,0.43],[0.57,0.42],[0.58,0.43],[0.58,0.41],[0.59,0.42],[0.59,0.41],[0.6,0.42],[0.6,0.41],[0.61,0.42],[0.61,0.4],[0.62,0.41],[0.62,0.4],[0.63,0.41],[0.63,0.39],[0.64,0.4],[0.64,0.39],[0.65,0.4],[0.65,0.36],[0.68,0.33],[0.7,0.33]] },
] as const;
export type RouteId = typeof routes[number]["id"];

export function sampleRoute(points: readonly Point[], count = 241) {
  const lengths = points.slice(1).map((p, i) => Math.hypot((p[0] - points[i]![0]) * WIDTH, (p[1] - points[i]![1]) * DEPTH));
  const total = lengths.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, (_, i) => {
    const distance = total * i / (count - 1);
    let segment = 0;
    let before = 0;
    while (segment < lengths.length - 1 && before + lengths[segment]! < distance) before += lengths[segment++]!;
    const t = (distance - before) / lengths[segment]!;
    const p = points[segment]!;
    const q = points[segment + 1]!;
    const x = p[0] + (q[0] - p[0]) * t;
    const y = p[1] + (q[1] - p[1]) * t;
    return { x, y, distance, elevation: elevation(x, y) };
  });
}

export function analyseRoute(points: readonly Point[]) {
  const samples = sampleRoute(points);
  let climb = 0;
  let maxSlope = 0;
  let surfaceDistance = 0;
  samples.slice(1).forEach((p, i) => {
    const previous = samples[i]!;
    const dh = p.elevation - previous.elevation;
    const dx = p.distance - previous.distance;
    climb += Math.max(0, dh);
    maxSlope = Math.max(maxSlope, Math.atan2(Math.abs(dh), dx) * 180 / Math.PI);
    surfaceDistance += Math.hypot(dx, dh);
  });
  return { samples, climb, maxSlope, surfaceDistance, distance: samples.at(-1)!.distance };
}

export const routeAnalyses = routes.map(route => ({ ...route, ...analyseRoute(route.points) }));

export const ramp = ["#476f5b", "#7b9864", "#b6b779", "#cfbf91", "#c9c3ab", "#e7e5d9"];
export function elevationColor(height: number): string {
  return ramp[Math.min(ramp.length - 1, Math.floor(height / 220))]!;
}

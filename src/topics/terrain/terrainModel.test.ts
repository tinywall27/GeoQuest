import { describe, expect, it } from "vitest";
import { analyseRoute, contourPoint, elevation, getContours, routeAnalyses, sampleRoute } from "./terrainModel";

describe("shared terrain model", () => {
  it("compares routes with exactly the same origin and destination", () => {
    for (const route of routeAnalyses) {
      expect(route.points[0]).toEqual([.1,.88]);
      expect(route.points.at(-1)).toEqual([.7,.33]);
      expect(route.samples[0]!.elevation).toBeCloseTo(elevation(.1,.88),8);
      expect(route.samples.at(-1)!.elevation).toBeCloseTo(elevation(.7,.33),8);
    }
  });
  it("straight-line distance agrees with independent Pythagorean distance", () => {
    expect(routeAnalyses[1]!.distance).toBeCloseTo(Math.hypot(2400,1650),8);
    for (const r of routeAnalyses) expect(r.surfaceDistance).toBeGreaterThan(r.distance);
  });
  it("reversing a route preserves distance and changes ascent by net elevation", () => {
    const forward=routeAnalyses[0]!;
    const reverse=analyseRoute([...forward.points].reverse());
    expect(reverse.distance).toBeCloseTo(forward.distance,8);
    expect(forward.climb-reverse.climb).toBeCloseTo(elevation(.7,.33)-elevation(.1,.88),5);
  });
  it("interior contour coordinates lie on their stated elevation", () => {
    for (const contour of getContours(100)) for (const polygon of contour.coordinates) for (const ring of polygon) {
      for (const raw of ring.filter((_,i)=>i%13===0)) {
        const [x,y]=contourPoint(raw);
        if (x>0 && x<1 && y>0 && y<1) expect(Math.abs(elevation(x,y)-contour.value)).toBeLessThan(2);
      }
    }
  });
  it("offers an actual distance versus slope tradeoff, without a safety score", () => {
    expect(routeAnalyses[2]!.distance).toBeGreaterThan(routeAnalyses[1]!.distance);
    expect(routeAnalyses[2]!.maxSlope).toBeLessThan(routeAnalyses[1]!.maxSlope);
    expect(sampleRoute(routeAnalyses[2]!.points)).toHaveLength(241);
  });
});

import { lazy, type ComponentType } from "react";

const registry: Record<string, ComponentType> = {
  "earth-motion-lab": lazy(() => import("./earth/EarthSunLab")),
  "contour-rescue": lazy(() => import("./terrain/TerrainLab")),
  "world-population-map": lazy(() => import("./population/PopulationLab")),
  "south-asia-monsoon": lazy(() => import("./agriculture/AgricultureLab")),
  "us-farm-belt": lazy(() => import("./interactives").then((module) => ({ default: module.UsFarmBelt }))),
  "china-terrain-steps": lazy(() => import("./interactives").then((module) => ({ default: module.ChinaTerrainSteps }))),
  "lake-restoration": lazy(() => import("./interactives").then((module) => ({ default: module.LakeRestoration }))),
  "china-farm-choice": lazy(() => import("./interactives").then((module) => ({ default: module.ChinaFarmChoice }))),
  "yangtze-belt": lazy(() => import("./interactives").then((module) => ({ default: module.YangtzeBelt }))),
  "loess-soil-water": lazy(() => import("./watershed/WatershedLab")),
};

export function getTopicInteractive(slug: string): ComponentType | undefined {
  return registry[slug];
}

export const interactiveSlugs = Object.freeze(Object.keys(registry));

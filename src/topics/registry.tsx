import { lazy, type ComponentType } from "react";

const registry: Record<string, ComponentType> = {
  "earth-motion-lab": lazy(() => import("./interactives").then((module) => ({ default: module.EarthMotionLab }))),
  "contour-rescue": lazy(() => import("./interactives").then((module) => ({ default: module.ContourRescue }))),
  "world-population-map": lazy(() => import("./interactives").then((module) => ({ default: module.WorldPopulationMap }))),
  "south-asia-monsoon": lazy(() => import("./interactives").then((module) => ({ default: module.SouthAsiaMonsoon }))),
  "us-farm-belt": lazy(() => import("./interactives").then((module) => ({ default: module.UsFarmBelt }))),
  "china-terrain-steps": lazy(() => import("./interactives").then((module) => ({ default: module.ChinaTerrainSteps }))),
  "lake-restoration": lazy(() => import("./interactives").then((module) => ({ default: module.LakeRestoration }))),
  "china-farm-choice": lazy(() => import("./interactives").then((module) => ({ default: module.ChinaFarmChoice }))),
  "yangtze-belt": lazy(() => import("./interactives").then((module) => ({ default: module.YangtzeBelt }))),
  "loess-soil-water": lazy(() => import("./interactives").then((module) => ({ default: module.LoessSoilWater }))),
};

export function getTopicInteractive(slug: string): ComponentType | undefined {
  return registry[slug];
}

export const interactiveSlugs = Object.freeze(Object.keys(registry));

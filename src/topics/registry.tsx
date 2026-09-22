import { lazy, type ComponentType } from "react";
import { selectedGroups } from './selected/selection';

const ReadingLab = lazy(() => import('./selected/ReadingLab'));
const ProcessLab = lazy(() => import('./selected/ProcessLab'));
const DecisionLab = lazy(() => import('./selected/DecisionLab'));

const registry: Record<string, ComponentType> = {
  ...Object.fromEntries(selectedGroups.reading.map(slug => [slug, ReadingLab])),
  ...Object.fromEntries(selectedGroups.process.map(slug => [slug, ProcessLab])),
  ...Object.fromEntries(selectedGroups.decisions.map(slug => [slug, DecisionLab])),
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

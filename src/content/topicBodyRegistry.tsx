import { lazy, type ComponentType } from "react";

const registry: Record<string, ComponentType> = {
  "map-choice-lab": lazy(() => import("../../content/topics/map-choice-lab/index.mdx")),
  "earth-evidence-grid": lazy(() => import("../../content/topics/earth-evidence-grid/index.mdx")),
  "climate-chart": lazy(() => import("../../content/topics/climate-chart/index.mdx")),
  "mountain-rain-shadow": lazy(() => import("../../content/topics/mountain-rain-shadow/index.mdx")),
  "water-transfer": lazy(() => import("../../content/topics/water-transfer/index.mdx")),
  "karez-water-budget": lazy(() => import("../../content/topics/karez-water-budget/index.mdx")),
  "settlement-location": lazy(() => import("../../content/topics/settlement-location/index.mdx")),
  "polar-station": lazy(() => import("../../content/topics/polar-station/index.mdx")),
  "factory-location": lazy(() => import("../../content/topics/factory-location/index.mdx")),
  "china-route-designer": lazy(() => import("../../content/topics/china-route-designer/index.mdx")),
  "earth-motion-lab": lazy(() => import("../../content/topics/earth-motion-lab/index.mdx")),
  "contour-rescue": lazy(() => import("../../content/topics/contour-rescue/index.mdx")),
  "world-population-map": lazy(() => import("../../content/topics/world-population-map/index.mdx")),
  "south-asia-monsoon": lazy(() => import("../../content/topics/south-asia-monsoon/index.mdx")),
  "us-farm-belt": lazy(() => import("../../content/topics/us-farm-belt/index.mdx")),
  "china-terrain-steps": lazy(() => import("../../content/topics/china-terrain-steps/index.mdx")),
  "lake-restoration": lazy(() => import("../../content/topics/lake-restoration/index.mdx")),
  "china-farm-choice": lazy(() => import("../../content/topics/china-farm-choice/index.mdx")),
  "yangtze-belt": lazy(() => import("../../content/topics/yangtze-belt/index.mdx")),
  "loess-soil-water": lazy(() => import("../../content/topics/loess-soil-water/index.mdx")),
};

export function getTopicBody(slug: string): ComponentType | undefined {
  return registry[slug];
}

export const topicBodySlugs = Object.freeze(Object.keys(registry));

import { lazy, type ComponentType } from "react";

const registry: Record<string, ComponentType> = {
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

import { topicManifests } from "#topic-manifests";
import type {
  CatalogEntry,
  ProductChannel,
  TopicPrototype,
  VolumeCode,
} from "../domain/topic";

export const volumeCatalog: ReadonlyArray<{
  code: VolumeCode;
  label: string;
  grade: string;
  description: string;
}> = [
  { code: "G7A", label: "七年级上册", grade: "七年级", description: "地球、地图、海陆与居民" },
  { code: "G7B", label: "七年级下册", grade: "七年级", description: "区域、国家与全球联系" },
  { code: "G8A", label: "八年级上册", grade: "八年级", description: "中国疆域、自然环境与资源" },
  { code: "G8B", label: "八年级下册", grade: "八年级", description: "中国区域差异与可持续发展" },
];

export const productChannels: ReadonlyArray<{
  key: ProductChannel;
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  index: string;
}> = [
  { key: "textbook-explorer", title: "教材探索", eyebrow: "按卷册出发", description: "把章节中的问题变成可操作的探索路线。", path: "/textbooks", index: "01" },
  { key: "map-lab", title: "地图实验室", eyebrow: "观察空间", description: "切换图层、寻找格局，用地图证据回答问题。", path: "/labs/maps", index: "02" },
  { key: "data-lab", title: "数据实验室", eyebrow: "读懂变化", description: "比较指标与时间，从数据中发现关系与例外。", path: "/labs/data", index: "03" },
  { key: "earth-lab", title: "地球实验室", eyebrow: "操纵变量", description: "改变条件，观察地球系统如何响应。", path: "/labs/earth", index: "04" },
  { key: "region-explorer", title: "区域探索", eyebrow: "连接要素", description: "从自然到人文，解释区域为什么如此不同。", path: "/regions", index: "05" },
  { key: "geo-challenge", title: "地理挑战", eyebrow: "作出判断", description: "在真实感情境中权衡证据，提出可说明的方案。", path: "/challenges", index: "06" },
];

export const prototypeLabels: Record<TopicPrototype, string> = {
  simulator: "变量模拟",
  "map-explorer": "地图探索",
  "story-map": "时空故事",
  "data-explorer": "数据探索",
  "image-explorer": "遥感对比",
  compare: "区域比较",
  "decision-lab": "决策模拟",
  "geo-challenge": "地理挑战",
};

function toCatalogEntry(
  topic: (typeof topicManifests)[number],
): CatalogEntry {
  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    coreQuestion: topic.coreQuestion,
    volume: topic.volume,
    chapter: topic.chapter,
    prototype: topic.prototype,
    channels: [...topic.channels],
    competencies: [...topic.competencies],
    status: topic.status,
    releaseBatch: topic.releaseBatch,
    classroomMinutes: topic.classroomMinutes,
    explorationMinutes: topic.explorationMinutes,
  };
}

/**
 * 开发服务器由完整公共投影生成；生产构建通过 Vite 别名只注入“已发布”投影。
 * 因而未审核主题不会进入生产目录、路由数据或互动分包。
 */
export const v1TopicCatalog: readonly CatalogEntry[] =
  topicManifests.map(toCatalogEntry);

export function getCatalogEntry(slug: string): CatalogEntry | undefined {
  return v1TopicCatalog.find((topic) => topic.slug === slug);
}

export function getTopicsByChannel(channel: ProductChannel): readonly CatalogEntry[] {
  return v1TopicCatalog.filter((topic) => topic.channels.includes(channel));
}

export function getTopicsByVolume(volume: VolumeCode): readonly CatalogEntry[] {
  return v1TopicCatalog.filter((topic) => topic.volume === volume);
}

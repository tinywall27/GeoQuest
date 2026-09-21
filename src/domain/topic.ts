export const volumeCodes = ["G7A", "G7B", "G8A", "G8B"] as const;
export type VolumeCode = (typeof volumeCodes)[number];

export const prototypeKeys = [
  "simulator",
  "map-explorer",
  "story-map",
  "data-explorer",
  "image-explorer",
  "compare",
  "decision-lab",
  "geo-challenge",
] as const;
export type TopicPrototype = (typeof prototypeKeys)[number];

export const productChannelKeys = [
  "textbook-explorer",
  "map-lab",
  "data-lab",
  "earth-lab",
  "region-explorer",
  "geo-challenge",
] as const;
export type ProductChannel = (typeof productChannelKeys)[number];

export const competencyKeys = [
  "人地协调观",
  "综合思维",
  "区域认知",
  "地理实践力",
] as const;
export type CoreCompetency = (typeof competencyKeys)[number];

export const topicStatuses = [
  "候选",
  "已设计",
  "开发中",
  "待审核",
  "已发布",
  "已归档",
] as const;
export type TopicStatus = (typeof topicStatuses)[number];

export const reviewStatuses = [
  "unreviewed",
  "initial",
  "approved",
  "blocked",
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export interface ReviewRecord {
  status: ReviewStatus;
  reviewer?: string | undefined;
  checkedAt?: string | undefined;
  evidencePath?: string | undefined;
  notes?: string | undefined;
}

export const aiReviewStatuses = ["pending", "passed", "blocked"] as const;
export type AiReviewStatus = (typeof aiReviewStatuses)[number];

export interface AiReviewRecord {
  status: AiReviewStatus;
  agent: string;
  checkedAt: string;
  evidencePath: string;
  scope?: string[] | undefined;
  version?: `${number}.${number}.${number}` | undefined;
}

// Keep the acronym-spelled alias available to callers that use the field name
// as the type name while using the project's existing PascalCase convention.
export type AIReviewRecord = AiReviewRecord;

interface SourceBase {
  id: string;
  title: string;
  attribution: string;
  review: ReviewRecord;
}

export interface ReferenceSource extends SourceBase {
  kind: "reference";
  publisher: string;
  url: string;
  verifiedAt?: string | undefined;
}

export interface DatasetSource extends SourceBase {
  kind: "dataset";
  url: string;
  version: string;
  license: string;
  retrievedAt: string;
  timeCoverage: string;
  spatialCoverage: string;
  snapshotPath: string;
  checksum: string;
  processing: string[];
}

export interface MapSource extends SourceBase {
  kind: "map";
  assetId: string;
  version: string;
  url: string;
  license: string;
  reviewNumber?: string | undefined;
  modified: boolean;
  localAssetPath: string;
}

export interface MediaSource extends SourceBase {
  kind: "media";
  creator: string;
  license: string;
  url: string;
  localAssetPath: string;
  modified: boolean;
}

export interface SimulationSource extends SourceBase {
  kind: "simulation";
  method: string;
  parameters: string[];
  version: string;
  limitations: string[];
}

export type SourceRef =
  | ReferenceSource
  | DatasetSource
  | MapSource
  | MediaSource
  | SimulationSource;

export interface CatalogEntry {
  id: `GQ-T${string}`;
  slug: string;
  title: string;
  summary: string;
  coreQuestion: string;
  volume: VolumeCode;
  chapter: string;
  prototype: TopicPrototype;
  channels: ProductChannel[];
  competencies: CoreCompetency[];
  status: TopicStatus;
  releaseBatch: `Sprint ${1 | 2 | 3 | 4 | 5}` | "backlog";
  classroomMinutes: number;
  explorationMinutes: number;
}

export interface TopicManifestSource extends CatalogEntry {
  modes: {
    exploration: {
      path: `/topics/${string}`;
    };
    classroom: {
      query: "?mode=classroom";
      sameContent: true;
    };
  };
  primaryInteraction: {
    object: string;
    action: string;
    feedback: string;
  };
  evidenceOutput: {
    type: "地图" | "图表" | "对比表" | "标注" | "路线" | "情景结果" | "方案卡";
    description: string;
    persistsFreeText: false;
  };
  reflectionPrompt: string;
  hints: string[];
  components: string[];
  sources: SourceRef[];
  reviews?: {
    teaching: ReviewRecord;
    curriculum: ReviewRecord;
    textbook: ReviewRecord;
    data: ReviewRecord;
    map: ReviewRecord;
    copyright: ReviewRecord;
    privacy: ReviewRecord;
    technical: ReviewRecord;
  } | undefined;
  aiReview?: AiReviewRecord | undefined;
  version: `${number}.${number}.${number}`;
  updatedAt: string;
}

export type PublicReviewSummary = Pick<ReviewRecord, "status" | "checkedAt">;
export type PublicAiReviewSummary = Pick<AiReviewRecord, "status" | "checkedAt">;

type PublicSourceProjection<T> = T extends SourceRef
  ? Omit<T, "review"> & { review: PublicReviewSummary }
  : never;

export type PublicSourceRef = PublicSourceProjection<SourceRef>;

export type PublicTopicManifest = Omit<
  TopicManifestSource,
  "reviews" | "sources" | "aiReview"
> & {
  sources: PublicSourceRef[];
  aiReview?: PublicAiReviewSummary | undefined;
  reviewSummary: {
    status: ReviewStatus | AiReviewStatus;
    checkedAt?: string | undefined;
  };
};

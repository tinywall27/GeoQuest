import { describe, expect, it } from "vitest";
import { toPublicTopicManifest } from "../../src/content/publicManifest";
import { reviewRecordSchema, topicManifestSourceSchema } from "../../src/content/schema";
import { topicManifests as developmentManifests } from "../../src/generated/topic-manifests";
import { topicManifests as publishedManifests } from "../../src/generated/published-topic-manifests";

const approvedReview = {
  status: "approved" as const,
  reviewer: "internal-reviewer",
  checkedAt: "2026-08-09",
  evidencePath: "internal/reviews/example.md",
  notes: "仅供内部审核",
};

const passedAiReview = {
  status: "passed" as const,
  agent: "codex-content-review",
  checkedAt: "2026-09-16",
  evidencePath: "docs/PROJECT_CONSTRAINTS.md",
  scope: ["schema", "sources", "offline"],
  version: "1.0.0",
};

const validManifest = {
  id: "GQ-T003",
  slug: "earth-motion-lab",
  title: "如果地球不这样转",
  summary: "通过原创教学模型观察地球运动变量改变后的结果。",
  coreQuestion: "地轴倾角改变时昼长会怎样变化？",
  volume: "G7A",
  chapter: "地球的运动",
  prototype: "simulator",
  channels: ["earth-lab"],
  competencies: ["综合思维"],
  status: "已发布",
  releaseBatch: "Sprint 1",
  classroomMinutes: 12,
  explorationMinutes: 20,
  modes: {
    exploration: { path: "/topics/earth-motion-lab" },
    classroom: { query: "?mode=classroom", sameContent: true },
  },
  primaryInteraction: {
    object: "二维地球运动模型",
    action: "改变倾角并比较昼长",
    feedback: "同步显示昼长与太阳直射纬度",
  },
  evidenceOutput: {
    type: "对比表",
    description: "三组倾角情景的昼长对比",
    persistsFreeText: false,
  },
  reflectionPrompt: "这个模型不能代表真实地球的哪些细节？",
  hints: ["一次只改变一个变量"],
  components: ["EarthMotionLab"],
  sources: [
    {
      kind: "simulation",
      id: "SIM-EARTH-001",
      title: "GeoQuest 地球运动教学模型",
      attribution: "GeoQuest 原创",
      method: "简化天文几何关系",
      parameters: ["地轴倾角", "观测纬度"],
      version: "1.0.0",
      limitations: ["天体大小与距离不按比例"],
      review: approvedReview,
    },
  ],
  reviews: {
    teaching: approvedReview,
    curriculum: approvedReview,
    textbook: approvedReview,
    data: approvedReview,
    map: approvedReview,
    copyright: approvedReview,
    privacy: approvedReview,
    technical: approvedReview,
  },
  aiReview: passedAiReview,
  version: "1.0.0",
  updatedAt: "2026-08-09",
};

describe("主题内容契约", () => {
  it("生产投影只允许已发布主题", () => {
    expect(developmentManifests).toHaveLength(10);
    expect(publishedManifests.every((topic) => topic.status === "已发布")).toBe(true);
  });

  it("approved 审核必须含审核人、日期和证据", () => {
    expect(() => reviewRecordSchema.parse({ status: "approved" })).toThrow(
      /审核人、日期和证据路径/,
    );
  });

  it("已发布主题只要求当前版本的 passed AI 审核", () => {
    const withoutLegacyReviews = structuredClone(validManifest) as Record<string, unknown>;
    delete withoutLegacyReviews.reviews;
    expect(topicManifestSourceSchema.parse(withoutLegacyReviews).aiReview).toEqual(
      passedAiReview,
    );

    const withLegacyPendingReview = structuredClone(validManifest) as Record<string, unknown>;
    (withLegacyPendingReview.reviews as Record<string, unknown>).teaching = {
      status: "unreviewed",
    };
    expect(
      topicManifestSourceSchema.parse(withLegacyPendingReview).reviews?.teaching.status,
    ).toBe("unreviewed");

    const staleReview = structuredClone(validManifest);
    staleReview.aiReview.version = "0.9.0";
    expect(() => topicManifestSourceSchema.parse(staleReview)).toThrow(/当前 version/);
  });

  it("没有旧版 reviews 的开发主题不会被投影成 approved", () => {
    const draft = structuredClone(validManifest) as Record<string, unknown>;
    delete draft.reviews;
    delete draft.aiReview;
    draft.status = "开发中";
    const publicManifest = toPublicTopicManifest(
      topicManifestSourceSchema.parse(draft),
    );
    expect(publicManifest.reviewSummary).toEqual({ status: "unreviewed" });
  });

  it("AI 审核记录拒绝绝对路径和目录穿越", () => {
    const absolutePath = structuredClone(validManifest);
    absolutePath.aiReview.evidencePath = "/tmp/review.md";
    expect(() => topicManifestSourceSchema.parse(absolutePath)).toThrow(/仓库内相对路径/);

    const parentPath = structuredClone(validManifest);
    parentPath.aiReview.evidencePath = "reviews/../review.md";
    expect(() => topicManifestSourceSchema.parse(parentPath)).toThrow(/仓库内相对路径/);
  });

  it("双模式必须共用与 slug 一致的主题地址", () => {
    const invalid = structuredClone(validManifest);
    invalid.modes.exploration.path = "/topics/wrong-topic";
    expect(() => topicManifestSourceSchema.parse(invalid)).toThrow(/必须与主题 slug 一致/);
  });

  it("公共投影移除内部审核信息", () => {
    const parsed = topicManifestSourceSchema.parse(validManifest);
    const publicManifest = toPublicTopicManifest(parsed);
    const serialized = JSON.stringify(publicManifest);

    expect(publicManifest.reviewSummary).toEqual({
      status: "passed",
      checkedAt: "2026-09-16",
    });
    expect(publicManifest.aiReview).toEqual({
      status: "passed",
      checkedAt: "2026-09-16",
    });
    expect(serialized).not.toContain("internal-reviewer");
    expect(serialized).not.toContain("codex-content-review");
    expect(serialized).not.toContain("evidencePath");
    expect(serialized).not.toContain("notes");
    expect(publicManifest.sources[0]?.review).toEqual({
      status: "approved",
      checkedAt: "2026-08-09",
    });
  });
});

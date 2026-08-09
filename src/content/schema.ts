import { z } from "zod";
import {
  competencyKeys,
  productChannelKeys,
  prototypeKeys,
  reviewStatuses,
  topicStatuses,
  volumeCodes,
} from "../domain/topic";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const sha256 = /^sha256:[a-f0-9]{64}$/;

export const reviewRecordSchema = z
  .object({
    status: z.enum(reviewStatuses),
    reviewer: z.string().min(1).optional(),
    checkedAt: z.string().regex(isoDate).optional(),
    evidencePath: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((review, context) => {
    if (
      review.status === "approved" &&
      (!review.reviewer || !review.checkedAt || !review.evidencePath)
    ) {
      context.addIssue({
        code: "custom",
        message: "approved 审核必须同时记录审核人、日期和证据路径",
      });
    }
  });

const sourceBase = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  attribution: z.string().min(1),
  review: reviewRecordSchema,
});

export const sourceRefSchema = z.discriminatedUnion("kind", [
  sourceBase
    .extend({
      kind: z.literal("reference"),
      publisher: z.string().min(1),
      url: z.url(),
      verifiedAt: z.string().regex(isoDate).optional(),
    })
    .strict(),
  sourceBase
    .extend({
      kind: z.literal("dataset"),
      url: z.url(),
      version: z.string().min(1),
      license: z.string().min(1),
      retrievedAt: z.string().regex(isoDate),
      timeCoverage: z.string().min(1),
      spatialCoverage: z.string().min(1),
      snapshotPath: z.string().min(1),
      checksum: z.string().regex(sha256),
      processing: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  sourceBase
    .extend({
      kind: z.literal("map"),
      assetId: z.string().min(1),
      version: z.string().min(1),
      url: z.url(),
      license: z.string().min(1),
      reviewNumber: z.string().min(1).optional(),
      modified: z.boolean(),
      localAssetPath: z.string().min(1),
    })
    .strict(),
  sourceBase
    .extend({
      kind: z.literal("media"),
      creator: z.string().min(1),
      license: z.string().min(1),
      url: z.url(),
      localAssetPath: z.string().min(1),
      modified: z.boolean(),
    })
    .strict(),
  sourceBase
    .extend({
      kind: z.literal("simulation"),
      method: z.string().min(1),
      parameters: z.array(z.string().min(1)).min(1),
      version: z.string().min(1),
      limitations: z.array(z.string().min(1)).min(1),
    })
    .strict(),
]);

const catalogEntryFields = {
  id: z.custom<`GQ-T${string}`>((value) => /^GQ-T\d{3}$/.test(String(value)), {
    message: "主题 ID 必须使用 GQ-T001 形式",
  }),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2),
  summary: z.string().min(10),
  coreQuestion: z.string().min(5),
  volume: z.enum(volumeCodes),
  chapter: z.string().min(1),
  prototype: z.enum(prototypeKeys),
  channels: z.array(z.enum(productChannelKeys)).min(1),
  competencies: z.array(z.enum(competencyKeys)).min(1),
  status: z.enum(topicStatuses),
  releaseBatch: z.union([
    z.literal("Sprint 1"),
    z.literal("Sprint 2"),
    z.literal("Sprint 3"),
    z.literal("Sprint 4"),
    z.literal("Sprint 5"),
    z.literal("backlog"),
  ]),
  classroomMinutes: z.number().int().min(8).max(15),
  explorationMinutes: z.number().int().min(15).max(25),
} as const;

export const catalogEntrySchema = z.object(catalogEntryFields).strict();

export const topicManifestSourceSchema = z
  .object({
    ...catalogEntryFields,
    modes: z
      .object({
        exploration: z
          .object({
            path: z.custom<`/topics/${string}`>(
              (value) => /^\/topics\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value)),
              { message: "探索模式路径必须使用 /topics/:slug" },
            ),
          })
          .strict(),
        classroom: z
          .object({
            query: z.literal("?mode=classroom"),
            sameContent: z.literal(true),
          })
          .strict(),
      })
      .strict(),
    primaryInteraction: z
      .object({
        object: z.string().min(1),
        action: z.string().min(1),
        feedback: z.string().min(1),
      })
      .strict(),
    evidenceOutput: z
      .object({
        type: z.enum(["地图", "图表", "对比表", "标注", "路线", "情景结果", "方案卡"]),
        description: z.string().min(1),
        persistsFreeText: z.literal(false),
      })
      .strict(),
    reflectionPrompt: z.string().min(5),
    hints: z.array(z.string().min(1)),
    components: z.array(z.string().min(1)).min(1),
    sources: z.array(sourceRefSchema),
    reviews: z
      .object({
        teaching: reviewRecordSchema,
        curriculum: reviewRecordSchema,
        textbook: reviewRecordSchema,
        data: reviewRecordSchema,
        map: reviewRecordSchema,
        copyright: reviewRecordSchema,
        privacy: reviewRecordSchema,
        technical: reviewRecordSchema,
      })
      .strict(),
    version: z.custom<`${number}.${number}.${number}`>(
      (value) => /^\d+\.\d+\.\d+$/.test(String(value)),
      { message: "版本必须使用语义版本格式" },
    ),
    updatedAt: z.string().regex(isoDate),
  })
  .strict()
  .superRefine((topic, context) => {
    if (topic.modes.exploration.path !== `/topics/${topic.slug}`) {
      context.addIssue({
        code: "custom",
        path: ["modes", "exploration", "path"],
        message: "探索模式路径必须与主题 slug 一致",
      });
    }
    if (topic.status === "已发布") {
      for (const [gate, review] of Object.entries(topic.reviews)) {
        if (review.status !== "approved") {
          context.addIssue({
            code: "custom",
            path: ["reviews", gate, "status"],
            message: "已发布主题的全部审核门禁必须为 approved",
          });
        }
      }
    }
  });

export type ParsedTopicManifest = z.infer<typeof topicManifestSourceSchema>;

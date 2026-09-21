import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parse } from "yaml";
import { topicManifestSourceSchema } from "../src/content/schema.ts";
import { toPublicTopicManifest } from "../src/content/publicManifest.ts";

const projectRoot = process.cwd();
const manifestPattern = "content/topics/*/manifest.yaml";
const forbiddenPublicKeys = new Set([
  "sourceFile",
  "bookPages",
  "pdfPages",
  "internalEvidencePath",
  "privateLocator",
]);

function findForbiddenKey(value: unknown, trail: string[] = []): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, child] of Object.entries(value)) {
    const nextTrail = [...trail, key];
    if (forbiddenPublicKeys.has(key)) return nextTrail.join(".");
    const nested = findForbiddenKey(child, nextTrail);
    if (nested) return nested;
  }
  return undefined;
}

const manifestFiles = await fg(manifestPattern, {
  cwd: projectRoot,
  absolute: true,
  onlyFiles: true,
});

const ids = new Map<string, string>();
const slugs = new Map<string, string>();
const failures: string[] = [];

function resolveRepositoryPath(relativePath: string): string | undefined {
  if (path.isAbsolute(relativePath)) return undefined;
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  return relative.startsWith("..") || path.isAbsolute(relative) ? undefined : resolved;
}

async function requirePublishedAsset(
  displayPath: string,
  sourceId: string,
  relativePath: string,
): Promise<string | undefined> {
  const resolved = resolveRepositoryPath(relativePath);
  if (!resolved) {
    failures.push(`${displayPath}: ${sourceId} 的本地资产路径必须是仓库内相对路径`);
    return undefined;
  }
  try {
    const info = await stat(resolved);
    if (!info.isFile() || info.size === 0) {
      throw new Error("evidence must be a non-empty file");
    }
    return resolved;
  } catch {
    failures.push(`${displayPath}: ${sourceId} 的已发布本地资产不存在：${relativePath}`);
    return undefined;
  }
}

async function requirePublishedAiEvidence(
  displayPath: string,
  relativePath: string,
): Promise<void> {
  const resolved = resolveRepositoryPath(relativePath);
  if (!resolved) {
    failures.push(`${displayPath}: aiReview.evidencePath 必须是仓库内相对路径`);
    return;
  }
  try {
    if (!(await stat(resolved)).isFile()) {
      throw new Error("path is not a file");
    }
  } catch {
    failures.push(`${displayPath}: aiReview 证据文件不存在：${relativePath}`);
  }
}

for (const file of manifestFiles) {
  const displayPath = path.relative(projectRoot, file);
  try {
    const raw = parse(await readFile(file, "utf8")) as unknown;
    const forbiddenPath = findForbiddenKey(raw);
    if (forbiddenPath) {
      failures.push(`${displayPath}: 公开 manifest 含内部字段 ${forbiddenPath}`);
      continue;
    }

    const topic = topicManifestSourceSchema.parse(raw);
    try {
      await access(path.join(path.dirname(file), "index.mdx"));
    } catch {
      failures.push(`${displayPath}: 缺少同目录 index.mdx 主题正文`);
    }
    const serializedPublicManifest = JSON.stringify(toPublicTopicManifest(topic));
    for (const forbiddenReviewField of ["reviewer", "evidencePath", "notes"]) {
      if (serializedPublicManifest.includes(`"${forbiddenReviewField}"`)) {
        failures.push(`${displayPath}: 公共投影泄漏审核字段 ${forbiddenReviewField}`);
      }
    }
    const existingId = ids.get(topic.id);
    const existingSlug = slugs.get(topic.slug);
    if (existingId) failures.push(`${displayPath}: 主题 ID 与 ${existingId} 重复`);
    if (existingSlug) failures.push(`${displayPath}: slug 与 ${existingSlug} 重复`);
    ids.set(topic.id, displayPath);
    slugs.set(topic.slug, displayPath);

    const folderSlug = path.basename(path.dirname(file));
    if (folderSlug !== topic.slug) {
      failures.push(`${displayPath}: 文件夹名必须与 slug 一致`);
    }

    if (topic.status === "已发布") {
      if (!topic.aiReview || topic.aiReview.status !== "passed") {
        failures.push(`${displayPath}: 已发布主题必须有 status 为 passed 的 aiReview`);
      }
      if (topic.aiReview && topic.aiReview.version !== topic.version) {
        failures.push(`${displayPath}: aiReview.version 必须与主题 version 一致`);
      }
      if (topic.aiReview) {
        await requirePublishedAiEvidence(displayPath, topic.aiReview.evidencePath);
      }
      for (const source of topic.sources) {
        if (source.review.status === "blocked") {
          failures.push(`${displayPath}: 来源 ${source.id} 仍处于 blocked 状态`);
        }
        if (source.kind === "reference" && !source.verifiedAt) {
          failures.push(`${displayPath}: 已发布事实参考 ${source.id} 缺少核验日期`);
        }
        if (source.kind === "dataset") {
          const snapshot = await requirePublishedAsset(
            displayPath,
            source.id,
            source.snapshotPath,
          );
          if (snapshot) {
            const checksum = `sha256:${createHash("sha256").update(await readFile(snapshot)).digest("hex")}`;
            if (checksum !== source.checksum) {
              failures.push(`${displayPath}: ${source.id} 的快照 SHA-256 与 manifest 不一致`);
            }
          }
        }
        if (source.kind === "map" || source.kind === "media") {
          await requirePublishedAsset(displayPath, source.id, source.localAssetPath);
        }
      }
    }
  } catch (error) {
    failures.push(
      `${displayPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (failures.length > 0) {
  console.error(["内容校验失败：", ...failures.map((failure) => `- ${failure}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`内容校验通过：${manifestFiles.length} 个公开主题 manifest`);
}

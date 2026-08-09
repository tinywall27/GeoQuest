#!/usr/bin/env node

import { lstat, readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const maxPublicFileBytes = 10 * 1024 * 1024;
const forbiddenExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".7z",
  ".rar",
]);
const forbiddenSegments = new Set([
  "work",
  "scratch",
  "private",
  "internal",
  "raw",
  "pending",
  "unreviewed",
  ".agents",
  ".codex",
]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".map",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const absolutePathPatterns = [
  { label: "macOS 用户目录", pattern: /\/Users\/[A-Za-z0-9._-]+\//u },
  { label: "Linux 用户目录", pattern: /\/home\/[A-Za-z0-9._-]+\//u },
  { label: "Windows 用户目录", pattern: /[A-Za-z]:\\Users\\[^\\\s]+\\/u },
  { label: "本地会话链接", pattern: /chatgpt-conversation:\/\//u },
];
const internalMetadataPattern = /\b(?:sourceFile|bookPages|pdfPages|printPages)\b/u;
const privateReviewMetadataPattern = /\b(?:reviewer|evidencePath|notes)\b/u;

function listCandidateFiles() {
  const result = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  );

  if (result.status !== 0) {
    const detail = result.stderr.trim() || "unknown git error";
    throw new Error(`无法列出公开候选文件；请先初始化 Git 仓库：${detail}`);
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((file) => file.replaceAll("\\", "/"));
}

async function listBuildFiles(directory = "dist") {
  const absoluteDirectory = path.resolve(root, directory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listBuildFiles(relative)));
    else files.push(relative);
  }
  return files;
}

function isPublicPayloadPath(file) {
  const extension = path.posix.extname(file).toLowerCase();
  return (
    file.startsWith("public/") ||
    file.startsWith("src/generated/") ||
    file.startsWith("dist/") ||
    (file.startsWith("src/content/") && [".json", ".yaml", ".yml", ".mdx"].includes(extension)) ||
    /\.(?:json|ya?ml|mdx)$/u.test(file)
  );
}

function isBrowserPayloadPath(file) {
  return (
    file.startsWith("public/") ||
    file.startsWith("src/generated/") ||
    file.startsWith("dist/")
  );
}

const errors = [];
let files = [];

try {
  files = [...new Set([...listCandidateFiles(), ...(await listBuildFiles())])];
} catch (error) {
  console.error(`Public boundary check failed\n- ${error.message}`);
  process.exit(1);
}

const draftMarkers = [];
for (const file of files.filter((candidate) =>
  /^content\/topics\/[^/]+\/manifest\.yaml$/u.test(candidate),
)) {
  const content = await readFile(path.resolve(root, file), "utf8");
  const status = content.match(/^status:\s*["']?([^\n"']+)["']?\s*$/mu)?.[1]?.trim();
  if (status === "已发布") continue;
  for (const field of ["id", "slug", "title"]) {
    const value = content.match(
      new RegExp(`^${field}:\\s*["']?([^\\n"']+)["']?\\s*$`, "mu"),
    )?.[1]?.trim();
    if (value) draftMarkers.push({ file, value });
  }
}

for (const file of files) {
  const normalized = path.posix.normalize(file);
  const segments = normalized.split("/");
  const extension = path.posix.extname(normalized).toLowerCase();
  const absolute = path.resolve(root, file);

  if (normalized.startsWith("../") || path.isAbsolute(file)) {
    errors.push(`${file}: 路径不在仓库内`);
    continue;
  }
  if (segments.some((segment) => forbiddenSegments.has(segment))) {
    errors.push(`${file}: 位于禁止公开的目录`);
  }
  if (forbiddenExtensions.has(extension)) {
    errors.push(`${file}: 文件类型禁止进入公开仓库`);
  }
  if (/(?:教材|课程标准|主题开发矩阵)/u.test(path.posix.basename(normalized))) {
    errors.push(`${file}: 文件名表明它可能是内部教材、课标或规划材料`);
  }

  let stat;
  try {
    stat = await lstat(absolute);
  } catch {
    errors.push(`${file}: 无法读取文件`);
    continue;
  }

  if (stat.isSymbolicLink()) {
    errors.push(`${file}: 公开仓库不接受符号链接`);
    continue;
  }
  if (!stat.isFile()) continue;
  if (stat.size > maxPublicFileBytes) {
    errors.push(`${file}: ${(stat.size / 1024 / 1024).toFixed(1)} MiB，超过 10 MiB 公开文件预算`);
  }
  if (!textExtensions.has(extension) || stat.size > 2 * 1024 * 1024) continue;

  const content = await readFile(absolute, "utf8");
  for (const { label, pattern } of absolutePathPatterns) {
    if (pattern.test(content)) errors.push(`${file}: 含${label}`);
  }
  if (isPublicPayloadPath(normalized) && internalMetadataPattern.test(content)) {
    errors.push(`${file}: 公开内容载荷含内部教材或课标定位字段`);
  }
  if (isBrowserPayloadPath(normalized) && privateReviewMetadataPattern.test(content)) {
    errors.push(`${file}: 浏览器载荷含审核人、证据路径或内部备注字段`);
  }
  if (normalized.startsWith("dist/")) {
    for (const marker of draftMarkers) {
      if (content.includes(marker.value)) {
        errors.push(`${file}: 生产构建含未发布主题 ${marker.value}（${marker.file}）`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Public boundary check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public boundary check passed (${files.length} files checked).`);

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const PROJECT_PREFIX = "GeoLandform/Landforms1";
const PROJECT_ROUTE = `/${PROJECT_PREFIX}`;
const DEFAULT_SOURCE = new URL("../projects/landforms1/index.html", import.meta.url);

function toPath(value) {
  return value instanceof URL ? fileURLToPath(value) : resolve(value);
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Return the CSP hash source for the one inline script in Landforms1.
 *
 * The script body is hashed exactly as it appears between the opening and
 * closing script tags. Do not trim or otherwise normalize it: CSP hashes are
 * byte-sensitive.
 */
export function extractInlineScriptSha256(source) {
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1 || /<script\b[^>]*\bsrc\s*=/i.test(source)) {
    throw new Error("Landforms1 must contain exactly one self-contained inline script");
  }

  return createHash("sha256").update(scripts[0][2], "utf8").digest("base64");
}

/**
 * Render only the Landforms1 header rules. The caller must combine these
 * rules with the Pages root headers so that the Landforms1 path receives this
 * CSP instead of an inherited app CSP with a conflicting script-src value.
 */
export function buildLandforms1Headers(scriptSha256) {
  const csp = [
    "default-src 'none'",
    `script-src 'sha256-${scriptSha256}'`,
    "style-src 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
  ].join("; ");
  const headers = [
    `Content-Security-Policy: ${csp}`,
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "Referrer-Policy: no-referrer",
    "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
    "Cache-Control: public, max-age=0, must-revalidate, no-transform",
  ].join("\n  ");

  return `${PROJECT_ROUTE}\n  ${headers}\n${PROJECT_ROUTE}/*\n  ${headers}\n`;
}

/**
 * Copy the migrated single-file project into the Pages output and return the
 * project-specific headers for the caller to merge into its root _headers.
 * Importing this module has no filesystem side effects.
 */
export async function prepareProjects({ distDir = "dist", sourcePath = DEFAULT_SOURCE } = {}) {
  const sourceFile = toPath(sourcePath);
  const outputFile = resolve(toPath(distDir), PROJECT_PREFIX, "index.html");
  const sourceBytes = await readFile(sourceFile);
  const source = sourceBytes.toString("utf8");
  const scriptSha256 = extractInlineScriptSha256(source);

  await mkdir(dirname(outputFile), { recursive: true });
  await copyFile(sourceFile, outputFile);

  return {
    project: "landforms1",
    route: `${PROJECT_ROUTE}/`,
    sourceFile,
    outputFile,
    sourceSha256: sha256Hex(sourceBytes),
    scriptSha256,
    headers: buildLandforms1Headers(scriptSha256),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await prepareProjects();
  console.log(`Prepared ${result.route}`);
  console.log(`HTML SHA-256: ${result.sourceSha256}`);
  console.log(`Inline script CSP hash: sha256-${result.scriptSha256}`);
  console.log("\nProject header fragment:\n" + result.headers);
}

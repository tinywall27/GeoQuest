import { mkdir, readdir, rename, writeFile, readFile } from "node:fs/promises";
import { prepareProjects } from "./prepare-projects.mjs";

// Keep the application and its assets below its project prefix. Other project
// paths must not fall through to GeoQuest's client-side router.
const html = await readFile("dist/index.html", "utf8");
if (!html.includes('src="/geoquest/assets/')) {
  throw new Error("Pages builds require VITE_BASE_PATH=/geoquest/");
}
const entries = await readdir("dist");
await mkdir("dist/geoquest", { recursive: true });
for (const entry of entries) await rename(`dist/${entry}`, `dist/geoquest/${entry}`);
const commonHeaders = await readFile("dist/geoquest/_headers", "utf8");
const appCsp = commonHeaders.split("\n").find((line) => line.trim().startsWith("Content-Security-Policy:"));
if (!appCsp) throw new Error("Missing GeoQuest CSP");
// Pages combines matching header values. Scope each application's CSP rather
// than stacking the GeoQuest script policy on the standalone inline script.
const sharedHeaders = commonHeaders.split("\n").filter((line) => line !== appCsp && !line.trim().startsWith("Referrer-Policy:")).join("\n");
const project = await prepareProjects();
const appHeaders = ["/", "/index.html", "/portal.css", "/404.html", "/geoquest/*"].map((route) => `${route}\n${appCsp}\n  Referrer-Policy: strict-origin-when-cross-origin\n`).join("");
const standaloneHeaders = project.headers.split("\n").filter((line) => !/^\s+(X-Content-Type-Options|X-Frame-Options|Permissions-Policy):/.test(line)).join("\n");
await writeFile("dist/_headers", `${sharedHeaders}\n${appHeaders}${standaloneHeaders}`);
const appRoutes = ["topics", "topics/*", "textbooks", "textbooks/*", "labs/*", "regions", "challenges", "classroom", "sources", "settings"];
await writeFile("dist/_redirects", "/geoquest /geoquest/ 301\n/GeoLandform/Landforms1 /GeoLandform/Landforms1/ 301\n" + appRoutes.map((route) => `/geoquest/${route} /geoquest/ 200\n`).join(""));
await import("./build-portal.mjs");
await writeFile("dist/404.html", `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>页面未找到</title><body><main><h1>页面未找到</h1><p><a href="/">返回地理项目目录</a></p></main></body></html>\n`);
console.log("Pages output prepared: /geoquest/ with scoped SPA fallback.");

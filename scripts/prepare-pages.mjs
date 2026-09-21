import { mkdir, readdir, rename, copyFile, writeFile, readFile } from "node:fs/promises";

// Keep the application and its assets below its project prefix. Other project
// paths must not fall through to GeoQuest's client-side router.
const html = await readFile("dist/index.html", "utf8");
if (!html.includes('src="/geoquest/assets/')) {
  throw new Error("Pages builds require VITE_BASE_PATH=/geoquest/");
}
const entries = await readdir("dist");
await mkdir("dist/geoquest", { recursive: true });
for (const entry of entries) await rename(`dist/${entry}`, `dist/geoquest/${entry}`);
await copyFile("dist/geoquest/_headers", "dist/_headers");
const appRoutes = ["topics", "topics/*", "textbooks", "textbooks/*", "labs/*", "regions", "challenges", "classroom", "sources", "settings"];
await writeFile("dist/_redirects", "/geoquest /geoquest/ 301\n" + appRoutes.map((route) => `/geoquest/${route} /geoquest/ 200\n`).join(""));
await writeFile("dist/index.html", `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>地理互动项目</title><body><main><h1>地理互动项目</h1><p><a href="/geoquest/">GeoQuest · 地理智探</a>：五个地理课堂探究实验。</p></main></body></html>\n`);
await writeFile("dist/404.html", `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>页面未找到</title><body><main><h1>页面未找到</h1><p><a href="/">返回地理项目目录</a></p></main></body></html>\n`);
console.log("Pages output prepared: /geoquest/ with scoped SPA fallback.");

import { readFile, writeFile, copyFile } from "node:fs/promises";

const projects = JSON.parse(await readFile("portal/projects.json", "utf8"));
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const ids = new Set();
const urls = new Set();
if (!Array.isArray(projects) || projects.length === 0) throw new Error("Portal requires at least one live project");
for (const project of projects) {
  for (const field of ["id", "name", "category", "description", "url"]) {
    if (typeof project[field] !== "string" || !project[field].trim()) throw new Error(`Missing project ${field}`);
  }
  if (!/^[a-z0-9-]+$/.test(project.id) || ids.has(project.id) || urls.has(project.url)) throw new Error("Invalid or duplicate portal project");
  if (!/^\/(?!\/)[a-z0-9/_-]+\/$/i.test(project.url) && !/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(project.url)) throw new Error(`Invalid project URL: ${project.id}`);
  for (const field of ["tags", "topics"]) {
    if (!Array.isArray(project[field]) || project[field].length === 0 || project[field].some((value) => typeof value !== "string" || !value.trim())) throw new Error(`Invalid project ${field}`);
  }
  ids.add(project.id);
  urls.add(project.url);
}
const cards = projects.map((project, index) => `<a class="project-card" href="${escapeHtml(project.url)}" aria-label="进入${escapeHtml(project.name)}">
  <div class="project-art" aria-hidden="true"><svg viewBox="0 0 120 90" fill="none"><circle cx="91" cy="19" r="10" fill="#d9c992"/><path d="M6 74 42 16 66 53 81 32 114 74Z" fill="#c1d2ae" stroke="#63845a" stroke-width="1.5"/><path d="M27 41 42 16 58 41 46 35 38 41Z" fill="#f8faef"/><path d="M7 75H114M19 84H103" stroke="#63845a" stroke-width="1.5"/><path d="M59 57C43 66 81 67 65 76" stroke="#729998" stroke-width="2"/></svg><span>EXPLORE / ${String(index + 1).padStart(2, "0")}</span></div>
  <div class="project-copy"><span class="category">${escapeHtml(project.category)}</span><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p><div class="tags">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div><p class="topic-list">${project.topics.map(escapeHtml).join(" · ")}</p></div>
  <span class="project-action">进入项目 <b aria-hidden="true">↗</b></span></a>`).join("\n");
const portal = (await readFile("portal/index.html", "utf8")).replace("{{PROJECT_COUNT}}", String(projects.length)).replace("{{PROJECT_CARDS}}", cards);
await writeFile("dist/index.html", portal);
await copyFile("portal/portal.css", "dist/portal.css");
console.log(`Portal built: ${projects.length} live project(s).`);

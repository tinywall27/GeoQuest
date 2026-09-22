# Landforms1 迁入说明

本目录迁入现有独立 Worker 项目 `geolandform-landforms1` 的单文件 `index.html`，保留原文件内容，访问路径为 `/GeoLandform/Landforms1/`。根目录「地理课堂」通过 `portal/projects.json` 提供入口；此项目不混入 GeoQuest 内部的主题 manifest。

页面为离线单文件：HTML、CSS 和 JavaScript 均内嵌，没有外部脚本、字体、图片、数据文件、网络接口或浏览器存储。构建时由 `scripts/prepare-projects.mjs` 复制到 Pages 输出目录，并生成按内联脚本 SHA-256 限定的专用 CSP 片段供 Pages 根 `_headers` 组合。

许可和再发布边界沿用源项目原有约定；本迁入说明不新增许可授权。

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const v1Topics = [
  ["earth-motion-lab", "如果地球不这样转"],
  ["contour-rescue", "等高线山地救援"],
  ["world-population-map", "世界人口住在哪里"],
  ["south-asia-monsoon", "季风迟到会怎样"],
  ["us-farm-belt", "为美国划农业带"],
  ["china-terrain-steps", "穿越中国三级阶梯"],
  ["lake-restoration", "洞庭湖如何重获呼吸"],
  ["china-farm-choice", "一块农田种什么"],
  ["yangtze-belt", "一条大河如何协同上中下游"],
  ["loess-soil-water", "一场暴雨带走多少黄土"],
] as const;

test("首页展示品牌、教材与六个产品入口", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /探索地球/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /七年级上册/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "地图实验室" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("主题地址可切换课堂模式并保留同一路径", async ({ page }) => {
  await page.goto("/topics/earth-motion-lab");
  await page.getByRole("button", { name: "课堂模式" }).click();

  await expect(page).toHaveURL(/\/topics\/earth-motion-lab\?mode=classroom$/);
  await expect(page.getByText("课堂展示")).toBeVisible();
  await expect(page.getByRole("button", { name: "全屏展示" })).toBeVisible();
  await expect(page.getByText("步骤 1 / 3")).toBeVisible();
  await expect(page.getByText(/先提出假设/)).toBeVisible();

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("heading", { name: "我的证据卡" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("region", { name: "主题学习路径" })).toBeVisible();
  await page.getByRole("button", { name: "显示结论" }).click();
  await expect(page.getByRole("region", { name: "主题引导与反思" })).toBeVisible();

  await page.getByRole("button", { name: "重置课堂" }).click();
  await expect(page.getByText("步骤 1 / 3")).toBeVisible();
  await expect(page.getByText(/先提出假设/)).toBeVisible();
});

test("主题共享框架通过自动可访问性检查", async ({ page }) => {
  await page.goto("/topics/earth-motion-lab");
  await expect(page.getByRole("slider", { name: /地轴倾角/ })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: /地轴倾角数值输入/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "主题学习路径" })).toContainText("探索路径");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("设置页只清除 GeoQuest 本机数据", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() => {
    localStorage.setItem("another-site:value", "keep");
    localStorage.setItem("geoquest:completion:test", "value");
  });
  await page.getByRole("button", { name: "一键清除" }).click();

  await expect(page.getByText(/已清除/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("another-site:value"))).toBe("keep");
  expect(await page.evaluate(() => localStorage.getItem("geoquest:completion:test"))).toBeNull();
});

test("十个 V1 主题在探索与课堂模式使用同一互动内容", async ({ page }) => {
  for (const [slug, title] of v1Topics) {
    await page.goto(`/topics/${slug}`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "我的证据卡" })).toBeVisible();

    await page.goto(`/topics/${slug}?mode=classroom`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByText("课堂展示")).toBeVisible();
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByRole("heading", { name: "我的证据卡" })).toBeVisible();
  }
});

test("主题核心互动断开外网后仍可操作且不设置 Cookie", async ({ page, context }) => {
  const thirdPartyRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") thirdPartyRequests.push(request.url());
  });

  await page.goto("/topics/earth-motion-lab");
  const tiltControl = page.getByRole("slider", { name: /地轴倾角/ });
  await expect(tiltControl).toBeVisible();
  await context.setOffline(true);
  await tiltControl.press("Home");
  await expect(page.getByText("12.0 h")).toBeVisible();

  expect(thirdPartyRequests).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

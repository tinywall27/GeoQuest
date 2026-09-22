import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("首页保留五个课堂实验并展示十个新增课段", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /少一些主题/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入地形实验/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入地球实验/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入水土实验/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入农业实验/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入人口实验/ })).toBeVisible();
  await expect(page.locator('.home-selected a')).toHaveCount(10);

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

test("主题核心互动断开外网后仍可操作且不设置 Cookie", async ({ page, context }) => {
  const thirdPartyRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") thirdPartyRequests.push(request.url());
  });

  await page.goto("/topics/earth-motion-lab");
  await page.getByRole("navigation", { name: "地球探究步骤" }).getByRole("button", { name: /比较一年/ }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "0° 对照实验", exact: true }).click();
  await expect(page.getByRole("img", { name: "北纬 40°理论昼长12.0小时，夜长12.0小时" })).toBeVisible();

  expect(thirdPartyRequests).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

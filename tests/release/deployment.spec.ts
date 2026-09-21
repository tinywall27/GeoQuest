/// <reference lib="dom" />
import { expect, test } from "@playwright/test";

const topics = [
  ["contour-rescue", "把等高线，读成一座山。"],
  ["earth-motion-lab", "地球与太阳"],
  ["loess-soil-water", "水土与流域"],
  ["south-asia-monsoon", "气候与农业"],
  ["world-population-map", "人口与区域"],
] as const;

test("project prefix, navigation, deep links and classroom interactions", async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  const external: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) failed.push(response.url()); });
  page.on("request", request => {
    if (request.url().startsWith("http") && new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url());
  });
  await page.goto("/geoquest/");
  await expect(page.locator(".home-feature")).toHaveCount(5);
  await page.locator(".home-feature").first().click();
  await expect(page).toHaveURL(/\/geoquest\/topics\/contour-rescue$/);
  for (const [slug, title] of topics) {
    const response = await page.goto(`/geoquest/topics/${slug}?mode=classroom`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.getByRole("link", { name: "退出课堂", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/geoquest/topics/${slug}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("/geoquest/topics/south-asia-monsoon?mode=classroom");
  await page.getByRole("navigation", { name: "农业探究步骤" }).getByRole("button", { name: /雨热对照/ }).click();
  await page.getByRole("button", { name: "晚到 20 天", exact: true }).click();
  await expect(page.locator(".farm-readings")).toContainText("20.0 mm");
  await page.getByRole("button", { name: "记录整季结果", exact: true }).click();
  await page.getByRole("navigation", { name: "农业探究步骤" }).getByRole("button", { name: /证据解释/ }).click();
  await expect(page.getByRole("table")).toContainText("20");
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test("host directory and unrelated paths are separate from GeoQuest", async ({ request }) => {
  expect((await request.get("/")).status()).toBe(200);
  const redirect = await request.get("/geoquest", { maxRedirects: 0 });
  expect([301, 308]).toContain(redirect.status());
  expect(redirect.headers().location).toMatch(/\/geoquest\/$/);
  expect((await request.get("/not-a-project/")).status()).toBe(404);
  const page = await request.get("/geoquest/topics/earth-motion-lab?mode=classroom");
  expect(page.headers()["content-security-policy"]).toContain("script-src 'self'");
});

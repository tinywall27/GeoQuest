/// <reference lib="dom" />
import { expect, test } from "@playwright/test";

test("standalone landform project loads under the unified Pages host", async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().startsWith("http") && new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url());
  });
  const response = await page.goto("/GeoLandform/Landforms1/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-security-policy"]).toContain("script-src 'sha256-");
  // A second app CSP would block the inline renderer even with a valid hash.
  expect(response?.headers()["content-security-policy"]).not.toContain("script-src 'self'");
  await expect(page.locator("#maxHeight")).toContainText(/\d/);
  await expect(page.locator("#terrainCanvas")).toBeVisible();
  await page.getByRole("button", { name: "2D 俯视", exact: true }).click();
  await expect(page.locator("#stage")).toHaveAttribute("data-view", "map");
  await expect(page.locator("#mapCanvas")).toBeVisible();
  await page.getByLabel("等高距", { exact: true }).fill("100");
  await expect(page.locator("#intervalOut")).toHaveText("100 m");
  await context.setOffline(true);
  await page.getByRole("button", { name: "山地", exact: true }).click();
  await expect(page.locator("#statusName")).toContainText("山地");
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator("#maxHeight")).toContainText(/\d/);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

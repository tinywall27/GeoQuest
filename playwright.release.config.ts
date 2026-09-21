import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/release",
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 2,
  use: { baseURL: process.env.RELEASE_URL ?? "https://geo.tinywall.cc", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});

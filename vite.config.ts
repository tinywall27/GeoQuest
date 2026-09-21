import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { rm } from "node:fs/promises";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH ?? "/",
  resolve: {
    alias: {
      "#topic-manifests": fileURLToPath(
        new URL(
          command === "build"
            ? "./src/generated/published-topic-manifests.ts"
            : "./src/generated/topic-manifests.ts",
          import.meta.url,
        ),
      ),
      "#topic-registry": fileURLToPath(
        new URL(
          command === "build"
            ? "./src/generated/published-topic-registry.tsx"
            : "./src/topics/registry.tsx",
          import.meta.url,
        ),
      ),
      "#topic-body-registry": fileURLToPath(
        new URL(
          command === "build"
            ? "./src/generated/published-topic-body-registry.tsx"
            : "./src/content/topicBodyRegistry.tsx",
          import.meta.url,
        ),
      ),
    },
  },
  plugins: [
    {
      name: "exclude-legacy-candidate-images",
      apply: "build",
      async closeBundle() {
        // Retain original candidate assets for local legacy demos; they are not V2 release inputs.
        await rm(fileURLToPath(new URL("./dist/assets/field-notebook", import.meta.url)), { recursive: true, force: true });
      },
    },
    { enforce: "pre", ...mdx() },
    react({ include: /\.(?:js|jsx|ts|tsx|mdx)$/ }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/unit/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
}));

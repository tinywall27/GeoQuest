import { describe, expect, it } from "vitest";
import { assertApprovedMapProvider } from "../../src/maps/MapProviderAdapter";

describe("地图提供商门禁", () => {
  it("拒绝未经审核的地图提供商", () => {
    expect(() => assertApprovedMapProvider({
      id: "pending-map",
      name: "待审核地图",
      attribution: [{ label: "来源待核" }],
      fallback: { kind: "static-image", path: "/maps/pending.webp", alt: "待审核地图" },
      reviewed: false,
    })).toThrow(/尚未通过发布审核/);
  });

  it("通过审核后仍要求可见署名", () => {
    expect(() => assertApprovedMapProvider({
      id: "missing-attribution",
      name: "缺少署名地图",
      attribution: [],
      fallback: { kind: "local-vector", path: "/maps/local.pmtiles", alt: "本地地图" },
      reviewed: true,
    })).toThrow(/缺少可见署名/);
  });
});

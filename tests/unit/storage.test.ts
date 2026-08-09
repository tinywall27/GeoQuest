import { describe, expect, it } from "vitest";
import {
  clearAllGeoQuestData,
  clearTopicProgress,
  defaultPreferences,
  loadPreferences,
  loadTopicCompletion,
  savePreferences,
  saveTopicCompletion,
} from "../../src/lib/storage";

describe("GeoQuest 本机存储", () => {
  it("只写入 geoquest: 命名空间", () => {
    savePreferences({ textScale: "large", reducedMotion: true });
    saveTopicCompletion("earth-motion-lab", ["observe", "compare", "observe"]);

    const keys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    );
    expect(keys.every((key) => key?.startsWith("geoquest:"))).toBe(true);
    expect(loadPreferences()).toEqual({ textScale: "large", reducedMotion: true });
    expect(loadTopicCompletion("earth-motion-lab")?.completedSteps).toEqual([
      "observe",
      "compare",
    ]);
  });

  it("可以只清除一个主题进度", () => {
    saveTopicCompletion("earth-motion-lab", ["observe"]);
    saveTopicCompletion("contour-rescue", ["route"]);
    clearTopicProgress("earth-motion-lab");

    expect(loadTopicCompletion("earth-motion-lab")).toBeUndefined();
    expect(loadTopicCompletion("contour-rescue")).toBeDefined();
  });

  it("一键清除不会删除其他网站数据", () => {
    window.localStorage.setItem("another-site:preference", "keep");
    savePreferences({ textScale: "large", reducedMotion: false });
    saveTopicCompletion("contour-rescue", ["route"]);

    expect(clearAllGeoQuestData()).toBe(3);
    expect(window.localStorage.getItem("another-site:preference")).toBe("keep");
    expect(loadPreferences()).toEqual(defaultPreferences);
  });
});

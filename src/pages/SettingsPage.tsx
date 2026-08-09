import { useState } from "react";
import { clearAllGeoQuestData } from "../lib/storage";
import { usePreferences } from "../lib/usePreferences";
import styles from "./Pages.module.css";

export function SettingsPage(): React.JSX.Element {
  const [preferences, setPreferences] = usePreferences();
  const [message, setMessage] = useState("");

  function clearData(): void {
    const count = clearAllGeoQuestData();
    setPreferences({ textScale: "default", reducedMotion: false });
    setMessage(`已清除 ${count} 项 GeoQuest 本机数据。`);
  }

  return (
    <div className={styles.narrowPage}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>本机设置</span>
        <h1>把探索调整成适合你的样子</h1>
        <p>偏好和匿名完成状态只保存在当前浏览器，不会上传。</p>
      </header>
      <section className={styles.settingsCard}>
        <div>
          <h2>阅读字号</h2>
          <p>放大站点正文与控件，课堂模式仍会额外优化关键文字。</p>
        </div>
        <div className={styles.optionGroup} role="group" aria-label="阅读字号">
          <button
            type="button"
            aria-pressed={preferences.textScale === "default"}
            onClick={() => setPreferences({ ...preferences, textScale: "default" })}
          >标准</button>
          <button
            type="button"
            aria-pressed={preferences.textScale === "large"}
            onClick={() => setPreferences({ ...preferences, textScale: "large" })}
          >大字号</button>
        </div>
      </section>
      <section className={styles.settingsCard}>
        <div>
          <h2>减少动态</h2>
          <p>关闭非必要转场与装饰动画，核心数据变化仍会即时呈现。</p>
        </div>
        <label className={styles.switchLabel}>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => setPreferences({ ...preferences, reducedMotion: event.target.checked })}
          />
          <span>{preferences.reducedMotion ? "已开启" : "未开启"}</span>
        </label>
      </section>
      <section className={`${styles.settingsCard} ${styles.dangerCard}`}>
        <div>
          <h2>清除本机数据</h2>
          <p>删除字号、减少动态和匿名完成状态，不影响其他网站数据。</p>
        </div>
        <button type="button" onClick={clearData}>一键清除</button>
      </section>
      <p className={styles.liveMessage} aria-live="polite">{message}</p>
    </div>
  );
}

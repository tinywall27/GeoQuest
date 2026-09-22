import { useMemo, useState } from "react";
import { TopicCard } from "../components/TopicCard";
import { prototypeLabels, v1TopicCatalog, volumeCatalog } from "../content/catalog";
import { competencyKeys, prototypeKeys } from "../domain/topic";
import styles from "./Pages.module.css";

export function TopicsPage(): React.JSX.Element {
  const [volume, setVolume] = useState("all");
  const [prototype, setPrototype] = useState("all");
  const [competency, setCompetency] = useState("all");

  const topics = useMemo(
    () => v1TopicCatalog.filter((topic) =>
      (volume === "all" || topic.volume === volume) &&
      (prototype === "all" || topic.prototype === prototype) &&
      (competency === "all" || topic.competencies.some((item) => item === competency))),
    [competency, prototype, volume],
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>精选互动主题</span>
        <h1>用问题组织探索</h1>
        <p>从读图、自然过程到区位选择，用示范、对照和独立检验完成一段地理学习。模型结论与真实教学效果分别核验。</p>
      </header>
      <section className={styles.filters} aria-label="筛选主题">
        <label>
          卷册
          <select value={volume} onChange={(event) => setVolume(event.target.value)}>
            <option value="all">全部卷册</option>
            {volumeCatalog.map((book) => <option key={book.code} value={book.code}>{book.label}</option>)}
          </select>
        </label>
        <label>
          互动原型
          <select value={prototype} onChange={(event) => setPrototype(event.target.value)}>
            <option value="all">全部原型</option>
            {prototypeKeys.map((key) => <option key={key} value={key}>{prototypeLabels[key]}</option>)}
          </select>
        </label>
        <label>
          核心素养
          <select value={competency} onChange={(event) => setCompetency(event.target.value)}>
            <option value="all">全部素养</option>
            {competencyKeys.map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </label>
        <span aria-live="polite">找到 {topics.length} 个主题</span>
      </section>
      {topics.length > 0 ? (
        <div className={styles.topicGrid}>
          {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>暂时没有匹配主题</h2>
          <p>试试减少一个筛选条件。</p>
        </div>
      )}
    </div>
  );
}

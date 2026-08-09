import { Link, useParams } from "react-router-dom";
import { TopicCard } from "../components/TopicCard";
import { getTopicsByVolume, volumeCatalog } from "../content/catalog";
import { volumeCodes, type VolumeCode } from "../domain/topic";
import styles from "./Pages.module.css";

function isVolumeCode(value: string | undefined): value is VolumeCode {
  return volumeCodes.some((code) => code === value);
}

export function VolumePage(): React.JSX.Element {
  const { volume } = useParams();
  if (!isVolumeCode(volume)) {
    return (
      <div className={styles.centeredPage}>
        <span className={styles.kickerDark}>未找到卷册</span>
        <h1>这个教材编号不在 GeoQuest 中</h1>
        <Link to="/textbooks">返回教材探索</Link>
      </div>
    );
  }

  const book = volumeCatalog.find((entry) => entry.code === volume);
  const topics = getTopicsByVolume(volume);
  if (!book) return <></>;

  return (
    <div className={styles.page}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>{book.code} · {book.grade}</span>
        <h1>{book.label}</h1>
        <p>{book.description}。当前公开目录展示 V1 主题，教材内部定位不会随页面发布。</p>
      </header>
      <div className={styles.topicGrid}>
        {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

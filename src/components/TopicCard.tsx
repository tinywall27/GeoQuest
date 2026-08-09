import { Link } from "react-router-dom";
import { prototypeLabels } from "../content/catalog";
import type { CatalogEntry } from "../domain/topic";
import styles from "./TopicCard.module.css";

interface TopicCardProps {
  topic: CatalogEntry;
}

export function TopicCard({ topic }: TopicCardProps): React.JSX.Element {
  const available = topic.status === "已发布" || import.meta.env.DEV;
  const body = (
    <>
      <div className={styles.meta}>
        <span>{topic.id}</span>
        <span>{prototypeLabels[topic.prototype]}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      <div className={styles.footer}>
        <span>{topic.volume} · {topic.chapter}</span>
        <span className={styles.status}>{available ? "开始探索" : topic.status}</span>
      </div>
    </>
  );

  return available ? (
    <Link to={`/topics/${topic.slug}`} className={styles.card}>
      {body}
    </Link>
  ) : (
    <article className={`${styles.card} ${styles.unavailable}`}>{body}</article>
  );
}

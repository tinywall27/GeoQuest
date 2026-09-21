import { Link } from "react-router-dom";
import {
  ArrowUpRightIcon,
  ChartLineUpIcon,
  CompassToolIcon,
  GlobeHemisphereWestIcon,
  ImagesIcon,
  MapTrifoldIcon,
  ScalesIcon,
  SignpostIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { prototypeLabels } from "../content/catalog";
import type { CatalogEntry } from "../domain/topic";
import styles from "./TopicCard.module.css";

interface TopicCardProps {
  topic: CatalogEntry;
}

const prototypeIcons = {
  simulator: GlobeHemisphereWestIcon,
  "map-explorer": MapTrifoldIcon,
  "story-map": SignpostIcon,
  "data-explorer": ChartLineUpIcon,
  "image-explorer": ImagesIcon,
  compare: ScalesIcon,
  "decision-lab": CompassToolIcon,
  "geo-challenge": TrophyIcon,
} as const;

export function TopicCard({ topic }: TopicCardProps): React.JSX.Element {
  const available = topic.status === "已发布" || import.meta.env.DEV;
  const PrototypeIcon = prototypeIcons[topic.prototype];
  const body = (
    <>
      <div className={styles.meta}>
        <span className={styles.topicId}>{topic.id}</span>
        <span><PrototypeIcon aria-hidden="true" weight="duotone" />{prototypeLabels[topic.prototype]}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      <div className={styles.footer}>
        <span>{topic.volume} · {topic.chapter}</span>
        <span className={styles.status}>{available ? <>开始探索 <ArrowUpRightIcon aria-hidden="true" /></> : topic.status}</span>
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

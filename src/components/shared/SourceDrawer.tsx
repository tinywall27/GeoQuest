import type { PublicSourceRef } from "../../domain/topic";
import styles from "./Shared.module.css";

interface SourceDrawerProps {
  sources: readonly PublicSourceRef[];
  limitations?: readonly string[];
}

export function SourceDrawer({ sources, limitations = [] }: SourceDrawerProps): React.JSX.Element {
  return (
    <details className={styles.sourceDrawer}>
      <summary>来源、版本与局限</summary>
      <div className={styles.drawerContent}>
        {sources.length === 0 ? (
          <p>此主题尚未登记可公开来源，因此不能进入发布状态。</p>
        ) : (
          <ol className={styles.sourceList}>
            {sources.map((source) => (
              <li key={source.id}>
                <strong>{source.title}</strong>
                <span>{source.attribution}</span>
                <span>
                  {source.kind === "simulation" ? "原创教学模拟" : source.kind} · 审核状态：
                  {source.review.status}
                </span>
                {source.kind !== "simulation" ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    查看原始来源
                  </a>
                ) : null}
                {source.kind === "map" && source.reviewNumber ? (
                  <span>审图号：{source.reviewNumber}</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {limitations.length > 0 ? (
          <div>
            <h3>使用边界</h3>
            <ul>
              {limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

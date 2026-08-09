import styles from "./Shared.module.css";

export interface EvidenceItem {
  label: string;
  value: string | number;
  unit?: string;
}

interface EvidencePanelProps {
  topicId: string;
  title?: string;
  items: readonly EvidenceItem[];
  note?: string;
}

function downloadEvidence(topicId: string, items: readonly EvidenceItem[]): void {
  const payload = {
    format: "geoquest-evidence-v1",
    topicId,
    exportedAt: new Date().toISOString(),
    evidence: items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${topicId.toLowerCase()}-evidence.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EvidencePanel({
  topicId,
  title = "我的证据卡",
  items,
  note,
}: EvidencePanelProps): React.JSX.Element {
  return (
    <section className={styles.panel} aria-labelledby={`${topicId}-evidence-title`}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>结构化结果 · 仅当前会话</span>
          <h2 id={`${topicId}-evidence-title`}>{title}</h2>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
            打印
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => downloadEvidence(topicId, items)}
            disabled={items.length === 0}
          >
            导出 JSON
          </button>
        </div>
      </div>
      {items.length > 0 ? (
        <dl className={styles.evidenceGrid}>
          {items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>
                {item.value}
                {item.unit ? <span> {item.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.empty}>完成互动步骤后，证据会在这里汇总。</p>
      )}
      {note ? <p className={styles.note}>{note}</p> : null}
    </section>
  );
}

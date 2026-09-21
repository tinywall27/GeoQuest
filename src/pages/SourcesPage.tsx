import styles from "./Pages.module.css";

const sourceKinds = [
  ["事实参考", "用于核对概念、机制与背景；记录原始网址和核验日期。"],
  ["数据快照", "记录版本、许可、时间与空间范围、加工步骤及 SHA-256。"],
  ["地图资产", "记录来源、版本、审图号、修改情况和发布门禁证据。"],
  ["媒体素材", "记录创作者、许可、是否改编及本地文件校验值。"],
  ["原创模拟", "记录模型方法、参数版本和不能用于现实预测的边界。"],
] as const;

export function SourcesPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>来源与方法</span>
        <h1>每一个结论，都能找到证据边界</h1>
        <p>GeoQuest 把事实参考、数据、地图、媒体和原创模拟分开登记，避免把教学情景误当作实测事实。</p>
      </header>
      <div className={styles.methodGrid}>
        {sourceKinds.map(([title, description], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <section className={styles.auditSection}>
        <div>
          <span className={styles.kicker}>发布门禁</span>
          <h2>AI 核对内容，程序校验一致性</h2>
          <p>每个主题保留一份与版本对应的 AI 审查记录，核对来源、模型、交互和显示结果；自动检查验证计算与文件一致性。</p>
        </div>
        <ol>
          <li>来源与许可清楚</li>
          <li>本地快照可重复</li>
          <li>地图表达逐项核对</li>
          <li>局限在页面可见</li>
        </ol>
      </section>
    </div>
  );
}

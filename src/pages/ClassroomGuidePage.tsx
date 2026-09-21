import { Link } from "react-router-dom";
import styles from "./Pages.module.css";

export function ClassroomGuidePage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>课堂使用</span>
        <h1>同一个主题，一键切换课堂展示</h1>
        <p>课堂模式不需要教师账号，只改变字号、控件密度和展示节奏，不改变事实、证据口径或答案逻辑。</p>
      </header>
      <ol className={styles.stepGrid}>
        <li><span>01</span><h2>选择主题</h2><p>先在常规探索模式确认主题、快照日期与来源。</p></li>
        <li><span>02</span><h2>切换课堂模式</h2><p>点击主题页上方“课堂展示”，地址会加入 <code>?mode=classroom</code>。</p></li>
        <li><span>03</span><h2>投屏或分享</h2><p>进入全屏投影；分享主题地址，可让学生打开同一实验。</p></li>
        <li><span>04</span><h2>围绕证据讨论</h2><p>8—20 分钟完成主流程，来源、局限与必要图例始终可见。</p></li>
      </ol>
      <section className={styles.callout}>
        <div>
          <h2>课堂前检查</h2>
          <p>建议提前打开主题并断网试用一次。GeoQuest 核心流程默认使用站内快照。</p>
        </div>
        <Link className={styles.primaryButton} to="/topics">选择主题</Link>
      </section>
      <section className={styles.twoColumnText}>
        <div><h2>课堂模式会改变</h2><ul><li>更大的正文和关键标题</li><li>更低的控件密度</li><li>全屏与课堂布局</li><li>适合逐步讲解的布局</li></ul></div>
        <div><h2>课堂模式不会改变</h2><ul><li>数据快照和计算逻辑</li><li>来源、审图号和风险提示</li><li>学生看到的核心问题</li><li>无账号、无追踪的隐私边界</li></ul></div>
      </section>
    </div>
  );
}

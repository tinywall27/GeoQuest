import { Link } from "react-router-dom";
import { getTopicsByVolume, volumeCatalog } from "../content/catalog";
import styles from "./Pages.module.css";

export function TextbooksPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.pageHero}>
        <span className={styles.kickerDark}>教材探索</span>
        <h1>沿着章节，走向真实世界</h1>
        <p>主题不是扫描教材，而是把适合观察、比较、模拟和决策的问题重新设计成互动探索。</p>
      </header>
      <div className={styles.bookShelf}>
        {volumeCatalog.map((book, index) => {
          const count = getTopicsByVolume(book.code).length;
          return (
            <Link key={book.code} to={`/textbooks/${book.code}`} className={styles.shelfBook}>
              <div className={styles.bookSpine} aria-hidden="true">GQ / 0{index + 1}</div>
              <div>
                <small>{book.code}</small>
                <h2>{book.label}</h2>
                <p>{book.description}</p>
                <strong>{count} 个 V1 主题</strong>
              </div>
            </Link>
          );
        })}
      </div>
      <aside className={styles.infoBand}>
        <strong>关于教材映射</strong>
        <p>教材文件名、页码与原图核验记录仅用于内部教学审核，不会进入公开网站。</p>
      </aside>
    </div>
  );
}

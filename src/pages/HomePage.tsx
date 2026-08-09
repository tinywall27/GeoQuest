import { Link } from "react-router-dom";
import { productChannels, v1TopicCatalog, volumeCatalog } from "../content/catalog";
import { TopicCard } from "../components/TopicCard";
import styles from "./Pages.module.css";

export function HomePage(): React.JSX.Element {
  const weeklyTopic = v1TopicCatalog[0];

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.kicker}>GEOQUEST · 地理智探</span>
          <h1>探索地球，<br />而不只是阅读地理</h1>
          <p>
            从教材里的一个问题出发，操纵变量、比较地图、阅读证据，
            亲手解释真实世界为什么如此运转。
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} to="/topics">开始一次探索</Link>
            <Link className={styles.ghostButton} to="/classroom">用于课堂展示</Link>
          </div>
          <ul className={styles.trustRow} aria-label="平台特性">
            <li>无账号</li>
            <li>无追踪</li>
            <li>课堂断网可用</li>
          </ul>
        </div>
        <div className={styles.planetVisual} aria-hidden="true">
          <div className={styles.orbitOuter}><span /></div>
          <div className={styles.orbitInner}><span /></div>
          <div className={styles.planet}>
            <i className={styles.landOne} />
            <i className={styles.landTwo} />
            <i className={styles.landThree} />
          </div>
          <div className={styles.coordinate}>30°N · 110°E</div>
        </div>
      </section>

      <section className={styles.pageSection} aria-labelledby="books-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kickerDark}>从熟悉的章节出发</span>
            <h2 id="books-title">选择你的地理书</h2>
          </div>
          <Link to="/textbooks">查看全部卷册 →</Link>
        </div>
        <div className={styles.bookGrid}>
          {volumeCatalog.map((book, index) => (
            <Link key={book.code} to={`/textbooks/${book.code}`} className={styles.bookCard}>
              <span className={styles.bookIndex}>0{index + 1}</span>
              <small>{book.grade}</small>
              <h3>{book.label}</h3>
              <p>{book.description}</p>
              <span className={styles.cardArrow} aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${styles.pageSection} ${styles.darkSection}`} aria-labelledby="channels-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>六条探索路径</span>
            <h2 id="channels-title">今天想怎样认识地球？</h2>
          </div>
        </div>
        <div className={styles.channelGrid}>
          {productChannels.map((channel) => (
            <Link key={channel.key} to={channel.path} className={styles.channelCard}>
              <span>{channel.index}</span>
              <small>{channel.eyebrow}</small>
              <h3>{channel.title}</h3>
              <p>{channel.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {weeklyTopic ? (
        <section className={styles.pageSection} aria-labelledby="weekly-title">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.kickerDark}>本周探索</span>
              <h2 id="weekly-title">从一个“如果”开始</h2>
            </div>
            <p>V1 共 10 个主题，分五轮完成开发与审核。</p>
          </div>
          <div className={styles.featureGrid}>
            <article className={styles.weeklyCard}>
              <span>{weeklyTopic.id} · {weeklyTopic.releaseBatch}</span>
              <h3>{weeklyTopic.title}</h3>
              <p>{weeklyTopic.coreQuestion}</p>
              <Link to={`/topics/${weeklyTopic.slug}`}>进入实验 →</Link>
            </article>
            <div>
              <h3>热门实验</h3>
              <div className={styles.compactTopicGrid}>
                {v1TopicCatalog.slice(1, 4).map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

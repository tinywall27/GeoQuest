import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useExperienceMode } from "./ExperienceMode";
import styles from "./AppShell.module.css";

const primaryNav = [
  { to: "/textbooks", label: "教材探索" },
  { to: "/topics", label: "主题" },
  { to: "/labs/maps", label: "实验室" },
  { to: "/challenges", label: "挑战" },
];

export function AppShell(): React.JSX.Element {
  const location = useLocation();
  const { isClassroom } = useExperienceMode();
  const isClassroomTopic = isClassroom && location.pathname.startsWith("/topics/");

  return (
    <div className={isClassroomTopic ? styles.classroomShell : styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        跳到主要内容
      </a>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand ?? ""} aria-label="GeoQuest 地理智探首页">
          <span className={styles.brandMark} aria-hidden="true">GQ</span>
          <span>
            <strong>GeoQuest</strong>
            <small>地理智探</small>
          </span>
        </NavLink>
        {isClassroomTopic ? (
          <span className={styles.classroomLabel}>课堂展示</span>
        ) : (
          <nav aria-label="主导航" className={styles.nav}>
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? styles.activeNav : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        {!isClassroomTopic ? (
          <NavLink to="/classroom" className={styles.classroomLink ?? ""}>
            课堂使用
          </NavLink>
        ) : null}
      </header>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      {!isClassroomTopic ? (
        <footer className={styles.footer}>
          <div>
            <strong>GeoQuest · 地理智探</strong>
            <p>从教材出发，探索真实世界。</p>
          </div>
          <nav aria-label="页脚导航">
            <NavLink to="/sources">来源与方法</NavLink>
            <NavLink to="/settings">本机设置</NavLink>
            <a href="https://github.com/tinywall27/GeoQuest">GitHub</a>
          </nav>
          <p className={styles.footerNote}>无账号 · 无追踪 · 核心内容静态优先</p>
        </footer>
      ) : null}
    </div>
  );
}

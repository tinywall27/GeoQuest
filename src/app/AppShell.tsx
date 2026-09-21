import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChalkboardTeacherIcon,
  CompassRoseIcon,
  MapTrifoldIcon,
} from "@phosphor-icons/react";
import { useExperienceMode } from "./ExperienceMode";
import styles from "./AppShell.module.css";

const primaryNav = [
  { to: "/topics", label: "探索主题", Icon: MapTrifoldIcon },
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
          <span className={styles.brandMark} aria-hidden="true"><CompassRoseIcon weight="fill" /></span>
          <span>
            <strong>GeoQuest</strong>
            <small>地理智探 · 互动实验</small>
          </span>
        </NavLink>
        {isClassroomTopic ? (
          <span className={styles.classroomLabel}>课堂展示</span>
        ) : (
          <nav aria-label="主导航" className={styles.nav}>
            {primaryNav.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? styles.activeNav : undefined)}
              >
                <Icon aria-hidden="true" weight="duotone" />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {!isClassroomTopic ? (
          <NavLink to="/classroom" className={styles.classroomLink ?? ""}>
            <ChalkboardTeacherIcon aria-hidden="true" weight="duotone" />课堂使用
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

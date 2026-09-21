import { Link } from "react-router-dom";
import { CompassIcon } from "@phosphor-icons/react";
import styles from "./Pages.module.css";

export function NotFoundPage(): React.JSX.Element {
  return (
    <div className={styles.notFound}>
      <span>404 · MAP EDGE</span>
      <CompassIcon className={styles.notFoundCompass} aria-hidden="true" weight="duotone" />
      <h1>地图边缘之外，暂时没有这条路线</h1>
      <p>地址可能改变了，或主题仍在内部审核。</p>
      <Link className={styles.primaryButton} to="/">回到首页</Link>
    </div>
  );
}

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useExperienceMode } from "../../app/ExperienceMode";
import styles from "./Shared.module.css";

export type ClassroomStep = 1 | 2 | 3;

interface ModeToolbarProps {
  classroomStep: ClassroomStep;
  conclusionsVisible: boolean;
  onClassroomStepChange: (step: ClassroomStep) => void;
  onToggleConclusions: () => void;
  onReset: () => void;
}

export function ModeToolbar({
  classroomStep,
  conclusionsVisible,
  onClassroomStepChange,
  onToggleConclusions,
  onReset,
}: ModeToolbarProps): React.JSX.Element {
  const { mode, setMode, isClassroom } = useExperienceMode();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function enterFullscreen(): Promise<void> {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }

  return (
    <div className={styles.modeToolbar} aria-label="主题显示模式">
      <div className={styles.segmented}>
        <button
          type="button"
          aria-pressed={mode === "exploration"}
          onClick={() => setMode("exploration")}
        >
          探索模式
        </button>
        <button
          type="button"
          aria-pressed={mode === "classroom"}
          onClick={() => setMode("classroom")}
        >
          课堂模式
        </button>
      </div>
      {isClassroom ? (
        <div className={styles.classroomActions}>
          <div className={styles.stepControls} aria-label="课堂展示步骤">
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={classroomStep === 1}
              onClick={() => onClassroomStepChange((classroomStep - 1) as ClassroomStep)}
            >
              上一步
            </button>
            <output aria-live="polite">步骤 {classroomStep} / 3</output>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={classroomStep === 3}
              onClick={() => onClassroomStepChange((classroomStep + 1) as ClassroomStep)}
            >
              下一步
            </button>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            aria-pressed={conclusionsVisible}
            onClick={onToggleConclusions}
          >
            {conclusionsVisible ? "隐藏结论" : "显示结论"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onReset}
          >
            重置课堂
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => { void enterFullscreen(); }}
          >
            全屏展示
          </button>
          <details className={styles.qrPopover}>
            <summary>课堂二维码</summary>
            <div>
              <QRCodeSVG value={currentUrl} size={152} title="当前主题课堂地址二维码" />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => { void copyLink(); }}
              >
                {copied ? "已复制" : "复制地址"}
              </button>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

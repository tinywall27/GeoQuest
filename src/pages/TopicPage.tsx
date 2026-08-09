import { Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useExperienceMode } from "../app/ExperienceMode";
import {
  ModeToolbar,
  type ClassroomStep,
} from "../components/shared/ModeToolbar";
import { SourceDrawer } from "../components/shared/SourceDrawer";
import { getCatalogEntry, prototypeLabels } from "../content/catalog";
import { clearTopicProgress } from "../lib/storage";
import { getPublicTopicManifest } from "#topic-manifests";
import { getTopicInteractive } from "#topic-registry";
import { getTopicBody } from "#topic-body-registry";
import styles from "./Pages.module.css";

export function TopicPage(): React.JSX.Element {
  const { slug = "" } = useParams();
  const topic = getCatalogEntry(slug);
  const manifest = getPublicTopicManifest(slug);
  const Interactive = getTopicInteractive(slug);
  const TopicBody = getTopicBody(slug);
  const { isClassroom } = useExperienceMode();
  const [classroomStep, setClassroomStep] = useState<ClassroomStep>(1);
  const [conclusionsVisible, setConclusionsVisible] = useState(false);
  const [interactionVersion, setInteractionVersion] = useState(0);

  if (!topic) {
    return (
      <div className={styles.centeredPage}>
        <span className={styles.kickerDark}>主题不存在</span>
        <h1>这条探索路线还没有建立</h1>
        <Link to="/topics">返回主题目录</Link>
      </div>
    );
  }

  const available = topic.status === "已发布" || import.meta.env.DEV;
  if (!available) {
    return (
      <div className={styles.centeredPage}>
        <span className={styles.kickerDark}>{topic.id} · {topic.releaseBatch}</span>
        <h1>{topic.title}</h1>
        <p>这个主题正在完成教学、数据、地图、版权与技术审核，暂未公开。</p>
        <Link to="/topics">查看其他主题</Link>
      </div>
    );
  }

  const showInteraction = !isClassroom || classroomStep >= 2;
  const showSynthesis = !isClassroom || classroomStep >= 3;
  const topicSlug = topic.slug;

  function resetClassroom(): void {
    clearTopicProgress(topicSlug);
    setInteractionVersion((current) => current + 1);
    setClassroomStep(1);
    setConclusionsVisible(false);
  }

  return (
    <article className={`${styles.topicPage} ${isClassroom ? styles.classroomTopic : ""}`}>
      <header className={styles.topicHeader}>
        <div>
          <span className={styles.kickerDark}>
            {topic.id} · {prototypeLabels[topic.prototype]} · {topic.volume}
          </span>
          <h1>{topic.title}</h1>
          <p>{topic.summary}</p>
        </div>
        <dl className={styles.topicMeta}>
          <div><dt>课堂</dt><dd>{topic.classroomMinutes} 分钟</dd></div>
          <div><dt>探索</dt><dd>{topic.explorationMinutes} 分钟</dd></div>
          <div><dt>状态</dt><dd>{topic.status}</dd></div>
        </dl>
      </header>

      <ModeToolbar
        classroomStep={classroomStep}
        conclusionsVisible={conclusionsVisible}
        onClassroomStepChange={setClassroomStep}
        onToggleConclusions={() => setConclusionsVisible((current) => !current)}
        onReset={resetClassroom}
      />

      <section className={styles.questionCard} aria-labelledby="core-question">
        <span>核心问题</span>
        <h2 id="core-question">{topic.coreQuestion}</h2>
      </section>

      {showInteraction ? (
        <section className={styles.interactiveFrame} aria-label={`${topic.title}互动区`}>
          {Interactive ? (
            <Suspense fallback={<div className={styles.loading}>正在准备互动实验……</div>}>
              <Interactive key={interactionVersion} />
            </Suspense>
          ) : (
            <div className={styles.emptyState}>
              <h2>互动组件正在接入</h2>
              <p>内容目录已经建立，但主操作对象还没有完成。</p>
            </div>
          )}
        </section>
      ) : (
        <p className={styles.classroomPrompt}>先提出假设；点击“下一步”再展示互动实验。</p>
      )}

      {showSynthesis && TopicBody ? (
        <section className={styles.topicBody} aria-label="主题学习路径">
          <Suspense fallback={<p>正在准备主题说明……</p>}>
            <TopicBody />
          </Suspense>
        </section>
      ) : null}

      {showSynthesis ? <aside className={styles.topicFootnote}>
        <div>
          <strong>结构化证据，不保存自由文本</strong>
          <p>页面只允许在当前会话形成证据卡；匿名完成状态可保存在本机。</p>
        </div>
        <button type="button" onClick={() => clearTopicProgress(topic.slug)}>
          清除本主题进度
        </button>
      </aside> : null}

      {showSynthesis && (!isClassroom || conclusionsVisible) && manifest ? (
        <section className={styles.methodGrid} aria-label="主题引导与反思">
          <article>
            <span>探索提示</span>
            <h2>先观察，再解释</h2>
            <ul>{manifest.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul>
          </article>
          <article>
            <span>解释反思</span>
            <h2>{manifest.reflectionPrompt}</h2>
            <p>{manifest.evidenceOutput.description}</p>
          </article>
        </section>
      ) : null}

      {showSynthesis && manifest ? (
        <SourceDrawer
          sources={manifest.sources}
          limitations={manifest.sources.flatMap((source) =>
            source.kind === "simulation"
              ? source.limitations
              : source.review.status === "approved"
                ? []
                : [`${source.title}尚未完成人工审核，不能作为已发布资产。`],
          )}
        />
      ) : null}
    </article>
  );
}

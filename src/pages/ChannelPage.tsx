import { TopicCard } from "../components/TopicCard";
import { getTopicsByChannel, productChannels } from "../content/catalog";
import type { ProductChannel } from "../domain/topic";
import styles from "./Pages.module.css";

interface ChannelPageProps {
  channel: ProductChannel;
}

export function ChannelPage({ channel }: ChannelPageProps): React.JSX.Element {
  const details = productChannels.find((entry) => entry.key === channel);
  const topics = getTopicsByChannel(channel);
  if (!details) return <></>;

  return (
    <div className={styles.page}>
      <header className={`${styles.pageHero} ${styles.channelHero}`}>
        <span className={styles.channelNumber}>{details.index}</span>
        <div>
          <span className={styles.kickerDark}>{details.eyebrow}</span>
          <h1>{details.title}</h1>
          <p>{details.description}</p>
        </div>
      </header>
      <div className={styles.topicGrid}>
        {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

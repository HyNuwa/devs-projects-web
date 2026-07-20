import { ThreadCard } from './ThreadCard';
import styles from './ThreadList.module.css';

interface Thread {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  votes: number;
  replies: number;
  views: number;
  tags: string[];
  isPinned?: boolean;
  isResolved?: boolean;
}

interface ThreadListProps {
  categorySlug: string;
  threads: Thread[];
}

export const ThreadList = ({ categorySlug, threads }: ThreadListProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {threads.map((thread) => (
          <ThreadCard key={thread.id} categorySlug={categorySlug} {...thread} />
        ))}
      </div>

      {/* Simple Pagination Mock */}
      <div className={styles.pagination}>
        <button className={styles.pageBtn} disabled>
          Anterior
        </button>
        <div className={styles.pages}>
          <button className={`${styles.pageNumber} ${styles.active}`}>1</button>
          <button className={styles.pageNumber}>2</button>
          <button className={styles.pageNumber}>3</button>
          <span className={styles.ellipsis}>...</span>
          <button className={styles.pageNumber}>10</button>
        </div>
        <button className={styles.pageBtn}>Siguiente</button>
      </div>
    </div>
  );
};

import Link from 'next/link';
import { MessageSquare, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import styles from './ThreadCard.module.css';

interface ThreadCardProps {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  votes: number;
  replies: number;
  views: number;
  tags: string[];
  categorySlug: string;
  isPinned?: boolean;
  isResolved?: boolean;
}

export const ThreadCard = ({
  id,
  title,
  author,
  authorAvatar,
  createdAt,
  votes,
  replies,
  views,
  tags,
  categorySlug,
  isPinned,
  isResolved,
}: ThreadCardProps) => {
  return (
    <div className={`${styles.card} ${isPinned ? styles.pinned : ''}`}>
      <div className={styles.voteColumn}>
        <button className={styles.voteBtn} aria-label="Upvote">
          <ArrowUp size={20} />
        </button>
        <span className={styles.voteCount}>{votes}</span>
        <button className={styles.voteBtn} aria-label="Downvote">
          <ArrowDown size={20} />
        </button>
      </div>

      <div className={styles.contentColumn}>
        <div className={styles.header}>
          {isPinned && <span className={styles.badgePinned}>📌 Fijo</span>}
          {isResolved && <span className={styles.badgeResolved}>✅ Resuelto</span>}
          <Link href={`/foro/${categorySlug}/${id}`} className={styles.titleLink}>
            <h3 className={styles.title}>{title}</h3>
          </Link>
        </div>

        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.authorInfo}>
            <div className={styles.avatar}>
              {authorAvatar ? (
                <img src={authorAvatar} alt={author} />
              ) : (
                <span>{author.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className={styles.authorName}>{author}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.time}>{createdAt}</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <MessageSquare size={16} />
              <span>{replies}</span>
            </div>
            <div className={styles.stat}>
              <Eye size={16} />
              <span>{views}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

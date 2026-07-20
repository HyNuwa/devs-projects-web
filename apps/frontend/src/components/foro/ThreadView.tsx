import { ArrowUp, ArrowDown, MessageSquare, Share2, Flag, CheckCircle } from 'lucide-react';
import styles from './ThreadView.module.css';

interface Reply {
  id: string;
  author: string;
  authorAvatar?: string;
  authorRole?: string;
  createdAt: string;
  content: string;
  votes: number;
  isAcceptedAnswer?: boolean;
}

interface Thread {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  authorRole?: string;
  createdAt: string;
  content: string;
  votes: number;
  tags: string[];
  isResolved?: boolean;
  replies: Reply[];
}

interface ThreadViewProps {
  thread: Thread;
}

export const ThreadView = ({ thread }: ThreadViewProps) => {
  return (
    <div className={styles.container}>
      {/* Main Post */}
      <div className={styles.mainPost}>
        <div className={styles.voteColumn}>
          <button className={styles.voteBtn} aria-label="Upvote">
            <ArrowUp size={24} />
          </button>
          <span className={styles.voteCount}>{thread.votes}</span>
          <button className={styles.voteBtn} aria-label="Downvote">
            <ArrowDown size={24} />
          </button>
        </div>

        <div className={styles.contentColumn}>
          <div className={styles.header}>
            <div className={styles.authorInfo}>
              <div className={styles.avatar}>
                {thread.authorAvatar ? (
                  <img src={thread.authorAvatar} alt={thread.author} />
                ) : (
                  <span>{thread.author.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.authorMeta}>
                <span className={styles.authorName}>{thread.author}</span>
                {thread.authorRole && (
                  <span className={styles.authorRole}>{thread.authorRole}</span>
                )}
              </div>
              <span className={styles.dot}>•</span>
              <span className={styles.time}>{thread.createdAt}</span>
            </div>
          </div>

          <h1 className={styles.title}>
            {thread.isResolved && <span className={styles.badgeResolved}>✅ Resuelto</span>}
            {thread.title}
          </h1>

          <div className={styles.body} dangerouslySetInnerHTML={{ __html: thread.content }} />

          <div className={styles.tags}>
            {thread.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className={styles.actions}>
            <button className={styles.actionBtn}>
              <MessageSquare size={16} />
              <span>Responder</span>
            </button>
            <button className={styles.actionBtn}>
              <Share2 size={16} />
              <span>Compartir</span>
            </button>
            <button className={styles.actionBtn}>
              <Flag size={16} />
              <span>Reportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className={styles.repliesSection}>
        <h3 className={styles.repliesTitle}>{thread.replies.length} Respuestas</h3>

        <div className={styles.repliesList}>
          {thread.replies.map((reply) => (
            <div
              key={reply.id}
              className={`${styles.replyCard} ${reply.isAcceptedAnswer ? styles.acceptedReply : ''}`}
            >
              <div className={styles.voteColumn}>
                <button className={styles.voteBtn} aria-label="Upvote">
                  <ArrowUp size={20} />
                </button>
                <span className={styles.voteCount}>{reply.votes}</span>
                <button className={styles.voteBtn} aria-label="Downvote">
                  <ArrowDown size={20} />
                </button>
                {reply.isAcceptedAnswer && (
                  <div className={styles.acceptedIcon} title="Respuesta aceptada">
                    <CheckCircle size={24} />
                  </div>
                )}
              </div>

              <div className={styles.contentColumn}>
                <div className={styles.header}>
                  <div className={styles.authorInfo}>
                    <div className={styles.avatarSmall}>
                      {reply.authorAvatar ? (
                        <img src={reply.authorAvatar} alt={reply.author} />
                      ) : (
                        <span>{reply.author.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={styles.authorMeta}>
                      <span className={styles.authorName}>{reply.author}</span>
                      {reply.authorRole && (
                        <span className={styles.authorRole}>{reply.authorRole}</span>
                      )}
                    </div>
                    <span className={styles.dot}>•</span>
                    <span className={styles.time}>{reply.createdAt}</span>
                  </div>
                </div>

                <div className={styles.body} dangerouslySetInnerHTML={{ __html: reply.content }} />

                <div className={styles.actions}>
                  <button className={styles.actionBtn}>
                    <MessageSquare size={14} />
                    <span>Responder</span>
                  </button>
                  <button className={styles.actionBtn}>
                    <Flag size={14} />
                    <span>Reportar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

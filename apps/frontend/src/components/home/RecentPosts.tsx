import Link from 'next/link';
import { MessageSquare, FileText, BookOpen, ChevronRight } from 'lucide-react';
import styles from './RecentPosts.module.css';

const posts = [
  {
    id: '1',
    type: 'Pregunta',
    title: '¿Alguien tiene apuntes de Estructuras de Datos?',
    author: 'PixelMage',
    time: 'Hace 2 horas',
    stats: '5 respuestas',
    category: 'Programación',
    icon: <MessageSquare size={20} />,
    color: 'blue',
  },
  {
    id: '2',
    type: 'Material',
    title: 'Apuntes completos de Cálculo I',
    author: 'CodeKnight',
    time: 'Hace 4 horas',
    stats: '12 descargas',
    category: 'Matemáticas',
    icon: <FileText size={20} />,
    color: 'green',
  },
  {
    id: '3',
    type: 'Guía',
    title: 'Guía definitiva para sobrevivir al primer semestre',
    author: 'LoreMaster',
    time: 'Hace 6 horas',
    stats: '8 respuestas',
    category: 'Consejos',
    icon: <BookOpen size={20} />,
    color: 'purple',
  },
];

export const RecentPosts = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <ChevronRight className={styles.titleIcon} size={20} />
          <h2 className={styles.title}>PUBLICACIONES RECIENTES</h2>
          <span className={styles.sparkle}>✨</span>
        </div>
        <Link href="/foro" className={styles.viewAll}>
          Ver todas
        </Link>
      </div>

      <div className={styles.postsList}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            <div className={`${styles.iconWrapper} ${styles[post.color]}`}>{post.icon}</div>

            <div className={styles.postContent}>
              <div className={styles.postHeader}>
                <span className={`${styles.postType} ${styles[`text-${post.color}`]}`}>
                  {post.type}
                </span>
                <h3 className={styles.postTitle}>{post.title}</h3>
              </div>

              <div className={styles.postMeta}>
                <span>
                  por <span className={styles.author}>{post.author}</span>
                </span>
                <span className={styles.dot}>•</span>
                <span>{post.time}</span>
                <span className={styles.dot}>•</span>
                <span>{post.stats}</span>
              </div>
            </div>

            <div className={styles.categoryTag}>{post.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

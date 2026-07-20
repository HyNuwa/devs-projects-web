import Link from 'next/link';
import { MessageSquare, Code, BookOpen, Coffee, Terminal, Users } from 'lucide-react';
import styles from './CategoryList.module.css';

const categories = [
  {
    id: '1',
    name: 'Programación General',
    description: 'Discusiones sobre lenguajes, algoritmos y buenas prácticas.',
    icon: <Code size={24} />,
    threadCount: 156,
    postCount: 842,
    lastPost: 'Hace 5 min',
    color: 'blue',
    slug: 'programacion-general',
  },
  {
    id: '2',
    name: 'Dudas Académicas',
    description: 'Preguntas sobre materias, exámenes y trabajos prácticos.',
    icon: <BookOpen size={24} />,
    threadCount: 342,
    postCount: 1205,
    lastPost: 'Hace 12 min',
    color: 'green',
    slug: 'dudas-academicas',
  },
  {
    id: '3',
    name: 'Proyectos y Colaboración',
    description: 'Encuentra equipo para tus proyectos o comparte tus ideas.',
    icon: <Users size={24} />,
    threadCount: 89,
    postCount: 430,
    lastPost: 'Hace 1 hora',
    color: 'purple',
    slug: 'proyectos',
  },
  {
    id: '4',
    name: 'Herramientas y Setup',
    description: 'IDEs, SOs, configuraciones y herramientas útiles.',
    icon: <Terminal size={24} />,
    threadCount: 124,
    postCount: 560,
    lastPost: 'Hace 3 horas',
    color: 'orange',
    slug: 'herramientas',
  },
  {
    id: '5',
    name: 'Off-Topic / Cafetería',
    description: 'Para hablar de cualquier cosa no relacionada con la carrera.',
    icon: <Coffee size={24} />,
    threadCount: 567,
    postCount: 3420,
    lastPost: 'Hace 1 min',
    color: 'red',
    slug: 'off-topic',
  },
];

export const CategoryList = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Categorías del Foro</h2>
        <p className={styles.subtitle}>
          Explora los diferentes temas de discusión de la comunidad.
        </p>
      </div>

      <div className={styles.list}>
        {categories.map((category) => (
          <Link href={`/foro/${category.slug}`} key={category.id} className={styles.card}>
            <div className={`${styles.iconWrapper} ${styles[category.color]}`}>{category.icon}</div>

            <div className={styles.content}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <p className={styles.categoryDesc}>{category.description}</p>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{category.threadCount}</span>
                <span className={styles.statLabel}>Hilos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{category.postCount}</span>
                <span className={styles.statLabel}>Mensajes</span>
              </div>
            </div>

            <div className={styles.lastPost}>
              <MessageSquare size={14} className={styles.lastPostIcon} />
              <span>Último: {category.lastPost}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

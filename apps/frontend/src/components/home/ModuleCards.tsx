import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './ModuleCards.module.css';

const modules = [
  {
    id: 'materias',
    title: 'MATERIAS',
    description:
      'Explorá el plan de estudio, reseñas de cursada y experiencias de final por materia.',
    icon: '/assets/cards/plan_estudio.png',
    href: '/materias',
  },
  {
    id: 'apuntes',
    title: 'APUNTES & MATERIAL',
    description: 'Comparte apuntes, libros, presentaciones y más recursos útiles.',
    icon: '/assets/cards/apuntes_material.png',
    href: '/materiales',
  },
  {
    id: 'preguntas',
    title: 'PREGUNTAS & DUDAS',
    description: 'Resuelve tus dudas y ayuda a otros miembros de la comunidad.',
    icon: '/assets/cards/preguntas_dudas.png',
    href: '/foro',
  },
  {
    id: 'profesores',
    title: 'PUNTÚA A TU PROFESOR',
    description: 'Conocé qué profesores dictan cada materia y compartí tu experiencia.',
    icon: '/assets/cards/puntua.png',
    href: '/profesores',
  },
  {
    id: 'ranking',
    title: 'RANKING',
    description: 'Sumá puntos por tus aportes y subí de nivel en la comunidad.',
    icon: '/assets/cards/guia_cursos.png',
    href: '/ranking',
  },
];

export const ModuleCards = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {modules.map((mod) => (
            <Link href={mod.href} key={mod.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Image
                  src={mod.icon}
                  alt={mod.title}
                  width={96}
                  height={96}
                  className={styles.iconImage}
                />
              </div>
              <h3 className={styles.title}>{mod.title}</h3>
              <p className={styles.description}>{mod.description}</p>
              <div className={styles.arrow}>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

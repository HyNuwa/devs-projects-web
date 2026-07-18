import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './ModuleCards.module.css';

const modules = [
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
    id: 'guias',
    title: 'GUÍAS & CURSOS',
    description: 'Encuentra guías de estudio, cursos y rutas de aprendizaje completas.',
    icon: '/assets/cards/guia_cursos.png',
    href: '/cursos',
  },
  {
    id: 'plan',
    title: 'PLAN DE ESTUDIO',
    description: 'Explora planes de estudio por carrera y organiza tu camino académico.',
    icon: '/assets/cards/plan_estudio.png',
    href: '/plan-estudio',
  },
  {
    id: 'herramientas',
    title: 'HERRAMIENTAS',
    description: 'Descubre herramientas recomendadas por la comunidad académica.',
    icon: '/assets/cards/herramientas.png',
    href: '/herramientas',
  },
  {
    id: 'profesores',
    title: 'PUNTÚA A TU PROFESOR',
    description: 'Evalúa a tus profesores y ayuda a otros con tu experiencia.',
    icon: '/assets/cards/puntua.png',
    href: '/profesores',
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
                  width={64}
                  height={64}
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

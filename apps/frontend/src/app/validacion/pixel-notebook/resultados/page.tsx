import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { PrototypeSearch } from '@/components/validation/pixel-notebook/PrototypeSearch';
import { ResourceRow } from '@/components/validation/pixel-notebook/ResourceRow';
import { validationResources } from '@/components/validation/pixel-notebook/data';
import styles from '@/components/validation/pixel-notebook/PrototypeShell.module.css';

export default function PixelNotebookValidationResultsPage() {
  return (
    <div className={styles.resultsPage}>
      <header className={styles.resultsHeader}>
        <div>
          <p className={styles.eyebrow}>Resultados sintéticos</p>
          <h1>Encontrá el recurso que te sirve</h1>
          <p>Compará contexto, revisión académica y utilidad antes de abrirlo.</p>
        </div>
        <PrototypeSearch initialQuery="algoritmos" compact />
      </header>

      <section className={styles.subjectMatch} aria-labelledby="subject-match-title">
        <div className={styles.subjectMark} aria-hidden="true">
          AYED
        </div>
        <div>
          <p className={styles.sectionKicker}>Coincidencia en materias</p>
          <h2 id="subject-match-title">Algoritmos y Estructuras de Datos</h2>
          <p>2.º año · Ingeniería Informática · código S2-14</p>
        </div>
        <Link
          className={styles.textAction}
          href="/validacion/pixel-notebook/resultados?q=algoritmos"
        >
          Ver todos los recursos
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>

      <div className={styles.resultsToolbar}>
        <div className={styles.filterSummary} aria-label="Filtros activos">
          <span>Tipo: Parcial</span>
          <span>Materia: Algoritmos</span>
        </div>
        <Link
          className={styles.allSubjectsLink}
          href="/validacion/pixel-notebook/resultados?q=algoritmos"
        >
          <Search aria-hidden="true" size={16} />
          Buscar en todas las materias
        </Link>
      </div>

      <section aria-labelledby="resources-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>Recursos</p>
            <h2 id="resources-title">3 resultados para “algoritmos”</h2>
          </div>
          <p>Orden: relevancia y confianza</p>
        </div>

        <div className={styles.resourceList}>
          {validationResources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))}
        </div>
      </section>
    </div>
  );
}

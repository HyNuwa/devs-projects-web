import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Eye, Star, ThumbsUp } from 'lucide-react';
import type { ValidationResource } from './data';
import styles from './PrototypeShell.module.css';

export function ResourceRow({ resource }: { resource: ValidationResource }) {
  return (
    <article className={styles.resourceRow}>
      <div className={styles.resourceMain}>
        <div className={styles.resourceLabels}>
          <span>{resource.type}</span>
          {resource.reviewed ? (
            <span className={styles.reviewedLabel}>
              <CheckCircle2 aria-hidden="true" size={14} />
              Revisado
            </span>
          ) : null}
        </div>
        <h3>
          <Link href="/validacion/pixel-notebook/material">{resource.title}</Link>
        </h3>
        <p>{resource.subject}</p>
        <dl className={styles.rowContext}>
          <div>
            <dt>Ciclo</dt>
            <dd>{resource.year}</dd>
          </div>
          <div>
            <dt>Profesor</dt>
            <dd>{resource.professor}</dd>
          </div>
          <div>
            <dt>Turno</dt>
            <dd>{resource.shift}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.resourceSignals} aria-label="Señales de comunidad">
        <span>
          <ThumbsUp aria-hidden="true" size={15} /> {resource.helpfulCount} dijeron “Me sirvió”
        </span>
        <span
          aria-label={`${resource.rating} de 5 estrellas, ${resource.ratingCount} valoraciones`}
        >
          <Star aria-hidden="true" size={15} /> {resource.rating} · {resource.ratingCount}
        </span>
      </div>

      <details className={styles.rowPreview}>
        <summary>
          <Eye aria-hidden="true" size={17} />
          Vista previa
        </summary>
        <div>
          <p>{resource.preview}</p>
          <Link href="/validacion/pixel-notebook/material">
            Abrir detalle <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </details>
    </article>
  );
}

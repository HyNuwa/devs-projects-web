import Link from 'next/link';
import { Eye, FileText, Star, ThumbsUp } from 'lucide-react';
import type { ValidationResource } from './data';
import styles from './PrototypeShell.module.css';

export function ResourceRow({ resource, href }: { resource: ValidationResource; href: string }) {
  return (
    <article className={styles.resourceRow}>
      <span className={styles.resourceFileIcon} aria-hidden="true">
        <FileText size={20} />
      </span>
      <div className={styles.resourceMain}>
        <div className={styles.resourceLabels}>
          <span>{resource.type}</span>
        </div>
        <h3>
          <Link href={href} scroll={false}>
            {resource.title}
          </Link>
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

      <Link className={styles.rowPreviewAction} href={href} scroll={false}>
        <Eye aria-hidden="true" size={17} />
        Abrir vista previa
      </Link>
    </article>
  );
}

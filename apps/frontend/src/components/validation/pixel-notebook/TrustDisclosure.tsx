import { CheckCircle2 } from 'lucide-react';
import styles from './PrototypeShell.module.css';

export function TrustDisclosure() {
  return (
    <details className={styles.trustDisclosure}>
      <summary>
        <span className={styles.trustIcon} aria-hidden="true">
          <CheckCircle2 size={19} />
        </span>
        <span>
          <strong>Revisado</strong>
          <small>por Moderación académica · 12 ago 2026</small>
        </span>
        <span className={styles.disclosureHint}>¿Qué significa?</span>
      </summary>
      <div>
        <p>
          Una persona autorizada pudo abrir el archivo y comprobó que la materia, el tipo de recurso
          y el contexto declarado son creíbles.
        </p>
        <p>
          No garantiza que todas las respuestas sean correctas. La aprobación para publicar, las
          estrellas y “Me sirvió” son señales diferentes.
        </p>
      </div>
    </details>
  );
}

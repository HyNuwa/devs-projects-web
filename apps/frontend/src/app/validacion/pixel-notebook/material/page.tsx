import { CalendarDays, Clock3, GraduationCap, UserRound } from 'lucide-react';
import { MaterialActions } from '@/components/validation/pixel-notebook/MaterialActions';
import { TrustDisclosure } from '@/components/validation/pixel-notebook/TrustDisclosure';
import { validationResources } from '@/components/validation/pixel-notebook/data';
import styles from '@/components/validation/pixel-notebook/PrototypeShell.module.css';

const material = validationResources[0];

export default function PixelNotebookValidationMaterialPage() {
  return (
    <article className={styles.detailPage}>
      <header className={styles.detailHeader}>
        <p className={styles.eyebrow}>Parcial · recurso sintético</p>
        <h1>{material.title}</h1>
        <p className={styles.subjectLink}>{material.subject}</p>

        <dl className={styles.contextGrid} aria-label="Contexto académico declarado">
          <div>
            <CalendarDays aria-hidden="true" size={17} />
            <dt>Ciclo lectivo</dt>
            <dd>{material.year}</dd>
          </div>
          <div>
            <UserRound aria-hidden="true" size={17} />
            <dt>Profesor</dt>
            <dd>{material.professor}</dd>
          </div>
          <div>
            <Clock3 aria-hidden="true" size={17} />
            <dt>Turno</dt>
            <dd>{material.shift}</dd>
          </div>
          <div>
            <GraduationCap aria-hidden="true" size={17} />
            <dt>Tipo</dt>
            <dd>{material.type}</dd>
          </div>
        </dl>
      </header>

      <TrustDisclosure />

      <MaterialActions initialHelpfulCount={material.helpfulCount} />

      <section className={styles.communitySection} aria-labelledby="community-title">
        <div>
          <p className={styles.sectionKicker}>Opinión de estudiantes</p>
          <h2 id="community-title">Valoraciones del material</h2>
          <p>
            Las estrellas describen la experiencia de la comunidad; no reemplazan la revisión
            académica.
          </p>
        </div>
        <div className={styles.ratingSummary} aria-label="Calificación: 4,6 de 5 estrellas">
          <span aria-hidden="true">★★★★★</span>
          <strong>4,6</strong>
          <small>18 valoraciones</small>
        </div>
      </section>
    </article>
  );
}

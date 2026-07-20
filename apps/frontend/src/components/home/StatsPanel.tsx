import Image from 'next/image';
import styles from './StatsPanel.module.css';

export const StatsPanel = () => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsHeader}>
        <div className={styles.headerIconWrapper}>
          <Image
            src="/assets/cards/estadisticas/estadisticas.png"
            alt="Estadísticas"
            width={36}
            height={36}
          />
        </div>
        <h3 className={styles.statsTitle}>ESTADÍSTICAS</h3>
      </div>

      <ul className={styles.statsList}>
        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Image
              src="/assets/cards/estadisticas/miembros.png"
              alt="Miembros"
              width={60}
              height={60}
            />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>12.458</span>
            <span className={styles.statLabel}>Miembros</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Image
              src="/assets/cards/estadisticas/materiales.png"
              alt="Materiales"
              width={60}
              height={60}
            />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>3.672</span>
            <span className={styles.statLabel}>Materiales</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Image
              src="/assets/cards/estadisticas/preguntas.png"
              alt="Preguntas"
              width={60}
              height={60}
            />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>8.931</span>
            <span className={styles.statLabel}>Preguntas</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Image
              src="/assets/cards/estadisticas/plan_estudio.png"
              alt="Cursos activos"
              width={60}
              height={60}
            />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>1.250</span>
            <span className={styles.statLabel}>Cursos activos</span>
          </div>
        </li>
      </ul>
    </div>
  );
};

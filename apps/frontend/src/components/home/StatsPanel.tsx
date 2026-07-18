import { Users, FileText, HelpCircle, Shield, BarChart2 } from 'lucide-react';
import styles from './StatsPanel.module.css';

export const StatsPanel = () => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsHeader}>
        <BarChart2 size={20} className={styles.statsIcon} />
        <h3 className={styles.statsTitle}>ESTADÍSTICAS</h3>
      </div>

      <ul className={styles.statsList}>
        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Users size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>12.458</span>
            <span className={styles.statLabel}>Miembros</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <FileText size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>3.672</span>
            <span className={styles.statLabel}>Materiales</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <HelpCircle size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>8.931</span>
            <span className={styles.statLabel}>Preguntas</span>
          </div>
        </li>

        <li className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <Shield size={20} />
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

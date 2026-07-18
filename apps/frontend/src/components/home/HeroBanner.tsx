import Image from 'next/image';
import Link from 'next/link';
import { Users, FileText, HelpCircle, Shield, ChevronRight, BarChart2 } from 'lucide-react';
import styles from './HeroBanner.module.css';

export const HeroBanner = () => {
  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <div className={styles.backgroundContainer}>
        {/* We use a standard img tag or Next Image. Assuming the user puts HERO.png in public/assets/ */}
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: "url('/assets/HERO.png')" }}
        />
        <div className={styles.overlay}></div>
      </div>

      <div className={styles.container}>
        {/* Left Content */}
        <div className={styles.content}>
          <div className={styles.greeting}>
            <span className={styles.sparkle}>✨</span>
            <h2 className={styles.welcomeText}>BIENVENIDO,</h2>
            <span className={styles.sparkle}>✨</span>
          </div>

          <h1 className={`${styles.title} font-pixel`}>VIAJERO</h1>

          <p className={styles.description}>
            Tu aventura académica comienza aquí. Comparte conocimiento, ayuda a otros y conviértete
            en leyenda.
          </p>

          <div className={styles.actions}>
            <Link href="/registro" className={styles.primaryBtn}>
              ÚNETE A LA COMUNIDAD <ChevronRight size={18} />
            </Link>
            <Link href="/foro" className={styles.secondaryBtn}>
              EXPLORAR FOROS <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Right Stats Card (Glassmorphism) */}
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
      </div>
    </section>
  );
};

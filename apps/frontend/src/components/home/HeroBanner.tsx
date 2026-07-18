import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StatsPanel } from './StatsPanel';
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
            <h2 className={`${styles.welcomeText} font-pixel`}>BIENVENIDO,</h2>
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
        <StatsPanel />
      </div>
    </section>
  );
};

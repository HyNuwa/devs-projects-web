import { HeroBanner } from '@/components/home/HeroBanner';
import { ModuleCards } from '@/components/home/ModuleCards';
import { RecentPosts } from '@/components/home/RecentPosts';
import { FeaturedMembers } from '@/components/home/FeaturedMembers';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className="home-page">
      <HeroBanner />
      <ModuleCards />

      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            <div>
              <RecentPosts />
            </div>
            <div>
              <FeaturedMembers />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

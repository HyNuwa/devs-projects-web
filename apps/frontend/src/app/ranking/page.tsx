import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { RankCard } from '@/components/ranking/RankCard';
import { RankingList } from '@/components/ranking/RankingList';
import { LevelsTable } from '@/components/ranking/LevelsTable';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Ranking - DevsProject',
  description:
    'Clasificación de aventureros, tu posición en el ranking y la tabla de niveles RPG de DevsProject.',
};

export default function RankingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>CLASIFICACIÓN</span>
            <Sparkles size={16} />
          </div>
          <h1 className={`${styles.title} font-pixel`}>RANKING DE AVENTUREROS</h1>
          <p className={styles.subtitle}>
            Cada aporte suma puntos. Sube de nivel y conviértete en leyenda.
          </p>
        </header>

        <RankCard />

        <RankingList />

        <LevelsTable />
      </div>
    </div>
  );
}

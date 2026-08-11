'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Diamond, LogIn, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';
import { LevelInfo, RpgLevel, UserRank } from '@/types/ranking';
import styles from './RankCard.module.css';

type MeData = UserRank & LevelInfo;

export const RankCard = () => {
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  const [me, setMe] = useState<MeData | null>(null);
  const [levels, setLevels] = useState<RpgLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [meRes, levelsRes] = await Promise.all([
          api.get('/ranking/me'),
          api.get('/ranking/levels'),
        ]);
        if (cancelled) return;
        setMe(getData<MeData>(meRes));
        setLevels(getData<RpgLevel[]>(levelsRes));
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoadingAuth]);

  // No logueado → CTA
  if (!isLoadingAuth && !user) {
    return (
      <section className={`${styles.card} ${styles.ctaCard}`}>
        <div className={styles.ctaIcon}>
          <Crown size={30} />
        </div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>¿Dónde está tu lugar en la leyenda?</h2>
          <p className={styles.ctaText}>Inicia sesión para ver tu posición en el ranking</p>
        </div>
        <Link href="/auth/login" className={styles.ctaLink}>
          <LogIn size={16} />
          Iniciar sesión
        </Link>
      </section>
    );
  }

  // Cargando auth o datos
  if (isLoadingAuth || isLoading) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Consultando tu ficha de aventurero...</p>
        </div>
      </section>
    );
  }

  if (error || !me) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <p className={styles.errorText}>{error ?? 'No se pudo cargar tu posición.'}</p>
        </div>
      </section>
    );
  }

  // Barra de progreso: usamos la tabla de niveles para el umbral del nivel actual.
  // pointsToNext = puntos restantes para el siguiente nivel; progreso = 1 - restante/span.
  const currentLevel = levels.find((l) => l.level === me.level);
  const nextLevel = levels.find((l) => l.level === me.nextLevel);
  let progress = 1;
  if (me.pointsToNext !== null && currentLevel && nextLevel) {
    const span = nextLevel.points - currentLevel.points;
    if (span > 0) {
      progress = Math.min(1, Math.max(0, 1 - me.pointsToNext / span));
    }
  }
  const progressPct = Math.round(progress * 100);

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleWrap}>
          <Crown size={20} className={styles.cardIcon} />
          <h2 className={styles.cardTitle}>MI RANK</h2>
        </div>
        <div className={styles.rankBadge}>
          <span className={`${styles.rankNumber} font-pixel`}>#{me.rank}</span>
          <span className={styles.rankTotal}>de {me.totalUsers}</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.levelBlock}>
          <span className={styles.levelLabel}>NIVEL</span>
          <span className={`${styles.levelName} font-pixel`}>{me.levelName}</span>
          <span className={styles.levelNum}>LV.{me.level}</span>
        </div>

        <div className={styles.pointsBlock}>
          <Diamond size={20} className={styles.pointsIcon} />
          <span className={styles.pointsValue}>{me.points.toLocaleString('es-ES')}</span>
          <span className={styles.pointsLabel}>puntos</span>
        </div>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>
            {me.pointsToNext !== null
              ? `Faltan ${me.pointsToNext.toLocaleString('es-ES')} pts para ${
                  me.nextLevelName ?? `nivel ${me.nextLevel}`
                }`
              : 'Nivel máximo alcanzado'}
          </span>
          <span className={styles.progressPct}>{progressPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        {me.nextLevelName && (
          <div className={styles.nextLevel}>
            <TrendingUp size={14} />
            Siguiente:
            <span className={`${styles.nextLevelName} font-pixel`}>{me.nextLevelName}</span>
          </div>
        )}
      </div>
    </section>
  );
};

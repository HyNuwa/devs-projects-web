'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Diamond, Medal, RefreshCw, Trophy, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { LeaderboardResponse, LeaderboardUser } from '@/types/ranking';
import { Button } from '@/components/ui';
import styles from './RankingList.module.css';

type Period = 'global' | 'weekly' | 'monthly';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
];

const PAGE_SIZE = 10;

export const RankingList = () => {
  const [period, setPeriod] = useState<Period>('global');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'period' | 'top'>('period');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (p: Period, pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/ranking', {
        params: { period: p, page: pageNum, limit: PAGE_SIZE },
      });
      setData(getData<LeaderboardResponse>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/ranking/top');
      setData(getData<LeaderboardResponse>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res =
          view === 'top'
            ? await api.get('/ranking/top')
            : await api.get('/ranking', {
                params: { period, page, limit: PAGE_SIZE },
              });
        if (!cancelled) {
          setData(getData<LeaderboardResponse>(res));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, period, page]);

  const handlePeriodChange = (p: Period) => {
    setView('period');
    setPeriod(p);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || (data && next > data.meta.totalPages)) return;
    setPage(next);
  };

  const totalPages = data?.meta.totalPages ?? 1;
  const rows = data?.data ?? [];
  // El objeto LeaderboardUser NO trae posición: se calcula desde el índice + offset de página.
  const offset = view === 'top' ? 0 : (page - 1) * PAGE_SIZE;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>CLASIFICACIÓN</h2>
          <p className={styles.sectionSub}>
            {view === 'top'
              ? 'Los 10 aventureros más legendarios'
              : `Top de la temporada · ${PERIODS.find((p) => p.value === period)?.label}`}
          </p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Período del ranking">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={view === 'period' && period === p.value}
                className={`${styles.tab} ${
                  view === 'period' && period === p.value ? styles.tabActive : ''
                }`}
                onClick={() => handlePeriodChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.topBtn} ${view === 'top' ? styles.topBtnActive : ''}`}
            onClick={() => setView('top')}
          >
            <Trophy size={16} />
            Top 10
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <p>Cargando clasificación...</p>
        </div>
      ) : error ? (
        <div className={styles.stateBox}>
          <p className={styles.errorText}>{error}</p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => (view === 'top' ? fetchTop() : fetchLeaderboard(period, page))}
          >
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.stateBox}>
          <Users size={32} className={styles.stateIcon} />
          <p>Aún no hay aventureros en la clasificación.</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {rows.map((user, index) => (
              <RankRow key={user.id} user={user} position={offset + index + 1} />
            ))}
          </div>

          {view === 'period' && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

interface RankRowProps {
  user: LeaderboardUser;
  position: number;
}

const RankRow = ({ user, position }: RankRowProps) => {
  const name = user.displayName || user.username;
  const isTop3 = position <= 3;
  const medalClass = position === 1 ? styles.gold : position === 2 ? styles.silver : styles.bronze;

  return (
    <div
      className={`${styles.row} ${isTop3 ? `${styles.rowTop} ${medalClass}` : ''}`}
      style={{ animationDelay: `${Math.min(position, 10) * 45}ms` }}
    >
      <div className={styles.position}>
        {position === 1 ? (
          <Trophy size={22} className={styles.goldIcon} />
        ) : position === 2 ? (
          <Medal size={22} className={styles.silverIcon} />
        ) : position === 3 ? (
          <Medal size={22} className={styles.bronzeIcon} />
        ) : (
          <span className={styles.positionNumber}>{position}</span>
        )}
      </div>

      <div className={styles.avatar}>
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={name} />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className={styles.userInfo}>
        <span className={styles.username}>{name}</span>
        {user.displayName && <span className={styles.handle}>@{user.username}</span>}
      </div>

      <div className={styles.levelBadge}>
        <span className={`${styles.levelText} font-pixel`}>LV.{user.level}</span>
      </div>

      <div className={styles.points}>
        <Diamond size={16} className={styles.pointsIcon} />
        <span>{user.points.toLocaleString('es-ES')}</span>
      </div>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';
import { Gem, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';
import { LevelInfo, RpgLevel, UserRank } from '@/types/ranking';
import { Button } from '@/components/ui';
import styles from './LevelsTable.module.css';

type MeData = UserRank & LevelInfo;

export const LevelsTable = () => {
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  const [levels, setLevels] = useState<RpgLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLevels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/ranking/levels');
      setLevels(getData<RpgLevel[]>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/ranking/levels');
        if (!cancelled) {
          setLevels(getData<RpgLevel[]>(res));
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
  }, []);

  // Si está logueado, obtenemos su nivel para resaltarlo en la tabla.
  useEffect(() => {
    if (isLoadingAuth || !user) {
      return;
    }
    let cancelled = false;
    api
      .get('/ranking/me', { skipAuthRedirect: true })
      .then((res) => {
        if (!cancelled) setCurrentLevel(getData<MeData>(res).level);
      })
      .catch(() => {
        // no resaltar si falla
      });
    return () => {
      cancelled = true;
    };
  }, [user, isLoadingAuth]);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>NIVELES RPG</h2>
          <p className={styles.sectionSub}>Referencia de niveles y puntos requeridos</p>
        </div>
        <div className={styles.headerIcon}>
          <Gem size={18} />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <p>Cargando niveles...</p>
        </div>
      ) : error ? (
        <div className={styles.stateBox}>
          <p className={styles.errorText}>{error}</p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={loadLevels}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={`${styles.tableRow} ${styles.tableHead}`}>
            <span className={styles.colLevel}>Nivel</span>
            <span className={styles.colName}>Nombre</span>
            <span className={styles.colPoints}>Puntos</span>
          </div>
          {levels.map((lvl) => (
            <div
              key={lvl.level}
              className={`${styles.tableRow} ${
                user && currentLevel === lvl.level ? styles.rowCurrent : ''
              }`}
            >
              <span className={styles.colLevel}>
                <span className={`${styles.levelNum} font-pixel`}>LV.{lvl.level}</span>
              </span>
              <span className={styles.colName}>
                {lvl.name}
                {user && currentLevel === lvl.level && (
                  <span className={styles.currentTag}>TU NIVEL</span>
                )}
              </span>
              <span className={styles.colPoints}>{lvl.points.toLocaleString('es-ES')}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

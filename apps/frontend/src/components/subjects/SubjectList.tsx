'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { getData, getApiError } from '@/lib/apiHelpers';
import { Subject } from '@/types/subject';
import styles from './SubjectList.module.css';

export const SubjectList = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/subjects');
        if (!cancelled) setSubjects(getData<Subject[]>(res));
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

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>PLAN DE ESTUDIO</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>Materias</h1>
          <p className={styles.subtitle}>
            Explorá el plan de estudio, reseñas de cursada y experiencias de final por materia.
          </p>
        </header>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar materia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.state}>
            <p className={styles.stateText}>{error}</p>
            <button className={styles.retry} onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <BookOpen size={40} className={styles.stateIcon} />
            <p className={styles.stateText}>No se encontraron materias.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((subject) => (
              <Link
                href={`/materias/${subject.code ?? subject.id}`}
                key={subject.id}
                className={styles.card}
              >
                <div className={styles.cardIcon}>
                  <BookOpen size={24} />
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{subject.name}</h3>
                  {subject.code && <span className={styles.cardCode}>{subject.code}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

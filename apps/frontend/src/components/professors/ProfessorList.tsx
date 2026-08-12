'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Loader2, MessageSquare, Sparkles, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { Professor } from '@/types/professor';
import { Subject } from '@/types/subject';
import { Paginated } from '@/types/material';
import styles from './ProfessorList.module.css';

const PAGE_SIZE = 12;

interface ProfessorListState {
  data: Professor[];
  page: number;
  totalPages: number;
  total: number;
}

export function ProfessorList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [state, setState] = useState<ProfessorListState>({
    data: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfessors = useCallback(async (page: number, subjectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (subjectId) params.subjectId = subjectId;
      const res = await api.get('/professors', { params });
      const paginated = getData<Paginated<Professor>>(res);
      setState({
        data: paginated.data,
        page: paginated.meta.page,
        totalPages: paginated.meta.totalPages,
        total: paginated.meta.total,
      });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/subjects')
      .then((res) => {
        if (active) setSubjects(getData<Subject[]>(res));
      })
      .catch(() => {
        // El filtro de materias es opcional; la lista sigue funcionando sin él.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params: Record<string, string | number> = { page: 1, limit: PAGE_SIZE };
        if (selectedSubjectId) params.subjectId = selectedSubjectId;
        const res = await api.get('/professors', { params });
        const paginated = getData<Paginated<Professor>>(res);
        if (!cancelled) {
          setState({
            data: paginated.data,
            page: paginated.meta.page,
            totalPages: paginated.meta.totalPages,
            total: paginated.meta.total,
          });
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
  }, [selectedSubjectId]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > state.totalPages || page === state.page) return;
    loadProfessors(page, selectedSubjectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>PUNTÚA A TU PROFESOR</span>
            <Sparkles size={16} />
          </div>
          <h1 className={`${styles.title} font-pixel`}>PROFESORES</h1>
          <p className={styles.subtitle}>
            Conocé qué profesores dictan cada materia y compartí tu experiencia en el hub de la
            materia.
          </p>
        </header>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <GraduationCap size={18} className={styles.filterIcon} />
            <label htmlFor="subject-filter" className={styles.filterLabel}>
              Materia
            </label>
            <select
              id="subject-filter"
              className={styles.select}
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">Todas las materias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.resultCount}>
            <Users size={16} />
            <span>
              {isLoading
                ? 'Cargando...'
                : `${state.total} ${state.total === 1 ? 'profesor' : 'profesores'}`}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Reclutando profesores...</p>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.retryBtn}
              onClick={() => loadProfessors(state.page, selectedSubjectId)}
            >
              Reintentar
            </button>
          </div>
        ) : state.data.length === 0 ? (
          <div className={styles.stateBox}>
            <Users size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No hay profesores</p>
            <p className={styles.emptyText}>
              {selectedSubject
                ? `Aún no hay profesores registrados para ${selectedSubject.name}.`
                : 'Aún no hay profesores registrados en la comunidad.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {state.data.map((professor) => (
                <ProfessorCard key={professor.id} professor={professor} />
              ))}
            </div>

            {state.totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Paginación de profesores">
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(state.page - 1)}
                  disabled={state.page <= 1}
                >
                  Anterior
                </button>
                <div className={styles.pages}>
                  {Array.from({ length: state.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`${styles.pageNumber} ${page === state.page ? styles.active : ''}`}
                      onClick={() => goToPage(page)}
                      aria-current={page === state.page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(state.page + 1)}
                  disabled={state.page >= state.totalPages}
                >
                  Siguiente
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProfessorCard({ professor }: { professor: Professor }) {
  const subjectNames = (professor.subjects ?? [])
    .map((ps) => ps.subject.name)
    .slice(0, 2)
    .join(' · ');

  return (
    <Link href={`/profesores/${professor.id}`} className={styles.card}>
      <div className={styles.avatarFrame}>
        {professor.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professor.avatarUrl}
            alt={`Avatar de ${professor.name}`}
            className={styles.avatarImage}
          />
        ) : (
          <span className={styles.avatarFallback}>{professor.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{professor.name}</h3>
        {subjectNames ? (
          <div className={styles.reviewCount}>
            <GraduationCap size={15} />
            <span>{subjectNames}</span>
          </div>
        ) : (
          <div className={styles.reviewCount}>
            <MessageSquare size={15} />
            <span>Sin materias asignadas</span>
          </div>
        )}
      </div>

      <div className={styles.cardArrow}>
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}

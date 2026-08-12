'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { Professor } from '@/types/professor';
import styles from './ProfessorDetail.module.css';

export function ProfessorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/professors/${id}`);
        if (!cancelled) {
          setProfessor(getData<Professor>(res));
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
  }, [id]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Consultando la ficha del profesor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error ?? 'Profesor no encontrado'}</p>
            <Link href="/profesores" className={styles.retryBtn}>
              Volver a Profesores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/profesores" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a Profesores
        </Link>

        {/* Header card */}
        <section className={styles.headerCard}>
          <div className={styles.avatarFrame}>
            {professor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={professor.avatarUrl}
                alt={`Avatar de ${professor.name}`}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarFallback}>
                {professor.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.headerBadge}>
              <Sparkles size={14} />
              <span className={`${styles.headerLabel} font-pixel`}>PROFESOR</span>
              <Sparkles size={14} />
            </div>
            <h1 className={`${styles.title} font-pixel`}>{professor.name}</h1>

            {professor.subjects && professor.subjects.length > 0 && (
              <div className={styles.subjects}>
                {professor.subjects.map((ps) => (
                  <Link
                    key={ps.id}
                    href={`/materias/${ps.subject.code ?? ps.subject.id}`}
                    className={styles.subjectChip}
                  >
                    <BookOpen size={13} />
                    {ps.subject.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bio */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <GraduationCap size={18} />
            Biografía
          </h2>
          {professor.bio ? (
            <p className={styles.bio}>{professor.bio}</p>
          ) : (
            <p className={`${styles.bio} ${styles.bioEmpty}`}>
              Este profesor aún no ha compartido una biografía.
            </p>
          )}
        </section>

        {/* Materias que dicta */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <BookOpen size={18} />
            Materias que dicta
          </h2>
          {professor.subjects && professor.subjects.length > 0 ? (
            <div className={styles.subjectList}>
              {professor.subjects.map((ps) => (
                <Link
                  key={ps.id}
                  href={`/materias/${ps.subject.code ?? ps.subject.id}`}
                  className={styles.subjectLink}
                >
                  <BookOpen size={16} />
                  <span>{ps.subject.name}</span>
                  <span className={styles.subjectArrow}>→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.bioEmpty}>
              Este profesor no está vinculado a ninguna materia por el momento.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

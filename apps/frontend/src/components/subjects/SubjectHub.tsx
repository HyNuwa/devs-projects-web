'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Sparkles,
  Star,
  Users,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getData, getApiError } from '@/lib/apiHelpers';
import {
  courseConditionLabel,
  examFormatLabel,
  examPeriodLabel,
  shiftLabel,
} from '@/lib/presentation-labels';
import {
  SubjectHub as SubjectHubType,
  CourseReviewResponse,
  ExamExperience,
} from '@/types/subject';
import { Material } from '@/types/material';
import styles from './SubjectHub.module.css';

type Tab = 'resenas' | 'finales' | 'materiales';

export const SubjectHub = ({ code }: { code: string }) => {
  const [subject, setSubject] = useState<SubjectHubType | null>(null);
  const [reviews, setReviews] = useState<CourseReviewResponse | null>(null);
  const [exams, setExams] = useState<ExamExperience[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tab, setTab] = useState<Tab>('resenas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hubRes, reviewsRes, examsRes, materialsRes] = await Promise.all([
          api.get(`/subjects/${code}`),
          api.get(`/subjects/${code}/reviews`),
          api.get(`/subjects/${code}/exams`),
          api.get('/materials', { params: { subjectId: undefined, page: 1, limit: 20 } }),
        ]);
        if (cancelled) return;
        const hub = getData<SubjectHubType>(hubRes);
        setSubject(hub);
        setReviews(getData<CourseReviewResponse>(reviewsRes));
        setExams(getData<ExamExperience[]>(examsRes));
        const mats = getData<{ data: Material[] }>(materialsRes);
        setMaterials(mats.data.filter((m) => m.subjectId === hub.id));
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.skeletonBlock} />
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>
            <p className={styles.stateText}>{error || 'Materia no encontrada'}</p>
            <Link href="/materias" className={styles.backLink}>
              <ArrowLeft size={16} /> Volver a materias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan = subject.studyPlans[0];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/materias" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a materias
        </Link>

        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>MATERIA</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>{subject.name}</h1>
          {subject.description && <p className={styles.subtitle}>{subject.description}</p>}

          <div className={styles.metaRow}>
            {plan && (
              <span className={styles.metaChip}>
                {plan.studyPlan.career.name} · Año {plan.year} · Cuatrimestre {plan.semester}
                {plan.credits ? ` · ${plan.credits} créditos` : ''}
              </span>
            )}
            {subject.code && <span className={styles.metaChip}>Código {subject.code}</span>}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <Star size={18} className={styles.statIcon} />
              <span className={styles.statValue}>
                {subject.stats.avgRecommendation ? subject.stats.avgRecommendation.toFixed(1) : '—'}
              </span>
              <span className={styles.statLabel}>recomendación</span>
            </div>
            <div className={styles.stat}>
              <MessageSquare size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{subject.stats.reviewCount}</span>
              <span className={styles.statLabel}>reseñas</span>
            </div>
            <div className={styles.stat}>
              <GraduationCap size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{subject.stats.examCount}</span>
              <span className={styles.statLabel}>finales</span>
            </div>
            <div className={styles.stat}>
              <FileText size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{subject.stats.materialCount}</span>
              <span className={styles.statLabel}>materiales</span>
            </div>
          </div>
        </header>

        {subject.professors.length > 0 && (
          <section className={styles.professors}>
            <h2 className={styles.sectionTitle}>
              <Users size={18} /> Profesores
            </h2>
            <div className={styles.professorList}>
              {subject.professors.map(({ professor }) => (
                <Link
                  href={`/profesores/${professor.id}`}
                  key={professor.id}
                  className={styles.professorChip}
                >
                  {professor.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'resenas' ? styles.tabActive : ''}`}
            onClick={() => setTab('resenas')}
          >
            Reseñas
          </button>
          <button
            className={`${styles.tab} ${tab === 'finales' ? styles.tabActive : ''}`}
            onClick={() => setTab('finales')}
          >
            Finales
          </button>
          <button
            className={`${styles.tab} ${tab === 'materiales' ? styles.tabActive : ''}`}
            onClick={() => setTab('materiales')}
          >
            Materiales
          </button>
        </nav>

        <div className={styles.tabContent}>
          {tab === 'resenas' && (
            <section>
              <div className={styles.tabHeader}>
                <h2 className={styles.sectionTitle}>Reseñas de cursada</h2>
                <Link href={`/materias/${code}/resenar`} className={styles.ctaBtn}>
                  Reseñar mi cursada
                </Link>
              </div>

              {reviews && reviews.conditionBreakdown.length > 0 && (
                <div className={styles.breakdown}>
                  {reviews.conditionBreakdown.map((b) => (
                    <span key={b.condition} className={styles.breakdownChip}>
                      {courseConditionLabel(b.condition)}: {b._count}
                    </span>
                  ))}
                </div>
              )}

              {reviews && reviews.reviews.length === 0 ? (
                <div className={styles.state}>
                  <p className={styles.stateText}>
                    Aún no hay reseñas. ¡Sé el primero en contar tu experiencia!
                  </p>
                </div>
              ) : (
                <div className={styles.reviewList}>
                  {reviews?.reviews.map((r) => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewTop}>
                        <span className={styles.reviewAuthor}>
                          {r.user?.displayName || r.user?.username || 'Anónimo'}
                        </span>
                        <span className={styles.reviewShift}>{shiftLabel(r.shift)}</span>
                      </div>
                      <div className={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < r.recommendation ? styles.starFilled : styles.starEmpty}
                          />
                        ))}
                      </div>
                      <span className={styles.reviewCondition}>
                        {courseConditionLabel(r.condition)}
                      </span>
                      {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'finales' && (
            <section>
              <div className={styles.tabHeader}>
                <h2 className={styles.sectionTitle}>Experiencias de final</h2>
                <Link href={`/materias/${code}/final`} className={styles.ctaBtn}>
                  Contar mi final
                </Link>
              </div>

              {exams.length === 0 ? (
                <div className={styles.state}>
                  <p className={styles.stateText}>
                    Aún no hay experiencias de final. ¡Compartí la tuya!
                  </p>
                </div>
              ) : (
                <div className={styles.examList}>
                  {exams.map((e) => (
                    <div key={e.id} className={styles.examCard}>
                      <div className={styles.examTop}>
                        <span className={styles.examYear}>{e.year}</span>
                        <span className={styles.examSession}>{examPeriodLabel(e.session)}</span>
                        <span className={styles.examFormat}>{examFormatLabel(e.format)}</span>
                      </div>
                      <div className={styles.examMeta}>
                        <span>Teórico: {e.difficultyTheory}/5</span>
                        <span>Práctico: {e.difficultyPractice}/5</span>
                        {e.professor && <span>Tomó: {e.professor.name}</span>}
                        {e.examinerName && <span>Tomó: {e.examinerName}</span>}
                      </div>
                      {e.comment && <p className={styles.examComment}>{e.comment}</p>}
                      <span className={styles.examAuthor}>
                        {e.user?.displayName || e.user?.username || 'Anónimo'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'materiales' && (
            <section>
              <div className={styles.tabHeader}>
                <h2 className={styles.sectionTitle}>Materiales</h2>
                <Link href="/materiales/nuevo" className={styles.ctaBtn}>
                  Subir material
                </Link>
              </div>

              {materials.length === 0 ? (
                <div className={styles.state}>
                  <p className={styles.stateText}>
                    Aún no hay materiales aprobados para esta materia.
                  </p>
                </div>
              ) : (
                <div className={styles.materialList}>
                  {materials.map((m) => (
                    <Link href={`/materiales/${m.id}`} key={m.id} className={styles.materialCard}>
                      <BookOpen size={20} className={styles.materialIcon} />
                      <div>
                        <h3 className={styles.materialTitle}>{m.title}</h3>
                        <span className={styles.materialMeta}>
                          {m.author?.displayName || m.author?.username} · {m.downloadCount}{' '}
                          descargas
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

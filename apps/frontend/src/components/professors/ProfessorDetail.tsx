'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
  StarHalf,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';
import { Button, useToast } from '@/components/ui';
import { Professor, ProfessorReview } from '@/types/professor';
import { Paginated, PaginationMeta } from '@/types/material';
import styles from './ProfessorDetail.module.css';

const REVIEWS_PAGE_SIZE = 10;

const evaluateSchema = z.object({
  value: z.number().int().min(1, 'Selecciona una puntuación').max(5),
  description: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type EvaluateFormValues = z.infer<typeof evaluateSchema>;

export function ProfessorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const user = useAuthStore((state) => state.user);

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Ver todas las valoraciones"
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [allReviews, setAllReviews] = useState<ProfessorReview[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<PaginationMeta | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const loadProfessor = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/professors/${id}`);
      setProfessor(getData<Professor>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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

  const loadAllReviews = useCallback(
    async (page: number) => {
      setIsReviewsLoading(true);
      setReviewsError(null);
      try {
        const res = await api.get(`/professors/${id}/reviews`, {
          params: { page, limit: REVIEWS_PAGE_SIZE },
        });
        const paginated = getData<Paginated<ProfessorReview>>(res);
        setAllReviews(paginated.data);
        setReviewsMeta(paginated.meta);
        setReviewsPage(paginated.meta.page);
      } catch (err) {
        setReviewsError(getApiError(err));
      } finally {
        setIsReviewsLoading(false);
      }
    },
    [id],
  );

  const handleShowAllReviews = () => {
    setShowAllReviews(true);
    loadAllReviews(1);
  };

  const handleCollapseReviews = () => {
    setShowAllReviews(false);
    setAllReviews([]);
    setReviewsMeta(null);
  };

  const goToReviewsPage = (page: number) => {
    if (!reviewsMeta) return;
    if (page < 1 || page > reviewsMeta.totalPages || page === reviewsPage) return;
    loadAllReviews(page);
  };

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

  const reviewCount = professor._count?.reviews ?? professor.reviews?.length ?? 0;
  const recentReviews = professor.reviews ?? [];
  const hasMoreReviews = reviewCount > recentReviews.length;

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

            <div className={styles.ratingRow}>
              {professor.avgRating != null ? (
                <>
                  <Stars value={professor.avgRating} size={20} />
                  <span className={styles.ratingValue}>{professor.avgRating.toFixed(1)}</span>
                  <span className={styles.ratingCount}>
                    · {reviewCount} {reviewCount === 1 ? 'valoración' : 'valoraciones'}
                  </span>
                </>
              ) : (
                <span className={styles.ratingCount}>
                  Sin valoraciones todavía · sé el primero en evaluar
                </span>
              )}
            </div>

            {professor.subjects && professor.subjects.length > 0 && (
              <div className={styles.subjects}>
                {professor.subjects.map((ps) => (
                  <span key={ps.id} className={styles.subjectChip}>
                    <BookOpen size={13} />
                    {ps.subject.name}
                  </span>
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

        {/* Evaluate */}
        {user ? (
          <EvaluateForm professorId={id} onEvaluated={loadProfessor} />
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Award size={18} />
              Evalúa a este profesor
            </h2>
            <p className={styles.loginPrompt}>
              Inicia sesión para evaluar a {professor.name} y compartir tu experiencia con la
              comunidad.
            </p>
            <Link href="/auth/login" className={styles.loginBtn}>
              Iniciar sesión
            </Link>
          </section>
        )}

        {/* Reviews */}
        <section className={styles.card}>
          <div className={styles.reviewsHeader}>
            <h2 className={styles.cardTitle}>
              <MessageSquare size={18} />
              {showAllReviews ? 'Todas las valoraciones' : 'Valoraciones recientes'}
            </h2>
            {showAllReviews ? (
              <Button variant="ghost" size="sm" onClick={handleCollapseReviews}>
                Ver recientes
              </Button>
            ) : (
              hasMoreReviews && (
                <Button variant="outline" size="sm" onClick={handleShowAllReviews}>
                  Ver todas las valoraciones
                </Button>
              )
            )}
          </div>

          {!showAllReviews ? (
            recentReviews.length > 0 ? (
              <div className={styles.reviewList}>
                {recentReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyReviews}>
                <Users size={28} className={styles.emptyIcon} />
                <p>Aún no hay valoraciones para este profesor.</p>
              </div>
            )
          ) : isReviewsLoading ? (
            <div className={styles.stateBox}>
              <Loader2 size={28} className={styles.spinner} />
              <p>Cargando valoraciones...</p>
            </div>
          ) : reviewsError ? (
            <div className={styles.stateBox}>
              <p className={styles.errorText}>{reviewsError}</p>
              <Button variant="outline" size="sm" onClick={() => loadAllReviews(reviewsPage)}>
                Reintentar
              </Button>
            </div>
          ) : allReviews.length > 0 ? (
            <>
              <div className={styles.reviewList}>
                {allReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
              {reviewsMeta && reviewsMeta.totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Paginación de valoraciones">
                  <button
                    className={styles.pageBtn}
                    onClick={() => goToReviewsPage(reviewsPage - 1)}
                    disabled={reviewsPage <= 1}
                  >
                    Anterior
                  </button>
                  <div className={styles.pages}>
                    {Array.from({ length: reviewsMeta.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageNumber} ${page === reviewsPage ? styles.active : ''}`}
                        onClick={() => goToReviewsPage(page)}
                        aria-current={page === reviewsPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    className={styles.pageBtn}
                    onClick={() => goToReviewsPage(reviewsPage + 1)}
                    disabled={reviewsPage >= reviewsMeta.totalPages}
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className={styles.emptyReviews}>
              <Users size={28} className={styles.emptyIcon} />
              <p>Aún no hay valoraciones para este profesor.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <span className={styles.stars} aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (rounded >= i) {
          return <Star key={i} size={size} className={styles.starFilled} fill="currentColor" />;
        }
        if (rounded >= i - 0.5) {
          return <StarHalf key={i} size={size} className={styles.starFilled} fill="currentColor" />;
        }
        return <Star key={i} size={size} className={styles.starEmpty} />;
      })}
    </span>
  );
}

function ReviewItem({ review }: { review: ProfessorReview }) {
  const displayName = review.user.displayName || review.user.username;

  return (
    <article className={styles.reviewItem}>
      <div className={styles.reviewAvatar}>
        {review.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.user.avatarUrl}
            alt={`Avatar de ${displayName}`}
            className={styles.reviewAvatarImage}
          />
        ) : (
          <span>{displayName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className={styles.reviewBody}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewAuthor}>{displayName}</span>
          <span className={styles.reviewDate}>
            <Calendar size={13} />
            {formatDate(review.createdAt)}
          </span>
        </div>
        <Stars value={review.value} size={15} />
        {review.description && <p className={styles.reviewText}>{review.description}</p>}
      </div>
    </article>
  );
}

function EvaluateForm({
  professorId,
  onEvaluated,
}: {
  professorId: string;
  onEvaluated: () => Promise<void>;
}) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EvaluateFormValues>({
    resolver: zodResolver(evaluateSchema),
    defaultValues: { value: 0, description: '' },
  });

  const value = watch('value');

  const onSubmit = async (formValues: EvaluateFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post(`/professors/${professorId}/evaluate`, {
        value: formValues.value,
        description: formValues.description?.trim() || undefined,
      });
      addToast('¡Valoración enviada! Gracias por tu aporte', 'success');
      reset({ value: 0, description: '' });
      await onEvaluated();
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>
        <Award size={18} />
        Evalúa a este profesor
      </h2>
      <p className={styles.formHint}>
        Tu valoración es anónima para la comunidad. Puedes actualizarla cuando quieras.
      </p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Puntuación</span>
          <div className={styles.starInput}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className={styles.starBtn}
                onClick={() => setValue('value', i, { shouldValidate: true })}
                aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
              >
                <Star
                  size={30}
                  className={i <= value ? styles.starFilled : styles.starEmpty}
                  fill={i <= value ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
          {errors.value && <span className={styles.fieldError}>{errors.value.message}</span>}
          {!errors.value && value > 0 && (
            <span className={styles.fieldHint}>
              {value} {value === 1 ? 'estrella' : 'estrellas'}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="review-description" className={styles.fieldLabel}>
            Comentario <span className={styles.optional}>(opcional)</span>
          </label>
          <textarea
            id="review-description"
            className={styles.textarea}
            placeholder="Cuéntanos tu experiencia con este profesor..."
            maxLength={200}
            rows={4}
            {...register('description')}
          />
          {errors.description && (
            <span className={styles.fieldError}>{errors.description.message}</span>
          )}
        </div>

        <div className={styles.formActions}>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Award size={16} />}
          >
            Enviar valoración
          </Button>
        </div>
      </form>
    </section>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Sparkles, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';
import { Button, useToast } from '@/components/ui';
import { Shift, CourseCondition } from '@/types/subject';
import styles from './ReviewForm.module.css';

const reviewSchema = z.object({
  shift: z.enum(['MANANA', 'TARDE', 'NOCHE', 'NO_INDICO']),
  condition: z.enum(['PROMO', 'REGULAR', 'LIBRE', 'PREFIERO_NO_RESPONDER']),
  recommendation: z.number().int().min(1, 'Selecciona una recomendación').max(5),
  comment: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const SHIFT_OPTIONS: { value: Shift; label: string }[] = [
  { value: 'MANANA', label: 'Mañana' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOCHE', label: 'Noche' },
  { value: 'NO_INDICO', label: 'No indico' },
];

const CONDITION_OPTIONS: { value: CourseCondition; label: string }[] = [
  { value: 'PROMO', label: 'Promocioné' },
  { value: 'REGULAR', label: 'Quedé regular' },
  { value: 'LIBRE', label: 'Quedé libre' },
  { value: 'PREFIERO_NO_RESPONDER', label: 'Prefiero no responder' },
];

export function ReviewForm() {
  const params = useParams<{ codigo: string }>();
  const code = params.codigo;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      shift: 'NO_INDICO',
      condition: 'PREFIERO_NO_RESPONDER',
      recommendation: 0,
      comment: '',
    },
  });

  const recommendation = watch('recommendation');

  const onSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post(`/subjects/${code}/reviews`, {
        shift: values.shift,
        condition: values.condition,
        recommendation: values.recommendation,
        comment: values.comment?.trim() || undefined,
      });
      addToast('¡Gracias por tu reseña!', 'success');
      router.push(`/materias/${code}`);
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <p className={styles.stateText}>
              Iniciá sesión para reseñar tu cursada y ayudar a la comunidad.
            </p>
            <Link href="/auth/login" className={styles.loginBtn}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href={`/materias/${code}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a la materia
        </Link>

        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>RESEÑA</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>Reseñá tu cursada</h1>
          <p className={styles.subtitle}>
            Contá cómo te fue cursando esta materia. Tu experiencia ayuda a otros a decidir.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Turno</span>
            <div className={styles.chipGroup}>
              {SHIFT_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.chip}>
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('shift')}
                    className={styles.radio}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>¿En qué condición quedaste?</span>
            <div className={styles.chipGroup}>
              {CONDITION_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.chip}>
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('condition')}
                    className={styles.radio}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>¿La recomendás?</span>
            <div className={styles.starInput}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.starBtn}
                  onClick={() => setValue('recommendation', i, { shouldValidate: true })}
                  aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
                >
                  <Star
                    size={32}
                    className={i <= recommendation ? styles.starFilled : styles.starEmpty}
                    fill={i <= recommendation ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {errors.recommendation && (
              <span className={styles.fieldError}>{errors.recommendation.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="comment" className={styles.fieldLabel}>
              Comentario <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="comment"
              className={styles.textarea}
              placeholder="Contá tu experiencia: cómo fue la cursada, el equipo docente, la carga de trabajo..."
              rows={5}
              maxLength={2000}
              {...register('comment')}
            />
            {errors.comment && <span className={styles.fieldError}>{errors.comment.message}</span>}
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publicar reseña
            </Button>
            <Link href={`/materias/${code}`} className={styles.cancelLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { examFormatLabels, examPeriodLabels, shiftLabels } from '@/lib/presentation-labels';
import { useAuthStore } from '@/stores/authStore';
import { Button, useToast } from '@/components/ui';
import { Shift, ExamFormat, ExamSession } from '@/types/subject';
import { Professor } from '@/types/professor';
import styles from './ExamForm.module.css';

const examSchema = z.object({
  year: z.number().int().min(2000, 'Año inválido').max(2100, 'Año inválido'),
  session: z.enum(['DICIEMBRE', 'JULIO', 'MARZO', 'FEBRERO_MARZO', 'ESPECIAL', 'NO_RECUERDO']),
  format: z.enum(['ESCRITO', 'ORAL', 'MIXTO']),
  shift: z.enum(['MANANA', 'TARDE', 'NOCHE', 'NO_INDICO']).optional(),
  professorId: z.string().optional(),
  difficultyTheory: z.number().int().min(1).max(5),
  difficultyPractice: z.number().int().min(1).max(5),
  comment: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

const SESSION_OPTIONS: { value: ExamSession; label: string }[] = [
  { value: 'DICIEMBRE', label: examPeriodLabels.DICIEMBRE },
  { value: 'JULIO', label: examPeriodLabels.JULIO },
  { value: 'MARZO', label: examPeriodLabels.MARZO },
  { value: 'FEBRERO_MARZO', label: examPeriodLabels.FEBRERO_MARZO },
  { value: 'ESPECIAL', label: examPeriodLabels.ESPECIAL },
  { value: 'NO_RECUERDO', label: examPeriodLabels.NO_RECUERDO },
];

const FORMAT_OPTIONS: { value: ExamFormat; label: string }[] = [
  { value: 'ESCRITO', label: examFormatLabels.ESCRITO },
  { value: 'ORAL', label: examFormatLabels.ORAL },
  { value: 'MIXTO', label: examFormatLabels.MIXTO },
];

const SHIFT_OPTIONS: { value: Shift; label: string }[] = [
  { value: 'MANANA', label: shiftLabels.MANANA },
  { value: 'TARDE', label: shiftLabels.TARDE },
  { value: 'NOCHE', label: shiftLabels.NOCHE },
  { value: 'NO_INDICO', label: shiftLabels.NO_INDICO },
];

export function ExamForm() {
  const params = useParams<{ codigo: string }>();
  const code = params.codigo;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      session: 'NO_RECUERDO',
      format: 'ESCRITO',
      shift: 'NO_INDICO',
      difficultyTheory: 3,
      difficultyPractice: 3,
      comment: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/professors', { params: { page: 1, limit: 100 } })
      .then((res) => {
        const paginated = getData<{ data: Professor[] }>(res);
        if (!cancelled) setProfessors(paginated.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: ExamFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post(`/subjects/${code}/exams`, {
        year: values.year,
        session: values.session,
        format: values.format,
        shift: values.shift,
        professorId: values.professorId || undefined,
        difficultyTheory: values.difficultyTheory,
        difficultyPractice: values.difficultyPractice,
        comment: values.comment?.trim() || undefined,
      });
      addToast('¡Gracias por compartir tu experiencia!', 'success');
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
              Iniciá sesión para compartir tu experiencia de final.
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
            <span className={`${styles.headerLabel} font-pixel`}>FINAL</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>Contá tu experiencia de final</h1>
          <p className={styles.subtitle}>
            Ayudá a otros a saber cómo es la mesa antes de presentarse.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="year" className={styles.fieldLabel}>
                Año
              </label>
              <input
                id="year"
                type="number"
                className={styles.input}
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && <span className={styles.fieldError}>{errors.year.message}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="session" className={styles.fieldLabel}>
                Mesa
              </label>
              <select id="session" className={styles.select} {...register('session')}>
                {SESSION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Formato</span>
            <div className={styles.chipGroup}>
              {FORMAT_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.chip}>
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('format')}
                    className={styles.radio}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Turno (opcional)</span>
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
            <label htmlFor="professorId" className={styles.fieldLabel}>
              Profesor que tomó el final <span className={styles.optional}>(opcional)</span>
            </label>
            <select id="professorId" className={styles.select} {...register('professorId')}>
              <option value="">No indicar</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="difficultyTheory" className={styles.fieldLabel}>
                Dificultad teórica (1-5)
              </label>
              <input
                id="difficultyTheory"
                type="number"
                min={1}
                max={5}
                className={styles.input}
                {...register('difficultyTheory', { valueAsNumber: true })}
              />
              {errors.difficultyTheory && (
                <span className={styles.fieldError}>{errors.difficultyTheory.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="difficultyPractice" className={styles.fieldLabel}>
                Dificultad práctica (1-5)
              </label>
              <input
                id="difficultyPractice"
                type="number"
                min={1}
                max={5}
                className={styles.input}
                {...register('difficultyPractice', { valueAsNumber: true })}
              />
              {errors.difficultyPractice && (
                <span className={styles.fieldError}>{errors.difficultyPractice.message}</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="comment" className={styles.fieldLabel}>
              Comentario <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="comment"
              className={styles.textarea}
              placeholder="Contá cómo fue: qué tomaron, si fue difícil el teórico o el práctico..."
              rows={5}
              maxLength={2000}
              {...register('comment')}
            />
            {errors.comment && <span className={styles.fieldError}>{errors.comment.message}</span>}
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publicar experiencia
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ListPlus, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getData, getApiError } from '@/lib/apiHelpers';
import { Guide } from '@/types/guide';
import { Button, Input, useToast } from '@/components/ui';
import styles from './GuideCreateForm.module.css';

const stepSchema = z.object({
  title: z.string().min(1, 'El título del paso es obligatorio').max(100, 'Máximo 100 caracteres'),
  content: z.string().min(1, 'El contenido del paso es obligatorio'),
});

const guideSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  content: z.string().optional(),
  steps: z.array(stepSchema),
});

type GuideFormValues = z.infer<typeof guideSchema>;

export function GuideCreateForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      steps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps',
  });

  const onSubmit = async (values: GuideFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/guides', {
        title: values.title,
        description: values.description?.trim() || undefined,
        content: values.content?.trim() || undefined,
        isPublished: true,
      });
      const guide = getData<Guide>(res);

      for (const step of values.steps) {
        await api.post(`/guides/${guide.id}/steps`, {
          title: step.title,
          content: step.content,
        });
      }

      addToast('Guía creada correctamente', 'success');
      router.push(`/guias/${guide.slug}`);
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/guias" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a Guías
        </Link>

        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>NUEVA GUÍA</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>Crear guía</h1>
          <p className={styles.subtitle}>Comparte tu conocimiento paso a paso con la comunidad.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Información general</h2>

            <Input
              label="Título"
              placeholder="Ej: Cómo aprender TypeScript desde cero"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className={styles.field}>
              <label htmlFor="guide-description" className={styles.fieldLabel}>
                Descripción
              </label>
              <textarea
                id="guide-description"
                className={styles.textarea}
                placeholder="Resumen breve de lo que aprenderá quien lea la guía"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <span className={styles.fieldError}>{errors.description.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="guide-content" className={styles.fieldLabel}>
                Contenido introductorio
              </label>
              <textarea
                id="guide-content"
                className={styles.textarea}
                placeholder="Introducción, contexto o contenido principal de la guía"
                rows={5}
                {...register('content')}
              />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pasos de la guía</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => append({ title: '', content: '' })}
              >
                Agregar paso
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className={styles.emptySteps}>
                <ListPlus size={36} />
                <p>Aún no hay pasos. Agrega el primero para estructurar tu guía.</p>
              </div>
            ) : (
              <div className={styles.stepsList}>
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.stepCard}>
                    <div className={styles.stepHeader}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepLabel}>Paso {index + 1}</span>
                      <button
                        type="button"
                        className={styles.removeStep}
                        onClick={() => remove(index)}
                        aria-label={`Eliminar paso ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <Input
                      label="Título del paso"
                      placeholder="Ej: Instalación del entorno"
                      error={errors.steps?.[index]?.title?.message}
                      {...register(`steps.${index}.title`)}
                    />

                    <div className={styles.field}>
                      <label htmlFor={`step-${index}-content`} className={styles.fieldLabel}>
                        Contenido
                      </label>
                      <textarea
                        id={`step-${index}-content`}
                        className={styles.textarea}
                        placeholder="Explica el paso en detalle"
                        rows={4}
                        {...register(`steps.${index}.content`)}
                      />
                      {errors.steps?.[index]?.content && (
                        <span className={styles.fieldError}>
                          {errors.steps?.[index]?.content?.message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<Save size={18} />}
            >
              Publicar guía
            </Button>
            <Link href="/guias" className={styles.cancelLink}>
              <Button type="button" variant="ghost" size="lg" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

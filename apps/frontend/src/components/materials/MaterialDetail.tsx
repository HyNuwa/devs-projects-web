'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Pencil,
  Presentation,
  Sparkles,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { Material, MaterialRating, Paginated } from '@/types/material';
import { Subject } from '@/types/subject';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Modal, useToast } from '@/components/ui';
import styles from './MaterialDetail.module.css';

const RATINGS_LIMIT = 10;
const MODERATOR_ROLES = ['ADMIN', 'MODERATOR', 'SUPERADMIN'];

const ratingSchema = z.object({
  rating: z.number().int().min(1, 'Selecciona una puntuación').max(5),
  comment: z.string().max(500, 'El comentario no puede superar 500 caracteres').optional(),
});

type RatingFormData = z.infer<typeof ratingSchema>;

const editSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Selecciona una materia'),
});

type EditFormData = z.infer<typeof editSchema>;

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'pptx':
      return <Presentation size={34} />;
    case 'xls':
      return <FileSpreadsheet size={34} />;
    case 'md':
      return <FileCode size={34} />;
    case 'jpg':
    case 'png':
    case 'webp':
      return <ImageIcon size={34} />;
    default:
      return <FileText size={34} />;
  }
}

function formatFileSize(bytes: string) {
  const n = Number(bytes);
  if (Number.isNaN(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function RatingStars({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <div className={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= rounded ? styles.starFilled : styles.starEmpty} />
      ))}
    </div>
  );
}

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  subjects: Subject[];
  onSaved: () => void;
}

function EditMaterialModal({
  isOpen,
  onClose,
  material,
  subjects,
  onSaved,
}: EditMaterialModalProps) {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: material.title,
      description: material.description ?? '',
      subjectId: material.subjectId,
    },
  });

  const onSubmit = async (data: EditFormData) => {
    try {
      await api.patch(`/materials/${material.id}`, {
        title: data.title,
        description: data.description || null,
        subjectId: data.subjectId,
      });
      addToast('Material actualizado', 'success');
      onSaved();
      onClose();
    } catch (err) {
      addToast(getApiError(err), 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar material" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.editForm} noValidate>
        <Input label="Título *" error={errors.title?.message} {...register('title')} />

        <div className={styles.field}>
          <label htmlFor="edit-description" className={styles.fieldLabel}>
            Descripción
          </label>
          <textarea
            id="edit-description"
            className={styles.textarea}
            placeholder="Describe el contenido del material"
            {...register('description')}
          />
          {errors.description && (
            <span className={styles.fieldError}>{errors.description.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-subject" className={styles.fieldLabel}>
            Materia *
          </label>
          <select id="edit-subject" className={styles.select} {...register('subjectId')}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <span className={styles.fieldError}>{errors.subjectId.message}</span>
          )}
        </div>

        <div className={styles.editActions}>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Guardar cambios
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MaterialDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { addToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [ratings, setRatings] = useState<Paginated<MaterialRating> | null>(null);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMaterial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/materials/${id}`);
      setMaterial(getData<Material>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchRatings = useCallback(
    async (page: number) => {
      setRatingsLoading(true);
      try {
        const res = await api.get(`/materials/${id}/ratings`, {
          params: { page, limit: RATINGS_LIMIT },
        });
        setRatings(getData<Paginated<MaterialRating>>(res));
      } catch {
        addToast('No se pudieron cargar las valoraciones', 'error');
      } finally {
        setRatingsLoading(false);
      }
    },
    [id, addToast],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/materials/${id}`);
        if (!cancelled) {
          setMaterial(getData<Material>(res));
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/materials/${id}/ratings`, {
          params: { page: 1, limit: RATINGS_LIMIT },
        });
        if (!cancelled) setRatings(getData<Paginated<MaterialRating>>(res));
      } catch {
        if (!cancelled) addToast('No se pudieron cargar las valoraciones', 'error');
      } finally {
        if (!cancelled) setRatingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, addToast]);

  useEffect(() => {
    api
      .get('/subjects')
      .then((res) => setSubjects(getData<Subject[]>(res)))
      .catch(() => addToast('No se pudieron cargar las materias', 'error'));
  }, [addToast]);

  const handleRatingsPageChange = (next: number) => {
    setRatingsPage(next);
    fetchRatings(next);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/materials/${id}`);
      addToast('Material eliminado', 'success');
      router.push('/materiales');
    } catch (err) {
      addToast(getApiError(err), 'error');
      setIsDeleting(false);
    }
  };

  const canManage =
    material && user && (material.authorId === user.id || MODERATOR_ROLES.includes(user.role));

  const downloadUrl = `${api.defaults.baseURL ?? ''}/materials/${id}/download`;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Cargando material...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <FileText size={40} className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>Material no encontrado</h2>
            <p className={styles.stateText}>{error ?? 'El material no existe o fue eliminado.'}</p>
            <Link href="/materiales" className={styles.backLink}>
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Volver a materiales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avg = Number(material.avgRating) || 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/materiales" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a materiales
        </Link>

        {/* Main card */}
        <section className={styles.mainCard}>
          <div className={styles.filePanel}>
            {material.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={material.thumbnailUrl}
                alt={material.title}
                className={styles.thumbnailImage}
              />
            ) : (
              <div className={styles.fileIcon}>{getFileTypeIcon(material.fileType)}</div>
            )}
            <span className={styles.fileTypeBadge}>{material.fileType.toUpperCase()}</span>
            <div className={styles.fileInfo}>
              <span>{formatFileSize(material.fileSize)}</span>
              <span className={styles.fileDot}>•</span>
              <span>{material.downloadCount} descargas</span>
            </div>
          </div>

          <div className={styles.detailBody}>
            <div className={styles.subjectBadge}>{material.subject.name}</div>
            <h1 className={styles.title}>{material.title}</h1>

            <div className={styles.authorRow}>
              <div className={styles.avatar}>
                {material.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={material.author.avatarUrl} alt={material.author.username} />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>
                  {material.author.displayName || material.author.username}
                </span>
                <span className={styles.authorDate}>
                  <Calendar size={13} />
                  {formatDate(material.createdAt)}
                </span>
              </div>
            </div>

            {material.description && <p className={styles.description}>{material.description}</p>}

            <div className={styles.ratingSummary}>
              <div className={styles.ratingValue}>
                <span className={styles.ratingNumber}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
                <RatingStars value={avg} size={18} />
              </div>
              <span className={styles.ratingCount}>
                {material.ratingCount} {material.ratingCount === 1 ? 'valoración' : 'valoraciones'}
              </span>
            </div>

            <div className={styles.actions}>
              <a href={downloadUrl} className={styles.downloadLink}>
                <Button variant="primary" size="lg" leftIcon={<Download size={18} />}>
                  Descargar
                </Button>
              </a>
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Pencil size={18} />}
                    onClick={() => setIsEditOpen(true)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    leftIcon={<Trash2 size={18} />}
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Rating form */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Sparkles size={16} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Valora este material</h2>
          </div>
          {user ? (
            <RatingForm
              materialId={id}
              onRated={() => {
                fetchMaterial();
                fetchRatings(1);
              }}
            />
          ) : (
            <div className={styles.loginPrompt}>
              <p className={styles.loginText}>
                Inicia sesión para valorar este material y ayudar a la comunidad.
              </p>
              <Link href="/auth/login" className={styles.backLink}>
                <Button variant="primary" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Ratings list */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <MessageSquare size={16} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Valoraciones</h2>
          </div>

          {ratingsLoading && ratingsPage === 1 ? (
            <p className={styles.loadingText}>Cargando valoraciones...</p>
          ) : ratings && ratings.data.length > 0 ? (
            <>
              <div className={styles.ratingsList}>
                {ratings.data.map((rating) => (
                  <div key={rating.id} className={styles.ratingItem}>
                    <div className={styles.avatar}>
                      {rating.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rating.user.avatarUrl} alt={rating.user.username} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className={styles.ratingContent}>
                      <div className={styles.ratingHeader}>
                        <span className={styles.ratingAuthor}>
                          {rating.user.displayName || rating.user.username}
                        </span>
                        <span className={styles.ratingDate}>{formatDate(rating.createdAt)}</span>
                      </div>
                      <RatingStars value={rating.rating} size={14} />
                      {rating.comment && <p className={styles.ratingComment}>{rating.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {ratings.meta.totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ratingsPage <= 1}
                    onClick={() => handleRatingsPageChange(ratingsPage - 1)}
                  >
                    Anterior
                  </Button>
                  <span className={styles.pageInfo}>
                    Página {ratingsPage} de {ratings.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ratingsPage >= ratings.meta.totalPages}
                    onClick={() => handleRatingsPageChange(ratingsPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.emptyRatings}>
              Aún no hay valoraciones. ¡Sé el primero en valorar este material!
            </p>
          )}
        </section>
      </div>

      {/* Edit modal */}
      <EditMaterialModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        material={material}
        subjects={subjects}
        onSaved={fetchMaterial}
      />

      {/* Delete confirm modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar material"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Seguro que quieres eliminar este material? Esta acción no se puede deshacer.
        </p>
        <div className={styles.editActions}>
          <Button
            variant="danger"
            isLoading={isDeleting}
            leftIcon={<Trash2 size={16} />}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function RatingForm({ materialId, onRated }: { materialId: string; onRated: () => void }) {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const selectedRating = watch('rating');

  const onSubmit = async (data: RatingFormData) => {
    try {
      await api.post(`/materials/${materialId}/rate`, {
        rating: data.rating,
        comment: data.comment || undefined,
      });
      addToast('¡Gracias por tu valoración!', 'success');
      onRated();
    } catch (err) {
      addToast(getApiError(err), 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.ratingForm} noValidate>
      <div className={styles.starSelector}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.starBtn} ${value <= selectedRating ? styles.starBtnActive : ''}`}
            onClick={() => setValue('rating', value, { shouldValidate: true })}
            aria-label={`${value} estrellas`}
          >
            <Star size={30} />
          </button>
        ))}
      </div>
      {errors.rating && <span className={styles.fieldError}>{errors.rating.message}</span>}

      <textarea
        className={styles.textarea}
        placeholder="Cuéntale a la comunidad qué te pareció (opcional)"
        {...register('comment')}
      />
      {errors.comment && <span className={styles.fieldError}>{errors.comment.message}</span>}

      <div className={styles.ratingSubmit}>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Enviar valoración
        </Button>
      </div>
    </form>
  );
}

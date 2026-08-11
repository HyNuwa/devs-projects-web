'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Eye,
  ListOrdered,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getData, getApiError } from '@/lib/apiHelpers';
import { Guide, GuideStep } from '@/types/guide';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Modal, useToast } from '@/components/ui';
import styles from './GuideDetail.module.css';

type StepModalState = { mode: 'add' } | { mode: 'edit'; step: GuideStep } | null;

export function GuideDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();

  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit guide modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete guide modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Step modal
  const [stepModal, setStepModal] = useState<StepModalState>(null);
  const [stepTitle, setStepTitle] = useState('');
  const [stepContent, setStepContent] = useState('');
  const [isSavingStep, setIsSavingStep] = useState(false);

  const loadGuide = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/guides/${slug}`);
      setGuide(getData<Guide>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/guides/${slug}`);
        if (!cancelled) {
          setGuide(getData<Guide>(res));
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
  }, [slug]);

  const isAuthor = !!user && !!guide && guide.authorId === user.id;

  const openEdit = () => {
    if (!guide) return;
    setEditTitle(guide.title);
    setEditDescription(guide.description ?? '');
    setEditContent(guide.content ?? '');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!guide) return;
    if (editTitle.trim().length < 3) {
      addToast('El título debe tener al menos 3 caracteres', 'error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await api.patch(`/guides/${guide.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        content: editContent.trim() || null,
      });
      const updated = getData<Guide>(res);
      addToast('Guía actualizada', 'success');
      setIsEditOpen(false);
      if (updated.slug && updated.slug !== slug) {
        router.push(`/guias/${updated.slug}`);
      } else {
        await loadGuide();
      }
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!guide) return;
    setIsDeleting(true);
    try {
      await api.delete(`/guides/${guide.id}`);
      addToast('Guía eliminada', 'success');
      router.push('/guias');
    } catch (err) {
      addToast(getApiError(err), 'error');
      setIsDeleting(false);
    }
  };

  const openAddStep = () => {
    setStepTitle('');
    setStepContent('');
    setStepModal({ mode: 'add' });
  };

  const openEditStep = (step: GuideStep) => {
    setStepTitle(step.title);
    setStepContent(step.content);
    setStepModal({ mode: 'edit', step });
  };

  const handleSaveStep = async () => {
    if (!guide) return;
    if (!stepTitle.trim()) {
      addToast('El título del paso es obligatorio', 'error');
      return;
    }
    if (!stepContent.trim()) {
      addToast('El contenido del paso es obligatorio', 'error');
      return;
    }
    setIsSavingStep(true);
    try {
      if (stepModal?.mode === 'edit' && stepModal.step) {
        await api.patch(`/guides/${guide.id}/steps/${stepModal.step.id}`, {
          title: stepTitle.trim(),
          content: stepContent.trim(),
        });
        addToast('Paso actualizado', 'success');
      } else {
        await api.post(`/guides/${guide.id}/steps`, {
          title: stepTitle.trim(),
          content: stepContent.trim(),
        });
        addToast('Paso agregado', 'success');
      }
      setStepModal(null);
      await loadGuide();
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleDeleteStep = async (step: GuideStep) => {
    if (!guide) return;
    if (!window.confirm(`¿Eliminar el paso "${step.title}"?`)) return;
    try {
      await api.delete(`/guides/${guide.id}/steps/${step.id}`);
      addToast('Paso eliminado', 'success');
      await loadGuide();
    } catch (err) {
      addToast(getApiError(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="status" aria-live="polite">
            <div className={styles.spinner} />
            <p>Cargando guía...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state} role="alert">
            <ScrollText size={40} />
            <h3>No pudimos cargar la guía</h3>
            <p>{error || 'La guía no existe o fue eliminada.'}</p>
            <Link href="/guias">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
                Volver a Guías
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const authorName = guide.author.displayName || guide.author.username;
  const createdAt = new Date(guide.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const stepCount = guide.steps?.length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/guias" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a Guías
        </Link>

        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.headerBadge}>
              <Sparkles size={16} />
              <span className={`${styles.headerLabel} font-pixel`}>GUÍA</span>
              <Sparkles size={16} />
            </div>
            <h1 className={styles.title}>{guide.title}</h1>
            {guide.description && <p className={styles.description}>{guide.description}</p>}

            <div className={styles.meta}>
              <div className={styles.author}>
                <div className={styles.avatar}>
                  {guide.author.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={guide.author.avatarUrl} alt={authorName} />
                  ) : (
                    <span>{authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className={styles.authorName}>{authorName}</span>
              </div>
              <div className={styles.metaItem}>
                <Calendar size={15} />
                <span>{createdAt}</span>
              </div>
              <div className={styles.metaItem}>
                <Eye size={15} />
                <span>{guide.viewCount} vistas</span>
              </div>
            </div>

            {isAuthor && (
              <div className={styles.authorActions}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil size={16} />}
                  onClick={openEdit}
                >
                  Editar guía
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Eliminar
                </Button>
              </div>
            )}
          </header>

          {guide.content && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contenido</h2>
              <div className={styles.content}>{guide.content}</div>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <ListOrdered size={20} />
                Pasos ({stepCount})
              </h2>
              {isAuthor && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  onClick={openAddStep}
                >
                  Agregar paso
                </Button>
              )}
            </div>

            {guide.steps && guide.steps.length > 0 ? (
              <ol className={styles.stepsList}>
                {guide.steps.map((step) => (
                  <li key={step.id} className={styles.step}>
                    <div className={styles.stepNumber}>{step.stepOrder}</div>
                    <div className={styles.stepBody}>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <div className={styles.stepContent}>{step.content}</div>
                      {isAuthor && (
                        <div className={styles.stepActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil size={14} />}
                            onClick={() => openEditStep(step)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => handleDeleteStep(step)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.emptySteps}>
                <ListOrdered size={36} />
                <p>Esta guía aún no tiene pasos.</p>
              </div>
            )}
          </section>
        </article>
      </div>

      {/* Edit guide modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar guía" size="lg">
        <div className={styles.modalForm}>
          <Input label="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <div className={styles.field}>
            <label htmlFor="edit-description" className={styles.fieldLabel}>
              Descripción
            </label>
            <textarea
              id="edit-description"
              className={styles.textarea}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="edit-content" className={styles.fieldLabel}>
              Contenido
            </label>
            <textarea
              id="edit-content"
              className={styles.textarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              variant="primary"
              isLoading={isSavingEdit}
              leftIcon={<Save size={16} />}
              onClick={handleSaveEdit}
            >
              Guardar cambios
            </Button>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step modal */}
      <Modal
        isOpen={stepModal !== null}
        onClose={() => setStepModal(null)}
        title={stepModal?.mode === 'edit' ? 'Editar paso' : 'Agregar paso'}
        size="md"
      >
        <div className={styles.modalForm}>
          <Input
            label="Título del paso"
            value={stepTitle}
            onChange={(e) => setStepTitle(e.target.value)}
          />
          <div className={styles.field}>
            <label htmlFor="step-content" className={styles.fieldLabel}>
              Contenido
            </label>
            <textarea
              id="step-content"
              className={styles.textarea}
              value={stepContent}
              onChange={(e) => setStepContent(e.target.value)}
              rows={5}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              variant="primary"
              isLoading={isSavingStep}
              leftIcon={<Save size={16} />}
              onClick={handleSaveStep}
            >
              {stepModal?.mode === 'edit' ? 'Guardar cambios' : 'Agregar paso'}
            </Button>
            <Button variant="ghost" onClick={() => setStepModal(null)} disabled={isSavingStep}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar guía"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>¿Seguro que quieres eliminar esta guía? Esta acción no se puede deshacer.</p>
          <div className={styles.modalActions}>
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
        </div>
      </Modal>
    </div>
  );
}

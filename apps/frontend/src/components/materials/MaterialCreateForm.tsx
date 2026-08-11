'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { FileUp, Sparkles, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { Material } from '@/types/material';
import { Subject } from '@/types/subject';
import { Button, Input, useToast } from '@/components/ui';
import styles from './MaterialCreateForm.module.css';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'pptx', 'xls', 'txt', 'md', 'jpg', 'png', 'webp'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const materialSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Selecciona una materia'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialCreateForm() {
  const router = useRouter();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
  });

  useEffect(() => {
    api
      .get('/subjects')
      .then((res) => setSubjects(getData<Subject[]>(res)))
      .catch(() => addToast('No se pudieron cargar las materias', 'error'));
  }, [addToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        `Tipo de archivo no permitido. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFileError('El archivo supera el tamaño máximo de 25MB');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
  };

  const onSubmit = async (data: MaterialFormData) => {
    if (!file) {
      setFileError('Selecciona un archivo para subir');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('subjectId', data.subjectId);

      const res = await api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const material = getData<Material>(res);
      addToast('Material subido', 'success');
      router.push(`/materiales/${material.id}`);
    } catch (err) {
      addToast(getApiError(err), 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>NUEVO RECURSO</span>
            <Sparkles size={16} />
          </div>
          <h1 className={`${styles.title} font-pixel`}>AÑADE AL BAÚL</h1>
          <p className={styles.subtitle}>
            Comparte apuntes, libros o presentaciones con la comunidad
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* File dropzone */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Archivo *</label>
            {file ? (
              <div className={styles.fileSelected}>
                <div className={styles.fileSelectedIcon}>
                  <FileUp size={22} />
                </div>
                <div className={styles.fileSelectedInfo}>
                  <span className={styles.fileSelectedName}>{file.name}</span>
                  <span className={styles.fileSelectedSize}>{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className={styles.fileRemoveBtn}
                  onClick={clearFile}
                  aria-label="Quitar archivo"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className={styles.dropzone}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.pptx,.xls,.txt,.md,.jpg,.png,.webp"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
                <Upload size={28} className={styles.dropzoneIcon} />
                <span className={styles.dropzoneTitle}>Arrastra tu archivo o haz clic</span>
                <span className={styles.dropzoneHint}>
                  PDF, DOC, DOCX, PPTX, XLS, TXT, MD, JPG, PNG, WEBP · máx. 25MB
                </span>
              </label>
            )}
            {fileError && <span className={styles.fieldError}>{fileError}</span>}
          </div>

          <Input
            label="Título *"
            placeholder="Ej: Apuntes de Cálculo I - Primer parcial"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className={styles.field}>
            <label htmlFor="material-description" className={styles.fieldLabel}>
              Descripción
            </label>
            <textarea
              id="material-description"
              className={styles.textarea}
              placeholder="Describe el contenido del material, temas que cubre, etc."
              {...register('description')}
            />
            {errors.description && (
              <span className={styles.fieldError}>{errors.description.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="material-subject" className={styles.fieldLabel}>
              Materia *
            </label>
            <select
              id="material-subject"
              className={styles.select}
              defaultValue=""
              {...register('subjectId')}
            >
              <option value="" disabled>
                Selecciona una materia
              </option>
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

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<Upload size={18} />}
            >
              Subir material
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => router.push('/materiales')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

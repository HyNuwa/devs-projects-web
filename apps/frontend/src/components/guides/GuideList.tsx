'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListOrdered,
  Plus,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getData, getApiError } from '@/lib/apiHelpers';
import { Guide } from '@/types/guide';
import { Paginated, PaginationMeta } from '@/types/material';
import { Button } from '@/components/ui';
import styles from './GuideList.module.css';

const PAGE_SIZE = 9;

interface GuideListProps {
  title: string;
}

export function GuideList({ title }: GuideListProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGuides = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/guides', {
        params: { page: targetPage, limit: PAGE_SIZE },
      });
      const data = getData<Paginated<Guide>>(res);
      setGuides(data.data);
      setMeta(data.meta);
      setPage(targetPage);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/guides', {
          params: { page: 1, limit: PAGE_SIZE },
        });
        const data = getData<Paginated<Guide>>(res);
        if (!cancelled) {
          setGuides(data.data);
          setMeta(data.meta);
          setPage(1);
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
  }, []);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <div className={styles.headerBadge}>
                <Sparkles size={16} />
                <span className={`${styles.headerLabel} font-pixel`}>GUÍAS & CURSOS</span>
                <Sparkles size={16} />
              </div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>
                Rutas de aprendizaje y guías paso a paso creadas por la comunidad.
              </p>
            </div>
            <Link href="/guias/nuevo" className={styles.createLink}>
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Nueva guía
              </Button>
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className={styles.state} role="status" aria-live="polite">
            <div className={styles.spinner} />
            <p>Cargando guías...</p>
          </div>
        ) : error ? (
          <div className={styles.state} role="alert">
            <ScrollText size={40} />
            <h3>No pudimos cargar las guías</h3>
            <p>{error}</p>
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => loadGuides(page)}
            >
              Reintentar
            </Button>
          </div>
        ) : guides.length === 0 ? (
          <div className={styles.state}>
            <BookOpen size={40} />
            <h3>Aún no hay guías</h3>
            <p>Sé el primero en compartir una guía con la comunidad.</p>
            <Link href="/guias/nuevo">
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Crear la primera guía
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Paginación">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  disabled={page <= 1 || isLoading}
                  onClick={() => loadGuides(page - 1)}
                >
                  Anterior
                </Button>
                <span className={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  disabled={page >= totalPages || isLoading}
                  onClick={() => loadGuides(page + 1)}
                >
                  Siguiente
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const authorName = guide.author.displayName || guide.author.username;
  const stepCount = guide._count?.steps ?? 0;

  return (
    <Link href={`/guias/${guide.slug}`} className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          <BookOpen size={22} />
        </div>
        <h3 className={styles.cardTitle}>{guide.title}</h3>
      </div>

      {guide.description && <p className={styles.cardDescription}>{guide.description}</p>}

      <div className={styles.cardFooter}>
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

        <div className={styles.stats}>
          <div className={styles.stat} title={`${stepCount} pasos`}>
            <ListOrdered size={15} />
            <span>{stepCount}</span>
          </div>
          <div className={styles.stat} title={`${guide.viewCount} vistas`}>
            <Eye size={15} />
            <span>{guide.viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

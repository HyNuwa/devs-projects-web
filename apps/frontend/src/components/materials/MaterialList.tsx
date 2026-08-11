'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  PackageOpen,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { Material, Paginated } from '@/types/material';
import { Subject } from '@/types/subject';
import { Button, useToast } from '@/components/ui';
import styles from './MaterialList.module.css';

const PAGE_SIZE = 9;

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'pptx':
      return <Presentation size={30} />;
    case 'xls':
      return <FileSpreadsheet size={30} />;
    case 'md':
      return <FileCode size={30} />;
    case 'jpg':
    case 'png':
    case 'webp':
      return <ImageIcon size={30} />;
    default:
      return <FileText size={30} />;
  }
}

function MaterialCard({ material }: { material: Material }) {
  const avg = Number(material.avgRating) || 0;

  return (
    <Link href={`/materiales/${material.id}`} className={styles.card}>
      <div className={styles.thumbnail}>
        {material.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.thumbnailUrl} alt={material.title} className={styles.thumbnailImage} />
        ) : (
          <div className={styles.thumbnailIcon}>{getFileTypeIcon(material.fileType)}</div>
        )}
        <span className={styles.fileTypeBadge}>{material.fileType.toUpperCase()}</span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{material.title}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.author}>
            {material.author.displayName || material.author.username}
          </span>
          <span className={styles.subject}>{material.subject.name}</span>
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.rating}>
            <Star size={14} className={styles.starIcon} />
            <span className={styles.ratingValue}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
            <span className={styles.ratingCount}>({material.ratingCount})</span>
          </div>
          <div className={styles.downloads}>
            <Download size={14} />
            <span>{material.downloadCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className={`${styles.card} ${styles.skeletonCard}`}>
      <div className={`${styles.thumbnail} ${styles.skeletonBlock}`} />
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonFooter}`} />
      </div>
    </div>
  );
}

export function MaterialList() {
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Material> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/materials', {
        params: {
          ...(subjectId ? { subjectId } : {}),
          ...(search ? { search } : {}),
          page,
          limit: PAGE_SIZE,
        },
      });
      setData(getData<Paginated<Material>>(res));
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [subjectId, search, page, addToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/materials', {
          params: {
            ...(subjectId ? { subjectId } : {}),
            ...(search ? { search } : {}),
            page,
            limit: PAGE_SIZE,
          },
        });
        if (!cancelled) {
          setData(getData<Paginated<Material>>(res));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = getApiError(err);
          setError(message);
          addToast(message, 'error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, search, page, addToast]);

  useEffect(() => {
    api
      .get('/subjects')
      .then((res) => setSubjects(getData<Subject[]>(res)))
      .catch(() => addToast('No se pudieron cargar las materias', 'error'));
  }, [addToast]);

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = data?.meta.totalPages ?? 1;
  const isEmpty = !isLoading && !error && data && data.data.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>APUNTES & MATERIAL</span>
            <Sparkles size={16} />
          </div>
          <h1 className={`${styles.title} font-pixel`}>BAÚL DE RECURSOS</h1>
          <p className={styles.subtitle}>
            Descubre apuntes, libros y presentaciones compartidos por la comunidad
          </p>
        </header>

        {/* Filters */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <select
              className={styles.select}
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              aria-label="Filtrar por materia"
            >
              <option value="">Todas las materias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar material..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Buscar material"
              />
              <button type="submit" className={styles.searchBtn}>
                Buscar
              </button>
            </form>
          </div>

          <Link href="/materiales/nuevo" className={styles.uploadLink}>
            <Button variant="primary" leftIcon={<Plus size={18} />}>
              Subir material
            </Button>
          </Link>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className={styles.stateBox}>
            <PackageOpen size={40} className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>¡Ups! Algo salió mal</h2>
            <p className={styles.stateText}>{error}</p>
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchMaterials}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className={styles.stateBox}>
            <PackageOpen size={40} className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>No se encontraron materiales</h2>
            <p className={styles.stateText}>
              Prueba con otros filtros o sé el primero en compartir un recurso.
            </p>
            <Link href="/materiales/nuevo" className={styles.uploadLink}>
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                Subir el primer material
              </Button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && data && data.data.length > 0 && (
          <div className={styles.grid}>
            {data.data.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && data && data.data.length > 0 && totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

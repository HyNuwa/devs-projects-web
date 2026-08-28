'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { ModeratedMaterial } from '@/types/material';
import styles from './MySubmissions.module.css';

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: {
    label: 'En revisión',
    icon: <Clock size={14} />,
    className: 'pending',
  },
  APPROVED: {
    label: 'Aprobado',
    icon: <CheckCircle2 size={14} />,
    className: 'approved',
  },
  REJECTED: {
    label: 'Rechazado',
    icon: <XCircle size={14} />,
    className: 'rejected',
  },
};

export function MySubmissions() {
  const [materials, setMaterials] = useState<ModeratedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/materials/mine');
        if (!cancelled) setMaterials(getData<ModeratedMaterial[]>(res));
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

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Mis subidas</h2>

      {isLoading ? (
        <div className={styles.state}>
          <Loader2 size={24} className={styles.spinner} />
          <p>Cargando tus aportes...</p>
        </div>
      ) : error ? (
        <div className={styles.state}>
          <p className={styles.errorText}>{error}</p>
        </div>
      ) : materials.length === 0 ? (
        <div className={styles.state}>
          <FileText size={28} className={styles.emptyIcon} />
          <p>Aún no subiste ningún material.</p>
          <Link href="/materiales/nuevo" className={styles.cta}>
            Subir mi primer aporte
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {materials.map((m) => {
            const meta = STATUS_META[m.moderationStatus] ?? STATUS_META.PENDING;
            return (
              <div key={m.id} className={styles.item}>
                <div className={styles.itemIcon}>
                  <FileText size={20} />
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemTitle}>{m.title}</span>
                    <span className={`${styles.status} ${styles[meta.className]}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <span className={styles.itemMeta}>{m.subject?.name ?? 'Sin materia'}</span>
                  {m.moderationStatus === 'REJECTED' && m.moderationReason && (
                    <p className={styles.reason}>Motivo: {m.moderationReason}</p>
                  )}
                  {m.moderationStatus === 'APPROVED' && (
                    <Link href={`/materiales/${m.id}`} className={styles.viewLink}>
                      Ver material
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

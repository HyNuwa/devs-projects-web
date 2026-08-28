'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Loader2, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';
import { ModeratedMaterial } from '@/types/material';
import { Button, useToast } from '@/components/ui';
import styles from './ModerationPanel.module.css';

export function ModerationPanel() {
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();
  const [pending, setPending] = useState<ModeratedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const isModerator =
    user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'SUPERADMIN';

  const loadPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/materials/pending');
      setPending(getData<ModeratedMaterial[]>(res));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/materials/pending');
        if (!cancelled) setPending(getData<ModeratedMaterial[]>(res));
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

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/materials/${id}/approve`);
      addToast('Material aprobado', 'success');
      setPending((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      addToast('Escribí un motivo para el rechazo', 'error');
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/materials/${id}/reject`, { reason });
      addToast('Material rechazado', 'success');
      setPending((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!isModerator) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <ShieldCheck size={40} className={styles.stateIcon} />
            <p className={styles.stateText}>
              Necesitás permisos de moderador para acceder a este panel.
            </p>
            <Link href="/" className={styles.backLink}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={16} />
            <span className={`${styles.headerLabel} font-pixel`}>MODERACIÓN</span>
            <Sparkles size={16} />
          </div>
          <h1 className={styles.title}>Materiales en revisión</h1>
          <p className={styles.subtitle}>Revisá los aportes pendientes y aprobalos o rechazalos.</p>
        </header>

        {isLoading ? (
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Cargando pendientes...</p>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error}</p>
            <Button variant="outline" onClick={loadPending}>
              Reintentar
            </Button>
          </div>
        ) : pending.length === 0 ? (
          <div className={styles.stateBox}>
            <CheckCircle2 size={40} className={styles.stateIcon} />
            <p className={styles.stateText}>No hay materiales pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div className={styles.list}>
            {pending.map((m) => (
              <div key={m.id} className={styles.item}>
                <div className={styles.itemIcon}>
                  <FileText size={22} />
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemTitle}>{m.title}</span>
                    <span className={styles.itemType}>{m.fileType?.toUpperCase()}</span>
                  </div>
                  <span className={styles.itemMeta}>
                    {m.subject?.name} · {m.author?.displayName || m.author?.username}
                  </span>
                  {m.description && <p className={styles.itemDesc}>{m.description}</p>}

                  <div className={styles.actions}>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={busyId === m.id}
                      leftIcon={<CheckCircle2 size={16} />}
                      onClick={() => handleApprove(m.id)}
                    >
                      Aprobar
                    </Button>
                    <div className={styles.rejectGroup}>
                      <input
                        type="text"
                        placeholder="Motivo del rechazo..."
                        value={rejectReason[m.id] ?? ''}
                        onChange={(e) =>
                          setRejectReason((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        className={styles.rejectInput}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={busyId === m.id}
                        leftIcon={<XCircle size={16} />}
                        onClick={() => handleReject(m.id)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

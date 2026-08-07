'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui';
import styles from './VerifyEmail.module.css';

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing';

interface VerifyState {
  status: VerifyStatus;
  errorMessage: string | null;
}

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>(() => ({
    status: token ? 'loading' : 'missing',
    errorMessage: null,
  }));

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) {
          setState({ status: 'success', errorMessage: null });
          addToast('Email verificado correctamente', 'success');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setState({
          status: 'error',
          errorMessage: message || 'El enlace de verificación es inválido o ha expirado.',
        });
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, addToast]);

  const { status, errorMessage } = state;

  const content: Record<
    VerifyStatus,
    { tag: string; title: string; message: string; icon: React.ReactNode; tone: string }
  > = {
    loading: {
      tag: 'PROCESANDO',
      title: 'Verificando tu email',
      message: 'Estamos confirmando tu cuenta. Esto tomará solo unos segundos...',
      icon: <span className={styles.spinner} aria-hidden="true" />,
      tone: 'loading',
    },
    success: {
      tag: 'MISIÓN COMPLETADA',
      title: 'Email verificado correctamente',
      message: 'Tu cuenta está lista. Ya puedes iniciar sesión y unirte a la aventura.',
      icon: <CheckCircle2 size={36} strokeWidth={2.5} aria-hidden="true" />,
      tone: 'success',
    },
    error: {
      tag: 'ERROR',
      title: 'No pudimos verificar tu email',
      message: errorMessage || 'El enlace de verificación es inválido o ha expirado.',
      icon: <AlertCircle size={36} strokeWidth={2.5} aria-hidden="true" />,
      tone: 'error',
    },
    missing: {
      tag: 'ENLACE INVÁLIDO',
      title: 'Enlace inválido o incompleto',
      message:
        'El enlace de verificación no contiene un token válido. Revisa tu bandeja de entrada y vuelve a intentarlo.',
      icon: <AlertTriangle size={36} strokeWidth={2.5} aria-hidden="true" />,
      tone: 'missing',
    },
  };

  const current = content[status];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card} role="status" aria-live="polite">
        <div className={`${styles.iconBadge} ${styles[current.tone]}`}>{current.icon}</div>
        <h1 className={styles.title}>{current.title}</h1>
        <p className={styles.message}>{current.message}</p>

        <span className={`${styles.pixelTag} ${styles[current.tone]}`}>{current.tag}</span>

        {status !== 'loading' && (
          <Link href="/auth/login" className={styles.button}>
            Ir a Iniciar Sesión
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

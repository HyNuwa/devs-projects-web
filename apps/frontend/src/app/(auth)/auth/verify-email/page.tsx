import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmail } from '@/components/auth/VerifyEmail';
import styles from '@/components/auth/VerifyEmail.module.css';

export const metadata: Metadata = {
  title: 'Verificar Email - DevsProject',
  description: 'Verifica tu email en DevsProject',
};

function VerifyEmailFallback() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={`${styles.iconBadge} ${styles.loading}`}>
          <span className={styles.spinner} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Verificando tu email</h1>
        <p className={styles.message}>
          Estamos confirmando tu cuenta. Esto tomará solo unos segundos...
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmail />
    </Suspense>
  );
}

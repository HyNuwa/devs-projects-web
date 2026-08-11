import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import styles from '@/components/auth/ForgotPasswordForm.module.css';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña - DevsProject',
  description: 'Recupera tu contraseña en DevsProject',
};

function ForgotPasswordFallback() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.form}>
        <h1 className={styles.title}>Recuperar Contraseña</h1>
        <p className={styles.switch}>Cargando...</p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import styles from '@/components/auth/ResetPasswordForm.module.css';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña - DevsProject',
  description: 'Restablece tu contraseña en DevsProject',
};

function ResetPasswordFallback() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.form}>
        <h1 className={styles.title}>Restablecer Contraseña</h1>
        <p className={styles.switch}>Cargando...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

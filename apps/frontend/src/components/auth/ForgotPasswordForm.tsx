'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui';
import { api } from '@/lib/api';
import styles from './ForgotPasswordForm.module.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { addToast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      addToast(message || 'Error al enviar el correo de recuperación', 'error');
    }
  };

  if (submitted) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.form}>
          <h1 className={styles.title}>Revisá tu email</h1>
          <div className={styles.success}>
            Si el email existe, recibirás instrucciones para restablecer tu contraseña.
          </div>
          <a href="/auth/login" className={styles.submitLink}>
            Volver a Iniciar Sesión
          </a>
          <p className={styles.switch}>
            ¿Ya tienes cuenta?{' '}
            <a href="/auth/login" className={styles.link}>
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <h1 className={styles.title}>Recuperar Contraseña</h1>
        <p className={styles.subtitle}>
          Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
        </p>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="tu@email.com"
            {...register('email')}
          />
          {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
        </button>

        <p className={styles.switch}>
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" className={styles.link}>
            Iniciar sesión
          </a>
        </p>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui';
import { api } from '@/lib/api';
import styles from './ResetPasswordForm.module.css';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        'Debe contener mayúscula, minúscula, número y carácter especial',
      ),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.form}>
          <h1 className={styles.title}>Enlace inválido</h1>
          <div className={styles.error}>
            El enlace de restablecimiento de contraseña es inválido o ha expirado. Solicita uno
            nuevo para continuar.
          </div>
          <a href="/auth/forgot-password" className={styles.submitLink}>
            Solicitar nuevo enlace
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

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      addToast('Contraseña actualizada correctamente', 'success');
      router.push('/auth/login');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      addToast(message || 'Error al restablecer la contraseña', 'error');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <h1 className={styles.title}>Restablecer Contraseña</h1>

        {serverError && <div className={styles.error}>{serverError}</div>}

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
          )}
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
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

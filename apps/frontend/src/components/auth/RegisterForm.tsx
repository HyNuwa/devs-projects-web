'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import styles from './RegisterForm.module.css';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(30, 'Máximo 30 caracteres'),
    email: z.string().email('Email inválido'),
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

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      router.push('/');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setServerError(message || 'Error al registrarse');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h1 className={styles.title}>Crear Cuenta</h1>

      {serverError && <div className={styles.error}>{serverError}</div>}

      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          className={styles.input}
          placeholder="john_doe"
          {...registerField('username')}
        />
        {errors.username && <span className={styles.fieldError}>{errors.username.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          className={styles.input}
          placeholder="tu@email.com"
          {...registerField('email')}
        />
        {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className={styles.input}
          placeholder="••••••••"
          {...registerField('password')}
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
          {...registerField('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
      </button>

      <p className={styles.switch}>
        ¿Ya tienes cuenta?{' '}
        <a href="/auth/login" className={styles.link}>
          Iniciar sesión
        </a>
      </p>
    </form>
  );
}

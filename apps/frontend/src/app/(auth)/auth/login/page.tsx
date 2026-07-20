import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - DevsProject',
  description: 'Inicia sesión en DevsProject',
};

export default function LoginPage() {
  return <LoginForm />;
}

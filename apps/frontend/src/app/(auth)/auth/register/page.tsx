import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrarse - DevsProject',
  description: 'Crea tu cuenta en DevsProject',
};

export default function RegisterPage() {
  return <RegisterForm />;
}

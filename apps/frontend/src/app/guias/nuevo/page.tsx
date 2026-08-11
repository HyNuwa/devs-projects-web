import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GuideCreateForm } from '@/components/guides/GuideCreateForm';

export const metadata: Metadata = {
  title: 'Nueva Guía - DevsProject',
  description: 'Crea una nueva guía paso a paso en DevsProject',
};

export default function NuevaGuiaPage() {
  return (
    <AuthGuard>
      <GuideCreateForm />
    </AuthGuard>
  );
}

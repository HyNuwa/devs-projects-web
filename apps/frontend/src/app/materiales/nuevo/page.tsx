import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MaterialCreateForm } from '@/components/materials/MaterialCreateForm';

export const metadata: Metadata = {
  title: 'Subir Material - DevsProject',
  description: 'Comparte apuntes, libros y presentaciones con la comunidad',
};

export default function NuevoMaterialPage() {
  return (
    <AuthGuard>
      <MaterialCreateForm />
    </AuthGuard>
  );
}

import type { Metadata } from 'next';
import { MaterialList } from '@/components/materials/MaterialList';

export const metadata: Metadata = {
  title: 'Apuntes & Material - DevsProject',
  description: 'Explora y descarga apuntes, libros y presentaciones compartidos por la comunidad',
};

export default function MaterialesPage() {
  return <MaterialList />;
}

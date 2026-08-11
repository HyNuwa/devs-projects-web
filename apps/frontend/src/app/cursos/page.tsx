import type { Metadata } from 'next';
import { GuideList } from '@/components/guides/GuideList';

export const metadata: Metadata = {
  title: 'Cursos y Rutas - DevsProject',
  description: 'Cursos y rutas de aprendizaje creadas por la comunidad de DevsProject',
};

export default function CursosPage() {
  return <GuideList title="Cursos y rutas de aprendizaje" />;
}

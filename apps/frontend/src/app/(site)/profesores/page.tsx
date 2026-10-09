import type { Metadata } from 'next';
import { ProfessorList } from '@/components/professors/ProfessorList';

export const metadata: Metadata = {
  title: 'Profesores - DevsProject',
  description:
    'Explora y puntúa a tus profesores. Ayuda a la comunidad con tu experiencia académica.',
};

export default function ProfesoresPage() {
  return <ProfessorList />;
}

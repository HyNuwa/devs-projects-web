import type { Metadata } from 'next';
import { ProfessorDetail } from '@/components/professors/ProfessorDetail';

export const metadata: Metadata = {
  title: 'Detalle de Profesor - DevsProject',
  description: 'Valoraciones y detalles de un profesor de la comunidad.',
};

export default async function ProfessorDetailPage() {
  return <ProfessorDetail />;
}

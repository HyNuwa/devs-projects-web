import type { Metadata } from 'next';
import { SubjectList } from '@/components/subjects/SubjectList';

export const metadata: Metadata = {
  title: 'Materias - DevsProject',
  description: 'Explorá el plan de estudio, reseñas de cursada y experiencias de final por materia',
};

export default function MateriasPage() {
  return <SubjectList />;
}

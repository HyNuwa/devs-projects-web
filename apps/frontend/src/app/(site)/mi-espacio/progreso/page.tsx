import type { Metadata } from 'next';

import { ProgressPage } from '@/components/progress/ProgressPage';

export const metadata: Metadata = {
  title: 'Tu progreso - DevsProject',
  description: 'Tu nivel, tus puntos y cómo los ganaste.',
};

export default function TuProgresoPage() {
  return <ProgressPage />;
}

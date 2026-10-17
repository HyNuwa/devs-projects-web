import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RankingPage } from '@/components/ranking/RankingPage';

export const metadata: Metadata = {
  title: 'Rankings - DevsProject',
  description:
    'Quién más ayudó este mes en cada carrera y las leyendas de cada facultad de DevsProject.',
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RankingPage />
    </Suspense>
  );
}

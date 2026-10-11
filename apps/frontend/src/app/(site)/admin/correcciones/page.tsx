import type { Metadata } from 'next';

import { CorrectionsPanel } from '@/components/corrections/CorrectionsPanel';

export const metadata: Metadata = {
  title: 'Moderación · Correcciones - DevsProject',
  description: 'Correcciones de clasificación que sus autores no decidieron',
};

export default function ModerationCorrectionsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      <CorrectionsPanel />
    </div>
  );
}

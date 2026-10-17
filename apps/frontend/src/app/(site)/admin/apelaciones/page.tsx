import type { Metadata } from 'next';

import { AppealsPanel } from '@/components/moderation/AppealsPanel';

export const metadata: Metadata = {
  title: 'Moderación · Apelaciones - DevsProject',
  description: 'Apelaciones de retiros y sanciones para resolver',
};

export default function ModerationAppealsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      <AppealsPanel />
    </div>
  );
}

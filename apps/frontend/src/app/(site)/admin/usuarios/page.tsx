import type { Metadata } from 'next';

import { UsersPanel } from '@/components/moderation/UsersPanel';

export const metadata: Metadata = {
  title: 'Moderación · Usuarios - DevsProject',
  description: 'Cuentas con sanciones, sugerencias o revisión previa',
};

export default function ModerationUsersPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      <UsersPanel />
    </div>
  );
}

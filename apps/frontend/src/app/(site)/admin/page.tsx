import type { Metadata } from 'next';

import { CommunityModerationPanel } from '@/components/admin/CommunityModerationPanel';
import { ModerationPanel } from '@/components/admin/ModerationPanel';

export const metadata: Metadata = {
  title: 'Moderación - DevsProject',
  description: 'Panel de moderación de materiales',
};

export default function AdminPage() {
  return (
    <div className="grid gap-8">
      <ModerationPanel />
      <CommunityModerationPanel />
    </div>
  );
}

import type { Metadata } from 'next';
import { ModerationPanel } from '@/components/admin/ModerationPanel';

export const metadata: Metadata = {
  title: 'Moderación - DevsProject',
  description: 'Panel de moderación de materiales',
};

export default function AdminPage() {
  return <ModerationPanel />;
}

import type { Metadata } from 'next';
import { ProfilePage } from '@/components/profile/ProfilePage';

export const metadata: Metadata = {
  title: 'Mi Perfil - DevsProject',
  description: 'Gestiona tu perfil de aventurero en DevsProject',
};

export default function ProfileMePage() {
  return <ProfilePage />;
}

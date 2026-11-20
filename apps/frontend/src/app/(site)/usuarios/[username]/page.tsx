import type { Metadata } from 'next';

import { PublicProfilePage } from '@/components/public-profile/PublicProfilePage';

export const metadata: Metadata = {
  title: 'Perfil - DevsProject',
  description: 'Nivel, insignias y aportes de un estudiante de la comunidad.',
};

export default async function UsuarioPage({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  let username = raw;
  try {
    username = decodeURIComponent(raw);
  } catch {
    // A malformed escape: look the segment up as it came.
  }
  return <PublicProfilePage key={username} username={username} />;
}

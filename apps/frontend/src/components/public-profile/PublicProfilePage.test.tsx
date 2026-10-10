import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getProfileContributions,
  getPublicProfile,
  type ContributionItem,
  type PublicProfile,
} from '@/lib/profile-client';

import { PublicProfilePage } from './PublicProfilePage';

vi.mock('@/lib/profile-client', () => ({
  getPublicProfile: vi.fn(),
  getProfileContributions: vi.fn(),
}));
vi.mock('@/components/discovery/MaterialPreviewDialog', () => ({
  MaterialPreviewDialog: ({ file }: { file: { title: string } }) => (
    <div role="dialog">Vista previa de {file.title}</div>
  ),
}));

const badge = (slug: string, name: string, tier: PublicProfile['badges'][number]['tier']) => ({
  slug,
  name,
  rarity: 'COMUN',
  tier,
  edition: 0,
});

const item = (type: ContributionItem['type'], id: string, title: string): ContributionItem => ({
  type,
  id,
  title,
  subject: { code: 'ALG', name: 'Álgebra' },
  createdAt: '2026-05-01T00:00:00.000Z',
  fileType: type === 'MATERIAL' ? 'pdf' : null,
  academicYear: type === 'MATERIAL' ? 2025 : null,
});

function profile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id: 'u-1',
    username: 'vale',
    displayName: 'Vale',
    bio: 'Estudio Informática.',
    memberSince: '2026-03',
    avatarUrl: null,
    avatarCat: 'gato-lentes',
    customization: {
      accent: 'coral',
      background: 'pixel',
      frame: 'marco-legendario',
      banner: 'banner-biblioteca',
      theme: null,
    },
    level: { number: 5, name: 'Siete vidas' },
    title: badge('salvavidas', 'Salvavidas', 'PLATA'),
    featured: [badge('trotamaterias', 'Trotamaterias', 'BRONCE')],
    badges: [
      badge('primer-aporte', 'Primer aporte', null),
      badge('salvavidas', 'Salvavidas', 'PLATA'),
      badge('trotamaterias', 'Trotamaterias', 'BRONCE'),
    ],
    pinned: [item('COURSE_REVIEW', 'r-1', 'Física I')],
    ...overrides,
  };
}

const reducedMotion = (matches: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PublicProfilePage (/usuarios/[username])', () => {
  beforeEach(() => {
    reducedMotion(false);
    vi.mocked(getPublicProfile).mockReset().mockResolvedValue(profile());
    vi.mocked(getProfileContributions)
      .mockReset()
      .mockResolvedValueOnce({
        items: [
          item('MATERIAL', 'm-1', 'Resumen de Álgebra'),
          item('EXAM_EXPERIENCE', 'e-1', 'Física I'),
        ],
        page: 1,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [item('COURSE_REVIEW', 'r-9', 'Química')],
        page: 2,
        hasMore: false,
      });
  });

  it('shows the header and the sections in order', async () => {
    render(<PublicProfilePage username="vale" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Vale' })).toBeInTheDocument();
    expect(screen.getByText('Nv. 5 · Siete vidas')).toBeInTheDocument();
    expect(screen.getByText('Miembro desde marzo de 2026')).toBeInTheDocument();
    expect(screen.getByText('Salvavidas', { selector: '[data-title]' })).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Insignias destacadas', 'Aportes fijados', 'Insignias', 'Aportes']);
    expect(
      within(screen.getByRole('region', { name: 'Insignias destacadas' })).getByText(
        'Trotamaterias',
      ),
    ).toBeInTheDocument();
  });

  it('applies the customization', async () => {
    const { container } = render(<PublicProfilePage username="vale" />);
    await screen.findByRole('heading', { level: 1 });

    const root = container.querySelector('[data-profile-root]') as HTMLElement;
    expect(root.className).toMatch(/bg-pixel/);
    expect(root.style.getPropertyValue('--profile-accent')).toBe('var(--dp-pink)');
    expect(container.querySelector('img[data-banner]')).toHaveAttribute(
      'src',
      '/assets/perfil/banners/banner-biblioteca.webp',
    );
    const avatar = container.querySelector('img[data-avatar]') as HTMLElement;
    expect(avatar).toHaveAttribute('src', '/avatars/gato-lentes.webp');
    expect(avatar.className).toMatch(/frame-marco-legendario/);
  });

  it('hides nivel, insignias and título when the student turned them off, keeping the frame', async () => {
    vi.mocked(getPublicProfile).mockResolvedValue(
      profile({ level: null, title: null, featured: [], badges: [] }),
    );
    const { container } = render(<PublicProfilePage username="vale" />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Nv\. /)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Insignias destacadas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Insignias' })).not.toBeInTheDocument();
    expect((container.querySelector('img[data-avatar]') as HTMLElement).className).toMatch(
      /frame-marco-legendario/,
    );
  });

  it('lists contributions with a material preview and links, and loads more', async () => {
    const user = userEvent.setup();
    render(<PublicProfilePage username="vale" />);

    const pinned = await screen.findByRole('region', { name: 'Aportes fijados' });
    expect(within(pinned).getByRole('link', { name: /Física I/ })).toHaveAttribute(
      'href',
      '/resenas/r-1',
    );
    const list = screen.getByRole('region', { name: 'Aportes' });
    expect(await within(list).findByRole('link', { name: /Física I/ })).toHaveAttribute(
      'href',
      '/finales/e-1',
    );
    await user.click(within(list).getByRole('button', { name: /Resumen de Álgebra/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Vista previa de Resumen de Álgebra');

    await user.click(within(list).getByRole('button', { name: 'Ver más aportes' }));
    expect(await within(list).findByRole('link', { name: /Química/ })).toHaveAttribute(
      'href',
      '/resenas/r-9',
    );
    expect(getProfileContributions).toHaveBeenLastCalledWith('vale', 2);
    expect(within(list).queryByRole('button', { name: 'Ver más aportes' })).not.toBeInTheDocument();
  });

  it('says so when the contributions fail to load, instead of an empty list', async () => {
    vi.mocked(getProfileContributions).mockReset().mockRejectedValue(new Error('falló'));
    render(<PublicProfilePage username="vale" />);

    const list = await screen.findByRole('region', { name: 'Aportes' });
    expect(await within(list).findByText('No pudimos cargar sus aportes.')).toBeInTheDocument();
    expect(within(list).queryByText(/Todavía no hay aportes/)).not.toBeInTheDocument();
  });

  it('shows a not-found state for an unknown username', async () => {
    vi.mocked(getPublicProfile).mockRejectedValue({ response: { status: 404 } });
    render(<PublicProfilePage username="nadie" />);

    expect(
      await screen.findByRole('heading', { name: 'No encontramos ese perfil' }),
    ).toBeInTheDocument();
  });

  it('animates the nivel-9 cat, and keeps it still under reduced motion', async () => {
    vi.mocked(getPublicProfile).mockResolvedValue(profile({ avatarCat: 'gato-animado' }));
    const { container, unmount } = render(<PublicProfilePage username="vale" />);
    await screen.findByRole('heading', { level: 1 });
    const animated = container.querySelector('img[data-avatar]') as HTMLElement;
    expect(animated).toHaveAttribute('src', '/avatars/crema.webp');
    expect(animated.className).toMatch(/catAnimated/);
    unmount();

    reducedMotion(true);
    const still = render(<PublicProfilePage username="vale" />);
    await screen.findByRole('heading', { level: 1 });
    expect(
      (still.container.querySelector('img[data-avatar]') as HTMLElement).className,
    ).not.toMatch(/catAnimated/);
  });
});

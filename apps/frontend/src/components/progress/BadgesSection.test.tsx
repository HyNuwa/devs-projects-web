import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MyBadges } from '@/lib/badges-client';

const mocks = vi.hoisted(() => ({
  badges: vi.fn(),
  seen: vi.fn(),
  reducedMotion: false,
}));

vi.mock('@/lib/badges-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/badges-client')>()),
  getMyBadges: mocks.badges,
  markBadgesSeen: mocks.seen,
}));
vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: { src: string; marker?: string; loop?: boolean; autoplay?: boolean }) => (
    <div
      data-autoplay={String(props.autoplay)}
      data-loop={String(props.loop)}
      data-marker={props.marker}
      data-src={props.src}
      data-testid="lottie"
    />
  ),
}));

import { BadgesSection } from './BadgesSection';

const badges: MyBadges = {
  earned: [
    {
      slug: 'primer-aporte',
      name: 'Primer aporte',
      rarity: 'COMUN',
      tier: null,
      edition: 0,
      earnedAt: '2026-03-10T12:00:00.000Z',
      seen: true,
    },
    {
      slug: 'trotamaterias',
      name: 'Trotamaterias',
      rarity: 'COMUN',
      tier: 'BRONCE',
      edition: 0,
      earnedAt: '2026-08-02T12:00:00.000Z',
      seen: false,
    },
    {
      slug: 'mesa-de-diciembre',
      name: 'Mesa de diciembre',
      rarity: 'TEMPORADA',
      tier: null,
      edition: 2025,
      earnedAt: '2025-12-20T12:00:00.000Z',
      seen: true,
    },
  ],
  pending: [
    {
      slug: 'salvavidas',
      name: 'Salvavidas',
      rarity: 'RARA',
      description: 'Un material tuyo llega a 50 «Me sirvió» (plata: 150, oro: 400).',
    },
  ],
  closest: [
    {
      slug: 'salvavidas',
      name: 'Salvavidas',
      tier: 'BRONCE',
      current: 38,
      target: 50,
      missing: 'Te faltan 12 «Me sirvió»',
    },
  ],
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reducedMotion = false;
  mocks.badges.mockResolvedValue(badges);
  mocks.seen.mockResolvedValue(undefined);
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduce') ? mocks.reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe('BadgesSection («Tu progreso»)', () => {
  it('lists earned insignias with rarity, grado, edición and month', async () => {
    render(<BadgesSection />);

    const earned = await screen.findByRole('list', { name: 'Insignias ganadas' });
    const items = within(earned).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveTextContent('Trotamaterias');
    expect(items[1]).toHaveTextContent('Bronce');
    expect(items[1]).toHaveTextContent('Común');
    expect(items[1]).toHaveTextContent('Ganada · ago 2026');
    expect(items[2]).toHaveTextContent('Edición 2025');
    expect(items[2]).toHaveTextContent('De temporada');
  });

  it('lists pending insignias with their criterion', async () => {
    render(<BadgesSection />);

    const pending = await screen.findByRole('list', { name: 'Insignias por ganar' });
    expect(within(pending).getByRole('listitem')).toHaveTextContent(
      'Un material tuyo llega a 50 «Me sirvió»',
    );
  });

  it('shows the closest insignias with their progress in words', async () => {
    render(<BadgesSection />);

    const closest = await screen.findByRole('list', { name: 'Las más cercanas' });
    expect(closest).toHaveTextContent('Salvavidas · Bronce');
    expect(closest).toHaveTextContent('Te faltan 12 «Me sirvió»');
    expect(
      within(closest).getByRole('progressbar', { name: 'Salvavidas: 38 de 50' }),
    ).toHaveAttribute('aria-valuenow', '76');
  });

  it('plays the entrada animation once for a newly earned insignia, then marks them seen', async () => {
    render(<BadgesSection />);

    const lottie = await screen.findByTestId('lottie');
    expect(lottie).toHaveAttribute('data-src', '/assets/insignias/gema/trotamaterias.lottie');
    expect(lottie).toHaveAttribute('data-marker', 'entrada');
    expect(lottie).toHaveAttribute('data-loop', 'false');
    expect(screen.getAllByTestId('lottie')).toHaveLength(1);
    await waitFor(() => expect(mocks.seen).toHaveBeenCalledTimes(1));
    expect(mocks.seen).toHaveBeenCalledWith([{ slug: 'trotamaterias', edition: 0 }]);
  });

  it('shows only the still gem when motion is reduced', async () => {
    mocks.reducedMotion = true;
    render(<BadgesSection />);

    await screen.findByRole('list', { name: 'Insignias ganadas' });
    expect(screen.queryByTestId('lottie')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.seen).toHaveBeenCalledTimes(1));
  });

  it('does not mark anything when every insignia was already seen', async () => {
    mocks.badges.mockResolvedValue({
      ...badges,
      earned: badges.earned.map((badge) => ({ ...badge, seen: true })),
    });
    render(<BadgesSection />);

    await screen.findByRole('list', { name: 'Insignias ganadas' });
    expect(mocks.seen).not.toHaveBeenCalled();
  });
});

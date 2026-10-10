import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Progress } from '@/lib/progress-client';

const mocks = vi.hoisted(() => ({
  progress: vi.fn(),
  user: { id: 'user-1', username: 'max', avatarUrl: null } as {
    id: string;
    username: string;
    avatarUrl: string | null;
    avatarCat?: string | null;
  } | null,
  isLoading: false,
}));

vi.mock('@/lib/progress-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/progress-client')>()),
  getMyProgress: mocks.progress,
}));
vi.mock('@/components/progress/BadgesSection', () => ({
  BadgesSection: () => null,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: mocks.isLoading }),
}));

import { ProgressPage } from './ProgressPage';

const levels = [
  ['Primeros pasos', 0],
  ['Bigotes curiosos', 30],
  ['De pasillo en pasillo', 100],
  ['Mochila cargada', 250],
  ['Siete vidas', 500],
  ['Apuntes de oro', 900],
  ['Biblioteca viva', 1500],
  ['Faro de la carrera', 2300],
  ['Memoria de la facultad', 3300],
  ['Leyenda de la facultad', 4500],
].map(([name, threshold], index) => ({
  level: index + 1,
  name: name as string,
  threshold: threshold as number,
}));

const progress: Progress = {
  level: 4,
  levelName: 'Mochila cargada',
  points: 320,
  next: {
    level: 5,
    name: 'Siete vidas',
    threshold: 500,
    missing: 180,
    unlocks: 'Marco de avatar y banner ilustrado en el perfil',
  },
  levels,
  movements: [
    {
      reason: 'MATERIAL_PUBLISHED',
      amount: -10,
      reversal: true,
      createdAt: '2026-10-08T12:00:00.000Z',
      subject: { type: 'MATERIAL', title: 'Resumen de relaciones' },
    },
    {
      reason: 'HELPFUL_RECEIVED',
      amount: 1,
      reversal: false,
      createdAt: '2026-10-07T12:00:00.000Z',
      subject: { type: 'MATERIAL', title: 'Parcial 1 con grafos' },
    },
    {
      reason: 'REPORT_CONFIRMED',
      amount: 2,
      reversal: false,
      createdAt: '2026-10-06T12:00:00.000Z',
      subject: null,
    },
  ],
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'user-1', username: 'max', avatarUrl: null };
  mocks.isLoading = false;
  mocks.progress.mockResolvedValue(progress);
});

describe('ProgressPage («Tu progreso»)', () => {
  it('shows the chosen cat as the avatar', async () => {
    mocks.user = {
      id: 'user-1',
      username: 'max',
      avatarUrl: '/foto.webp',
      avatarCat: 'gato-bufanda',
    };
    const { container } = render(<ProgressPage />);

    await screen.findByRole('heading', { level: 1, name: /Mochila cargada/ });
    expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/gato-bufanda.webp');
  });

  it('shows the level, the points and how many are missing for the next one', async () => {
    render(<ProgressPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /Mochila cargada/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nv. 4')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText(/Faltan/)).toHaveTextContent('Faltan 180 para Nv. 5 · Siete vidas');
    expect(screen.getByRole('progressbar', { name: 'Progreso hacia el nivel 5' })).toHaveAttribute(
      'aria-valuenow',
      '28',
    );
  });

  it('says what the next level unlocks', async () => {
    render(<ProgressPage />);

    const unlock = await screen.findByRole('region', {
      name: 'Al llegar a Nv. 5 se desbloquea',
    });
    expect(unlock).toHaveTextContent('Marco de avatar y banner ilustrado en el perfil');
  });

  it('draws the path of the ten levels, marking the current one', async () => {
    render(<ProgressPage />);

    const path = await screen.findByRole('list', { name: 'El camino' });
    const steps = within(path).getAllByRole('listitem');
    expect(steps).toHaveLength(10);
    expect(steps[3]).toHaveAttribute('aria-current', 'step');
    expect(steps[3]).toHaveTextContent('Mochila cargada');
  });

  it('lists the latest movements in plain language, without naming a reported content', async () => {
    render(<ProgressPage />);

    const list = await screen.findByRole('list', { name: 'Últimos movimientos' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('−10');
    expect(rows[0]).toHaveTextContent('Se revirtió: material publicado «Resumen de relaciones»');
    expect(rows[1]).toHaveTextContent('+1');
    expect(rows[1]).toHaveTextContent('«Me sirvió» en «Parcial 1 con grafos»');
    expect(rows[2]).toHaveTextContent('Reporte confirmado por moderación');
  });

  it('links to how points work', async () => {
    render(<ProgressPage />);

    expect(await screen.findByRole('link', { name: /Cómo funcionan los puntos/ })).toHaveAttribute(
      'href',
      '/puntos',
    );
  });

  it('explains how to start when there are no movements yet', async () => {
    mocks.progress.mockResolvedValue({
      ...progress,
      level: 1,
      levelName: 'Primeros pasos',
      points: 0,
      movements: [],
    });
    render(<ProgressPage />);

    expect(await screen.findByText(/Todavía no tenés movimientos/)).toBeInTheDocument();
  });

  it('asks to sign in when there is no session', () => {
    mocks.user = null;
    render(<ProgressPage />);

    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/auth/login');
    expect(mocks.progress).not.toHaveBeenCalled();
  });

  it('shows an error that can be retried', async () => {
    mocks.progress.mockRejectedValueOnce(new Error('falló'));
    render(<ProgressPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

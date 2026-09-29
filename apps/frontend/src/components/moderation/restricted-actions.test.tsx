import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OwnSanction } from '@/lib/account-restriction';
import { useAuthStore } from '@/stores/authStore';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: mocks.get, post: mocks.post } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/materiales/nuevo',
}));

import { MaterialCreateForm } from '@/components/materials/MaterialCreateForm';
import { MySubmissions } from '@/components/profile/MySubmissions';
import { ToastProvider } from '@/components/ui';

import { ReportDialog } from './ReportDialog';

const inDays = (days: number) => new Date(Date.now() + days * 24 * 3_600_000).toISOString();

const mute: OwnSanction = {
  id: 'sanction-1',
  type: 'MUTE',
  reason: 'Segundo retiro.',
  since: inDays(-1),
  until: inDays(6),
  appealable: true,
  appealDeadline: inDays(13),
  appealStatus: null,
};

function signIn(restriction: OwnSanction | null) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      username: 'lu.rojas',
      email: 'lu@devsproject.local',
      role: 'USER',
      displayName: null,
      bio: null,
      avatarUrl: null,
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      restriction,
      unseenWarning: null,
    },
    isLoading: false,
  });
}

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null });
});

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.get.mockResolvedValue({ data: [] });
});

describe('what a silenced account sees', () => {
  it('Subir material is disabled with the explanation, before filling anything', () => {
    signIn(mute);
    render(
      <ToastProvider>
        <MaterialCreateForm />
      </ToastProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Estás silenciado hasta el .*: no podés publicar, reportar ni marcar Me sirvió/,
    );
    expect(screen.getByRole('group', { name: 'Datos del material' })).toBeDisabled();
  });

  it('Reportar is disabled with the explanation', () => {
    signIn(mute);
    render(<ReportDialog returnPath="/materias/AL-01" targetId="mat-1" targetType="MATERIAL" />);

    expect(screen.getByRole('button', { name: 'Reportar' })).toBeDisabled();
    expect(screen.getByText(/Estás silenciado hasta el/)).toBeInTheDocument();
  });

  it('resubmitting in Mis envíos is disabled with the explanation', async () => {
    signIn(mute);
    mocks.get.mockResolvedValue({
      data: [
        {
          type: 'MATERIAL',
          id: 'mat-1',
          title: 'Final sin tachar',
          subject: { id: 'sub-1', code: 'ED-01', name: 'Estructura de Datos' },
          isAnonymous: false,
          status: 'REJECTED',
          reason: 'Tapá los DNI.',
          statusChangedAt: '2026-09-20T10:00:00.000Z',
          createdAt: '2026-09-18T10:00:00.000Z',
          canResubmit: true,
          retiro: null,
        },
      ],
    });
    render(<MySubmissions />);

    expect(await screen.findByRole('button', { name: 'Reenviar a revisión' })).toBeDisabled();
    expect(screen.getAllByText(/Estás silenciado hasta el/).length).toBeGreaterThan(0);
  });

  it('an account in good standing keeps every action enabled', () => {
    signIn(null);
    render(<ReportDialog returnPath="/materias/AL-01" targetId="mat-1" targetType="MATERIAL" />);

    expect(screen.getByRole('button', { name: 'Reportar' })).toBeEnabled();
    expect(screen.queryByText(/Estás silenciado/)).not.toBeInTheDocument();
  });
});

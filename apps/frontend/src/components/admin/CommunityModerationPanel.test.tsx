import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommunityModerationPanel } from './CommunityModerationPanel';
import {
  getCommunityModerationReports,
  moderateCommunityEntry,
  type CommunityModerationReport,
} from '@/lib/community-management-client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

vi.mock('@/lib/community-management-client', () => ({
  getCommunityModerationReports: vi.fn(),
  moderateCommunityEntry: vi.fn(),
}));

const moderator: User = {
  avatarUrl: null,
  bio: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  displayName: 'Moderadora',
  email: 'moderator@example.com',
  emailVerified: true,
  id: 'moderator-1',
  role: 'MODERATOR',
  updatedAt: '2026-01-01T00:00:00.000Z',
  username: 'moderator',
};

function report(isRemoved = false): CommunityModerationReport {
  return {
    createdAt: '2026-09-01T00:00:00.000Z',
    explanation: 'Incluye el correo de una persona que no participa de la cursada.',
    id: 'report-1',
    reason: 'DATOS_PERSONALES',
    target: {
      author: {
        avatarUrl: null,
        displayName: 'Autora interna',
        id: 'author-1',
        username: 'author',
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      id: 'review-1',
      isAnonymous: true,
      moderation: {
        date: isRemoved ? '2026-09-02T00:00:00.000Z' : null,
        isRemoved,
        reason: isRemoved ? 'Expone datos personales.' : null,
      },
      subject: {
        code: 'ED-01',
        id: 'subject-1',
        name: 'Estructuras de Datos',
      },
      subjectId: 'subject-1',
      type: 'COURSE_REVIEW',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  };
}

describe('CommunityModerationPanel', () => {
  beforeEach(() => {
    vi.mocked(getCommunityModerationReports).mockReset();
    vi.mocked(moderateCommunityEntry).mockReset();
    useAuthStore.setState({ isLoading: false, user: moderator });
  });

  afterEach(cleanup);

  it('keeps a reported anonymous entry in the moderator queue and exposes identity only there', async () => {
    const user = userEvent.setup();
    vi.mocked(getCommunityModerationReports)
      .mockResolvedValueOnce([report(false)])
      .mockResolvedValueOnce([report(true)]);
    vi.mocked(moderateCommunityEntry).mockResolvedValue();

    render(<CommunityModerationPanel />);

    expect(
      await screen.findByRole('heading', { name: 'Reportes sobre reseñas y finales' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Publicada como Anónimo')).toBeInTheDocument();
    expect(screen.getByText('Autora interna (@author)')).toBeInTheDocument();
    expect(screen.getByText('Sigue visible')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retirar de la vista pública' }));
    await user.type(screen.getByLabelText('Razón para el registro'), 'Expone datos personales.');
    await user.click(screen.getByRole('button', { name: 'Confirmar decisión' }));

    await waitFor(() =>
      expect(moderateCommunityEntry).toHaveBeenCalledWith(
        'course-review',
        'review-1',
        'remove',
        'Expone datos personales.',
      ),
    );
    expect(await screen.findByText('Retirada de la vista pública')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar publicación' })).toBeInTheDocument();
  });

  it('does not render or request moderator-only identities for an ordinary account', () => {
    useAuthStore.setState({
      isLoading: false,
      user: { ...moderator, role: 'USER' },
    });

    render(<CommunityModerationPanel />);

    expect(screen.queryByText('Reportes sobre reseñas y finales')).not.toBeInTheDocument();
    expect(getCommunityModerationReports).not.toHaveBeenCalled();
  });
});

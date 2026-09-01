import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommunityEntryManagement } from './CommunityEntryManagement';
import {
  deleteCommunityEntry,
  getCommunityManagement,
  type CommunityManagementView,
} from '@/lib/community-management-client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

vi.mock('@/lib/community-management-client', () => ({
  deleteCommunityEntry: vi.fn(),
  getCommunityManagement: vi.fn(),
}));

const owner: User = {
  avatarUrl: null,
  bio: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  displayName: 'Estudiante dueña',
  email: 'owner@example.com',
  emailVerified: true,
  id: 'owner-1',
  role: 'USER',
  updatedAt: '2026-01-01T00:00:00.000Z',
  username: 'owner',
};

function management(overrides: Partial<CommunityManagementView> = {}): CommunityManagementView {
  return {
    author: {
      avatarUrl: null,
      displayName: 'Estudiante dueña',
      id: owner.id,
      username: owner.username,
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    id: 'review-1',
    isAnonymous: true,
    moderation: {
      date: null,
      isRemoved: false,
      reason: null,
    },
    subjectId: 'subject-1',
    type: 'COURSE_REVIEW',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CommunityEntryManagement', () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    vi.mocked(deleteCommunityEntry).mockReset();
    vi.mocked(getCommunityManagement).mockReset();
    useAuthStore.setState({ isLoading: false, user: owner });
  });

  afterEach(cleanup);

  it('shows owner-only edit and confirmed permanent deletion controls', async () => {
    const user = userEvent.setup();
    vi.mocked(getCommunityManagement).mockResolvedValue(management());
    vi.mocked(deleteCommunityEntry).mockResolvedValue();

    render(
      <CommunityEntryManagement id="review-1" kind="course-review" subjectHref="/materias/ED-01" />,
    );

    expect(await screen.findByRole('link', { name: 'Editar publicación' })).toHaveAttribute(
      'href',
      '/materias/ED-01/resenar?editar=review-1',
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar permanentemente' }));
    expect(screen.getByRole('dialog', { name: '¿Eliminar esta reseña?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar permanentemente' }));

    await waitFor(() =>
      expect(deleteCommunityEntry).toHaveBeenCalledWith('course-review', 'review-1'),
    );
    expect(navigation.replace).toHaveBeenCalledWith('/resenas');
  });

  it('does not expose controls when private management access is denied', async () => {
    vi.mocked(getCommunityManagement).mockRejectedValue({ response: { status: 403 } });

    render(
      <CommunityEntryManagement id="review-1" kind="course-review" subjectHref="/materias/ED-01" />,
    );

    await waitFor(() =>
      expect(getCommunityManagement).toHaveBeenCalledWith('course-review', 'review-1'),
    );
    expect(screen.queryByText('Gestión de tu publicación')).not.toBeInTheDocument();
  });

  it('shows only the owner removal reason and date for a retired entry', async () => {
    vi.mocked(getCommunityManagement).mockResolvedValue(
      management({
        moderation: {
          date: '2026-09-01T12:00:00.000Z',
          isRemoved: true,
          reason: 'Expone datos personales de otra persona.',
        },
      }),
    );

    render(<CommunityEntryManagement id="review-1" kind="course-review" />);

    expect(
      await screen.findByRole('heading', {
        name: 'Tu publicación fue retirada de la vista pública',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Expone datos personales de otra persona.')).toBeInTheDocument();
    expect(screen.getByText('Retirada el 1 sept 2026.')).toBeInTheDocument();
    expect(screen.queryByText('@owner')).not.toBeInTheDocument();
  });
});

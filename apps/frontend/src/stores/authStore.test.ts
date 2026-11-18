import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: mocks.post } }));

import { EXPERIENCE_DRAFT_KEY } from '@/components/experiences/forms/experience-draft';
import type { User } from '@/types/auth';

import { useAuthStore } from './authStore';

const draft = JSON.stringify({
  subjectCode: 'ED-01',
  subjectName: 'Estructuras de Datos',
  type: 'resenar',
  values: { comment: 'Un relato a medio escribir.' },
});

describe('authStore logout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.post.mockReset();
    useAuthStore.setState({
      isLoading: false,
      user: { id: 'author-1', username: 'luciana' } as User,
    });
    sessionStorage.setItem(EXPERIENCE_DRAFT_KEY, draft);
  });

  it('clears the experiencia draft of the account that signs out', async () => {
    mocks.post.mockResolvedValue({ data: {} });

    await useAuthStore.getState().logout();

    expect(mocks.post).toHaveBeenCalledWith('/auth/logout');
    expect(useAuthStore.getState().user).toBeNull();
    expect(sessionStorage.getItem(EXPERIENCE_DRAFT_KEY)).toBeNull();
  });

  it('clears the draft also when the logout request fails', async () => {
    mocks.post.mockRejectedValue(new Error('offline'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(sessionStorage.getItem(EXPERIENCE_DRAFT_KEY)).toBeNull();
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { Material } from '@/types/material';
import { ToastProvider } from '@/components/ui';
import { MaterialDetail } from './MaterialDetail';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'material-2' }),
  useRouter: () => navigation,
}));
vi.mock('@/lib/api', () => ({
  api: {
    defaults: { baseURL: 'http://localhost:3001/api/v1' },
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

const material: Material = {
  id: 'material-2',
  title: 'Parcial 1',
  description: null,
  fileUrl: '/uploads/materials/parcial-1.pdf',
  fileType: 'application/pdf',
  fileSize: '1024',
  thumbnailUrl: null,
  authorId: 'author-1',
  subjectId: 'subject-1',
  resourceType: 'PARCIAL',
  academicYear: 2026,
  professorId: null,
  shift: null,
  downloadCount: 0,
  avgRating: '0',
  ratingCount: 0,
  helpfulCount: 0,
  commentCount: 0,
  starSummary: { average: '0', count: 0 },
  commentSummary: { count: 0 },
  preview: {
    capability: 'PDF',
    url: null,
    canPreview: false,
    downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
    fallback: {
      reason: 'UNAVAILABLE',
      downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
    },
  },
  createdAt: '2026-08-30T12:00:00.000Z',
  updatedAt: '2026-08-30T12:00:00.000Z',
  author: { id: 'author-1', username: 'author', displayName: null, avatarUrl: null },
  subject: { id: 'subject-1', name: 'Estructuras de Datos', code: 'ED-01' },
  professor: null,
};

const baseUser: User = {
  id: 'author-1',
  username: 'author',
  email: 'author@example.com',
  role: 'USER',
  displayName: null,
  bio: null,
  avatarUrl: null,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderDetail() {
  return render(
    <ToastProvider>
      <MaterialDetail />
    </ToastProvider>,
  );
}

describe('MaterialDetail management controls', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigation.push.mockReset();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/materials/material-2') return Promise.resolve({ data: material });
      if (path === '/materials/material-2/ratings') {
        return Promise.resolve({
          data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
        });
      }
      if (path === '/subjects') return Promise.resolve({ data: [] });

      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it('keeps deletion behind a confirmation for the material owner', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ isLoading: false, user: baseUser });
    renderDetail();

    await screen.findByRole('heading', { name: material.title });
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('dialog', { name: 'Eliminar material' })).toBeInTheDocument();
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('shows a moderator the allowed delete control without an edit control', async () => {
    useAuthStore.setState({
      isLoading: false,
      user: { ...baseUser, id: 'moderator-1', role: 'MODERATOR' },
    });
    renderDetail();

    await screen.findByRole('heading', { name: material.title });
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

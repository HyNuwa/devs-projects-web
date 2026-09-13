import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPublicMaterial } from '@/lib/discovery-client';
import { getMaterialRatings } from '@/lib/material-community-client';
import {
  getMaterialViewerState,
  setMaterialHelpfulness,
  setMaterialSaved,
} from '@/lib/material-viewer-client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { Material, MaterialRating, Paginated } from '@/types/material';
import { MaterialPreviewDialog, resolveAllowedPreviewUrl } from './MaterialPreviewDialog';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));
vi.mock('@/lib/discovery-client', () => ({ getPublicMaterial: vi.fn() }));
vi.mock('@/lib/material-community-client', () => ({ getMaterialRatings: vi.fn() }));
vi.mock('@/lib/material-viewer-client', () => ({
  getMaterialViewerState: vi.fn(),
  setMaterialHelpfulness: vi.fn(),
  setMaterialSaved: vi.fn(),
}));

const file = {
  id: 'material-2',
  title: 'Parcial 1',
  fileType: 'application/pdf',
  academicYear: 2026,
  createdAt: '2026-08-30T12:00:00.000Z',
};

const signedInUser: User = {
  id: 'viewer-1',
  username: 'estudiante',
  email: 'estudiante@example.com',
  role: 'USER',
  displayName: 'Estudiante',
  bio: null,
  avatarUrl: null,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function material(overrides: Partial<Material> = {}): Material {
  return {
    id: file.id,
    title: file.title,
    description: null,
    fileUrl: '/uploads/materials/parcial-1.pdf',
    fileType: file.fileType,
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
      url: 'https://drive.google.com/file/d/material-2/preview',
      canPreview: true,
      downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
      fallback: {
        reason: 'PREVIEW_FAILED',
        downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
      },
    },
    createdAt: file.createdAt,
    updatedAt: file.createdAt,
    author: { id: 'author-1', username: 'estudiante', displayName: null, avatarUrl: null },
    subject: { id: 'subject-1', name: 'Estructuras de Datos', code: 'ED-01' },
    professor: null,
    ...overrides,
  };
}

function communityRatings(
  overrides: Partial<Paginated<MaterialRating>> = {},
): Paginated<MaterialRating> {
  return {
    data: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    ...overrides,
  };
}

function DialogFixture({ onRequestClose = vi.fn() }: { onRequestClose?: () => void }) {
  const [open, setOpen] = useState(true);
  const close = () => {
    onRequestClose();
    setOpen(false);
  };

  return (
    <div>
      <button id="material-file-material-2" type="button">
        Abrir Parcial 1
      </button>
      <MaterialPreviewDialog
        file={file}
        focusTargetId="material-file-material-2"
        onRequestClose={close}
        open={open}
        subjectName="Estructuras de Datos"
      />
    </div>
  );
}

describe('MaterialPreviewDialog', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(getPublicMaterial).mockReset();
    vi.mocked(getPublicMaterial).mockResolvedValue(material());
    vi.mocked(getMaterialRatings).mockReset();
    vi.mocked(getMaterialRatings).mockResolvedValue(communityRatings());
    vi.mocked(getMaterialViewerState).mockReset();
    vi.mocked(setMaterialHelpfulness).mockReset();
    vi.mocked(setMaterialSaved).mockReset();
    navigation.push.mockReset();
    useAuthStore.setState({ isLoading: false, user: null });
  });

  it('keeps the list inert, moves focus into the dialog, and restores it after Escape', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    const dialog = await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    expect(screen.queryByRole('button', { name: 'Abrir Parcial 1' })).not.toBeInTheDocument();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await user.keyboard('{Escape}');

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(document.getElementById('material-file-material-2')).toHaveFocus());
  });

  it('supports an explicit outside close and exposes download and community regions', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    expect(screen.getAllByRole('link', { name: 'Descargar' })[0]).toHaveAttribute(
      'href',
      'http://localhost:3001/api/v1/materials/material-2/download',
    );
    expect(screen.getByRole('heading', { name: 'Comunidad' })).toBeInTheDocument();

    await user.click(screen.getByTestId('material-preview-overlay'));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('provides a labelled close action', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    await user.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders an allowlisted PDF preview and preserves context/actions when it fails', async () => {
    render(<DialogFixture />);

    const preview = await screen.findByTitle('Vista previa del archivo Parcial 1');
    expect(preview).toHaveAttribute('src', 'https://drive.google.com/file/d/material-2/preview');
    expect(preview).toHaveAttribute(
      'sandbox',
      'allow-forms allow-popups allow-same-origin allow-scripts',
    );
    // Stacked (mobile) layout: the frame must size to content so its escape hatch is not
    // overflowed by the community aside; full height applies only in the lg side-by-side layout.
    const frame = preview.closest('[data-slot="material-preview-frame"]');
    expect(frame).toHaveClass(
      'grid-rows-[auto_auto]',
      'lg:h-full',
      'lg:grid-rows-[minmax(0,1fr)_auto]',
    );
    expect(frame).not.toHaveClass('size-full');

    fireEvent.error(preview);
    await userEvent.setup().click(screen.getByRole('button', { name: 'La vista previa no cargó' }));

    expect(
      await screen.findByRole('heading', { name: 'No pudimos cargar la vista previa' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Descargar' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Descargar archivo' })).toHaveAttribute(
      'href',
      'http://localhost:3001/api/v1/materials/material-2/download',
    );
    expect(screen.getByText(/Estructuras de Datos · APPLICATION\/PDF · 2026/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comunidad' })).toBeInTheDocument();
  });

  it('lifts a failed first-party PDF load into one centred fallback without the stray label', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(getPublicMaterial).mockResolvedValueOnce(
      material({
        preview: {
          capability: 'PDF',
          url: '/uploads/materials/parcial-1.pdf',
          canPreview: true,
          downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          fallback: {
            reason: 'PREVIEW_FAILED',
            downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          },
        },
      }),
    );

    try {
      render(<DialogFixture />);

      const heading = await screen.findByRole('heading', {
        name: 'No pudimos cargar la vista previa',
      });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/uploads/materials/parcial-1.pdf',
        expect.anything(),
      );
      const fallback = heading.closest('[data-slot="material-preview-fallback"]') as HTMLElement;
      expect(fallback).toHaveClass('mx-auto', 'items-center', 'text-center');
      expect(within(fallback).getByText('Parcial 1')).toBeInTheDocument();
      expect(within(fallback).getByText('APPLICATION/PDF')).toBeInTheDocument();
      expect(within(fallback).getByRole('link', { name: 'Descargar archivo' })).toHaveAttribute(
        'href',
        'http://localhost:3001/api/v1/materials/material-2/download',
      );
      expect(
        screen.queryByRole('button', { name: 'La vista previa no cargó' }),
      ).not.toBeInTheDocument();

      await user.click(within(fallback).getByRole('button', { name: 'Reintentar vista previa' }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps download in the header and drops the mobile bottom bar so nothing is occluded', async () => {
    render(<DialogFixture />);

    const dialog = await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    const header = dialog.querySelector('header') as HTMLElement;
    expect(within(header).getByRole('link', { name: 'Descargar' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Cerrar vista previa' })).toBeInTheDocument();

    // Mobile: header + one scroll region only; the footer is desktop-only chrome.
    expect(dialog).toHaveClass('grid-rows-[auto_minmax(0,1fr)]');
    // The stacked body flows as blocks so the preview section grows with its content
    // instead of being clamped (and overlapped by the aside) as an auto grid row.
    const body = dialog.querySelector('[data-slot="material-preview-body"]');
    expect(body).toHaveClass('overflow-y-auto', 'lg:grid');
    expect(body).not.toHaveClass('grid');
    const footer = dialog.querySelector('[data-slot="material-preview-footer"]');
    expect(footer).toHaveClass('hidden', 'sm:flex');
    expect(footer?.querySelector('a')).toBeNull();

    // The sign-in hint lives inside the scrollable community region, with bottom room.
    const community = dialog.querySelector(
      '[data-slot="material-preview-community"]',
    ) as HTMLElement;
    expect(
      within(community).getByText(
        'Iniciá sesión para guardar este material o indicar que te sirvió.',
      ),
    ).toBeInTheDocument();
    expect(community.className).toContain('pb-[max(4rem,env(safe-area-inset-bottom))]');
  });

  it('renders allowlisted images and rejects arbitrary preview origins', async () => {
    vi.mocked(getPublicMaterial).mockResolvedValueOnce(
      material({
        preview: {
          capability: 'IMAGE',
          url: '/uploads/materials/parcial-1.png',
          canPreview: true,
          downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          fallback: {
            reason: 'PREVIEW_FAILED',
            downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          },
        },
      }),
    );
    render(<DialogFixture />);

    expect(await screen.findByRole('img', { name: 'Vista previa de Parcial 1' })).toHaveAttribute(
      'src',
      'http://localhost:3001/uploads/materials/parcial-1.png',
    );
    expect(resolveAllowedPreviewUrl('https://untrusted.example/preview.pdf')).toBeNull();
  });

  it('explains unsupported formats while preserving download access', async () => {
    vi.mocked(getPublicMaterial).mockResolvedValueOnce(
      material({
        preview: {
          capability: 'UNSUPPORTED',
          url: null,
          canPreview: false,
          downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          fallback: {
            reason: 'UNSUPPORTED',
            downloadUrl: 'http://localhost:3001/api/v1/materials/material-2/download',
          },
        },
      }),
    );
    render(<DialogFixture />);

    expect(
      await screen.findByRole('heading', { name: 'Vista previa no compatible' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Descargar' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Descargar archivo' })).toBeInTheDocument();
  });

  it('asks an anonymous viewer to sign in without losing the selected location', async () => {
    const user = userEvent.setup();
    render(<DialogFixture />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(navigation.push).toHaveBeenCalledWith('/auth/login?redirect=%2F');
    expect(getMaterialViewerState).not.toHaveBeenCalled();
  });

  it('never reads private viewer state or navigates when an anonymous visitor only opens it', async () => {
    render(<DialogFixture />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    await waitFor(() => expect(getMaterialRatings).toHaveBeenCalled());

    expect(getMaterialViewerState).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('waits for the auth check before reading private viewer state', async () => {
    useAuthStore.setState({ isLoading: true, user: null });
    render(<DialogFixture />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    await waitFor(() => expect(getMaterialRatings).toHaveBeenCalled());

    expect(getMaterialViewerState).not.toHaveBeenCalled();
  });

  it('reconciles saved and helpful state from idempotent viewer mutations', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    vi.mocked(getMaterialViewerState).mockResolvedValue({ isHelpful: false, isSaved: false });
    vi.mocked(setMaterialSaved).mockResolvedValue({ isHelpful: false, isSaved: true });
    vi.mocked(setMaterialHelpfulness).mockResolvedValue({
      isHelpful: true,
      isSaved: true,
      helpfulCount: 1,
    });
    render(<DialogFixture />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    const save = await screen.findByRole('button', { name: 'Guardar' });
    await waitFor(() => expect(getMaterialViewerState).toHaveBeenCalledWith(file.id));

    await user.click(save);
    await waitFor(() => expect(setMaterialSaved).toHaveBeenCalledWith(file.id, true));
    expect(await screen.findByRole('button', { name: 'Guardado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Me sirvió' }));
    await waitFor(() => expect(setMaterialHelpfulness).toHaveBeenCalledWith(file.id, true));
    expect(await screen.findByText('1 persona indicó que le sirvió.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Me sirvió' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows stars and community comments without presenting them as moderation', async () => {
    vi.mocked(getPublicMaterial).mockResolvedValueOnce(
      material({
        commentSummary: { count: 1 },
        starSummary: { average: '4.5', count: 2 },
      }),
    );
    vi.mocked(getMaterialRatings).mockResolvedValueOnce(
      communityRatings({
        data: [
          {
            id: 'rating-1',
            userId: 'student-1',
            materialId: file.id,
            rating: 5,
            comment: 'La explicación de pilas me resultó muy clara.',
            createdAt: '2026-08-29T12:00:00.000Z',
            user: {
              id: 'student-1',
              username: 'luciana',
              displayName: 'Luciana G.',
              avatarUrl: null,
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    );
    render(<DialogFixture />);

    expect(
      await screen.findByLabelText('4,5 de 5 estrellas según 2 valoraciones'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comentarios (1)' })).toBeInTheDocument();
    expect(screen.getByText('Luciana G.')).toBeInTheDocument();
    expect(screen.getByText('La explicación de pilas me resultó muy clara.')).toBeInTheDocument();
    expect(screen.getByText(/no una verificación académica/i)).toBeInTheDocument();
  });

  it('keeps an explicit retry and empty state for comments', async () => {
    const user = userEvent.setup();
    vi.mocked(getMaterialRatings)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(communityRatings());
    render(<DialogFixture />);

    expect(await screen.findByText('No pudimos cargar los comentarios.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar comentarios' }));

    await waitFor(() => expect(getMaterialRatings).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText('Todavía no hay comentarios sobre este archivo.'),
    ).toBeInTheDocument();
  });

  it.each([
    { id: 'author-1', role: 'USER' as const },
    { id: 'moderator-1', role: 'MODERATOR' as const },
  ])('keeps management outside student actions for an authorized viewer', async ({ id, role }) => {
    useAuthStore.setState({
      isLoading: false,
      user: { ...signedInUser, id, role },
    });
    vi.mocked(getMaterialViewerState).mockResolvedValue({ isHelpful: false, isSaved: false });
    render(<DialogFixture />);

    expect(await screen.findByRole('heading', { name: 'Administración' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestionar material' })).toHaveAttribute(
      'href',
      `/materiales/${file.id}`,
    );
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('does not expose management controls to another student', async () => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    vi.mocked(getMaterialViewerState).mockResolvedValue({ isHelpful: false, isSaved: false });
    render(<DialogFixture />);

    await screen.findByTitle('Vista previa del archivo Parcial 1');
    expect(screen.queryByRole('heading', { name: 'Administración' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestionar material' })).not.toBeInTheDocument();
  });
});

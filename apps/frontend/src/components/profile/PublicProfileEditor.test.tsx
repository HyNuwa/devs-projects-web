import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMyProfileCustomization,
  getProfileContributions,
  saveMyProfileCustomization,
  type MyProfileCustomization,
  type ProfileChoices,
  type ProfileOption,
} from '@/lib/profile-client';

import { PublicProfileEditor } from './PublicProfileEditor';

vi.mock('@/lib/profile-client', () => ({
  getMyProfileCustomization: vi.fn(),
  getProfileContributions: vi.fn(),
  saveMyProfileCustomization: vi.fn(),
}));

const option = (
  id: string,
  kind: ProfileOption['kind'],
  label: string,
  unlocked: boolean,
  unlockLabel: string,
): ProfileOption => ({ id, kind, label, unlocked, unlockLabel });

const defaults: ProfileChoices = {
  avatarCat: null,
  accent: null,
  background: null,
  frame: null,
  banner: null,
  theme: null,
  titleBadge: null,
  featuredBadges: [],
  pinned: [],
  showLevelAndBadges: true,
};

function customization(overrides: Partial<MyProfileCustomization> = {}): MyProfileCustomization {
  return {
    choices: defaults,
    options: [
      option('crema', 'cat', 'Gato crema', true, 'Nv. 1'),
      option('gato-lentes', 'cat', 'Gato con lentes', true, 'Nv. 2'),
      option('gato-dorado', 'cat', 'Gato dorado', false, 'Nv. 7'),
      option('coral', 'accent', 'Coral', true, 'Nv. 3'),
      option('hoja', 'background', 'Hoja de apuntes', false, 'Nv. 4'),
      option('marco-clasico', 'frame', 'Marco clásico', false, 'Nv. 5'),
      option('marco-salvavidas', 'frame', 'Marco Salvavidas', true, 'Insignia Salvavidas'),
      option('banner-biblioteca', 'banner', 'Biblioteca', false, 'Nv. 5'),
      option('faro', 'theme', 'Faro de la carrera', false, 'Nv. 8'),
    ],
    limits: { pins: 1, featured: 3, titleUnlocked: false },
    eligibleBadges: [
      { slug: 'salvavidas', name: 'Salvavidas', rarity: 'RARA', tier: 'PLATA', edition: 0 },
      { slug: 'primer-aporte', name: 'Primer aporte', rarity: 'COMUN', tier: null, edition: 0 },
    ],
    pinnedItems: [],
    ...overrides,
  };
}

const user = { id: 'u-1', username: 'vale', avatarUrl: '/foto.webp' };

afterEach(cleanup);

describe('PublicProfileEditor (Mi perfil → «Perfil público»)', () => {
  beforeEach(() => {
    vi.mocked(getMyProfileCustomization).mockReset().mockResolvedValue(customization());
    vi.mocked(getProfileContributions)
      .mockReset()
      .mockResolvedValue({
        items: [
          {
            type: 'MATERIAL',
            id: 'm-1',
            title: 'Resumen de Álgebra',
            subject: { code: 'ALG', name: 'Álgebra' },
            createdAt: '2026-05-01T00:00:00.000Z',
            fileType: 'pdf',
            academicYear: 2025,
          },
          {
            type: 'COURSE_REVIEW',
            id: 'r-1',
            title: 'Física I',
            subject: { code: 'FIS1', name: 'Física I' },
            createdAt: '2026-04-01T00:00:00.000Z',
            fileType: null,
            academicYear: null,
          },
        ],
        page: 1,
        hasMore: false,
      });
    vi.mocked(saveMyProfileCustomization).mockReset();
  });

  it('shows locked options disabled with what unlocks them', async () => {
    render(<PublicProfileEditor onSaved={vi.fn()} user={user} />);

    const banners = await screen.findByRole('group', { name: 'Banner' });
    expect(within(banners).getByRole('radio', { name: /Biblioteca/ })).toBeDisabled();
    expect(within(banners).getByText('Nv. 5')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Gato dorado/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Marco Salvavidas/ })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'Título' })).toBeDisabled();
    expect(screen.getByText(/título se desbloquea en el nivel 6/i)).toBeInTheDocument();
  });

  it('sends every choice at once', async () => {
    const userAction = userEvent.setup();
    const onSaved = vi.fn();
    vi.mocked(saveMyProfileCustomization).mockResolvedValue(customization());
    render(<PublicProfileEditor onSaved={onSaved} user={user} />);

    await userAction.click(await screen.findByRole('radio', { name: /Gato con lentes/ }));
    await userAction.click(screen.getByRole('radio', { name: /Coral/ }));
    await userAction.click(screen.getByRole('radio', { name: /Marco Salvavidas/ }));
    const featured = screen.getByRole('group', { name: 'Insignias destacadas' });
    await userAction.click(within(featured).getByRole('checkbox', { name: /Primer aporte/ }));
    await userAction.click(within(featured).getByRole('checkbox', { name: /Salvavidas/ }));
    const pins = screen.getByRole('group', { name: 'Aportes fijados' });
    await userAction.click(within(pins).getByRole('checkbox', { name: /Resumen de Álgebra/ }));
    // One pin allowed at this nivel: the others are disabled.
    expect(within(pins).getByRole('checkbox', { name: /Física I/ })).toBeDisabled();
    await userAction.click(screen.getByRole('switch', { name: 'Mostrar mi nivel e insignias' }));
    await userAction.click(screen.getByRole('button', { name: 'Guardar perfil público' }));

    expect(saveMyProfileCustomization).toHaveBeenCalledWith({
      ...defaults,
      avatarCat: 'gato-lentes',
      accent: 'coral',
      frame: 'marco-salvavidas',
      featuredBadges: ['primer-aporte', 'salvavidas'],
      pinned: [{ type: 'MATERIAL', id: 'm-1' }],
      showLevelAndBadges: false,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Guardamos tu perfil público.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the API error and keeps the choices', async () => {
    const userAction = userEvent.setup();
    vi.mocked(saveMyProfileCustomization).mockRejectedValue({
      response: { data: { message: 'Todavía no desbloqueaste esa opción.' } },
    });
    render(<PublicProfileEditor onSaved={vi.fn()} user={user} />);

    await userAction.click(await screen.findByRole('radio', { name: /Coral/ }));
    await userAction.click(screen.getByRole('button', { name: 'Guardar perfil público' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Todavía no desbloqueaste esa opción.',
    );
    expect(screen.getByRole('radio', { name: /Coral/ })).toBeChecked();
  });

  it('goes back to the photo with «Mi foto»', async () => {
    const userAction = userEvent.setup();
    vi.mocked(getMyProfileCustomization).mockResolvedValue(
      customization({ choices: { ...defaults, avatarCat: 'gato-lentes' } }),
    );
    vi.mocked(saveMyProfileCustomization).mockResolvedValue(customization());
    render(<PublicProfileEditor onSaved={vi.fn()} user={user} />);

    await userAction.click(await screen.findByRole('radio', { name: 'Mi foto' }));
    await userAction.click(screen.getByRole('button', { name: 'Guardar perfil público' }));

    expect(saveMyProfileCustomization).toHaveBeenCalledWith(
      expect.objectContaining({ avatarCat: null }),
    );
  });

  it('loads older contributions so they can be pinned', async () => {
    const userAction = userEvent.setup();
    vi.mocked(getProfileContributions)
      .mockReset()
      .mockResolvedValueOnce({ items: [], page: 1, hasMore: true })
      .mockResolvedValueOnce({
        items: [
          {
            type: 'MATERIAL',
            id: 'm-old',
            title: 'Parcial viejo',
            subject: { code: 'ALG', name: 'Álgebra' },
            createdAt: '2025-03-01T00:00:00.000Z',
            fileType: 'pdf',
            academicYear: 2024,
          },
        ],
        page: 2,
        hasMore: false,
      });
    render(<PublicProfileEditor onSaved={vi.fn()} user={user} />);

    await userAction.click(await screen.findByRole('button', { name: 'Ver más aportes' }));

    const pins = screen.getByRole('group', { name: 'Aportes fijados' });
    expect(await within(pins).findByRole('checkbox', { name: /Parcial viejo/ })).toBeEnabled();
    expect(getProfileContributions).toHaveBeenLastCalledWith('vale', 2);
    expect(screen.queryByRole('button', { name: 'Ver más aportes' })).not.toBeInTheDocument();
  });

  it('links to the public profile', async () => {
    render(<PublicProfileEditor onSaved={vi.fn()} user={user} />);

    expect(await screen.findByRole('link', { name: 'Ver mi perfil público' })).toHaveAttribute(
      'href',
      '/usuarios/vale',
    );
  });
});

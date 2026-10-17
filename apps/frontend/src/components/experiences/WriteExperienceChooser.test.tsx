import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupedSuggestions } from '@/lib/discovery-client';
import type { DiscoverySubjectSuggestion } from '@/types/discovery';

import { WriteExperienceChooser } from './WriteExperienceChooser';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
vi.mock('@/lib/discovery-client', () => ({ getGroupedSuggestions: vi.fn() }));
vi.mock('@/stores/ubicacionStore', () => ({
  useUbicacionStore: (selector: (state: unknown) => unknown) =>
    selector({ myCareers: [], ready: true, ubicacion: null }),
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ isLoading: false, user: null }),
}));

const suggestion: DiscoverySubjectSuggestion = {
  code: '06',
  faculty: {
    id: '20000000-0000-4000-8000-0000000000f1',
    name: 'Facultad',
    shortName: 'FI',
    university: { id: 'uni-1', name: 'Universidad', shortName: 'UNJu' },
  },
  id: '50000000-0000-4000-8000-000000000001',
  kind: 'SUBJECT',
  name: 'Análisis Matemático II',
};

describe('WriteExperienceChooser', () => {
  beforeEach(() => {
    vi.mocked(getGroupedSuggestions).mockReset();
    vi.mocked(getGroupedSuggestions).mockResolvedValue({
      materials: [],
      subjects: [suggestion],
    });
  });

  afterEach(cleanup);

  it('offers the two types with none selected and a disabled continuar', () => {
    render(<WriteExperienceChooser />);

    const resena = screen.getByRole('radio', { name: /reseña de cursada/i });
    const final = screen.getByRole('radio', { name: /experiencia de final/i });
    expect(resena).not.toBeChecked();
    expect(final).not.toBeChecked();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    // One native, named group — no unnamed nested radiogroup.
    expect(screen.getByRole('group', { name: '¿Qué querés contar?' })).toContainElement(resena);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('continues to the encoded review route once both are chosen', async () => {
    const user = userEvent.setup();
    render(<WriteExperienceChooser />);

    await user.type(screen.getByRole('combobox', { name: /materia/i }), 'anali');
    await user.click(await screen.findByRole('option', { name: /Análisis Matemático II/ }));
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));

    expect(screen.getByRole('link', { name: /continuar/i })).toHaveAttribute(
      'href',
      '/materias/06/resenar',
    );
  });

  it('continues to the encoded final route for the other type', async () => {
    const user = userEvent.setup();
    render(<WriteExperienceChooser />);

    await user.type(screen.getByRole('combobox', { name: /materia/i }), 'anali');
    await user.click(await screen.findByRole('option', { name: /Análisis Matemático II/ }));
    await user.click(screen.getByRole('radio', { name: /experiencia de final/i }));

    expect(screen.getByRole('link', { name: /continuar/i })).toHaveAttribute(
      'href',
      '/materias/06/final',
    );
  });

  it('keeps the subject when switching type and clears it with «Cambiar materia»', async () => {
    const user = userEvent.setup();
    render(<WriteExperienceChooser />);

    await user.type(screen.getByRole('combobox', { name: /materia/i }), 'anali');
    await user.click(await screen.findByRole('option', { name: /Análisis Matemático II/ }));
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));
    await user.click(screen.getByRole('radio', { name: /experiencia de final/i }));
    expect(screen.getByRole('link', { name: /continuar/i })).toHaveAttribute(
      'href',
      '/materias/06/final',
    );

    await user.click(screen.getByRole('button', { name: /cambiar materia/i }));
    expect(screen.queryByRole('link', { name: /continuar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /materia/i })).toBeInTheDocument();
  });

  it('works without any signed-in session', async () => {
    render(<WriteExperienceChooser />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    expect(screen.queryByText(/iniciá sesión|iniciar sesión/i)).not.toBeInTheDocument();
  });

  it('encodes a code containing a slash into the continue route', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue({
      materials: [],
      subjects: [{ ...suggestion, code: 'AM/II', name: 'Álgebra' }],
    });
    render(<WriteExperienceChooser />);

    await user.type(screen.getByRole('combobox', { name: /materia/i }), 'alg');
    await user.click(await screen.findByRole('option', { name: /Álgebra/ }));
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));
    expect(screen.getByRole('link', { name: /continuar/i })).toHaveAttribute(
      'href',
      '/materias/AM%2FII/resenar',
    );
  });

  it('stays disabled with only one of the two choices made', async () => {
    const user = userEvent.setup();
    render(<WriteExperienceChooser />);

    // Type alone is not enough.
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));

    cleanup();
    render(<WriteExperienceChooser />);

    // Subject alone is not enough either.
    await user.type(screen.getByRole('combobox', { name: /materia/i }), 'anali');
    await user.click(await screen.findByRole('option', { name: /Análisis Matemático II/ }));
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /reseña de cursada/i }));
    expect(screen.getByRole('link', { name: /continuar/i })).toBeInTheDocument();
  });
});

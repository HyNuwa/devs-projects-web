import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupedSuggestions } from '@/lib/discovery-client';
import { PixelNotebookHome } from './PixelNotebookHome';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/discovery-client', () => ({
  getGroupedSuggestions: vi.fn(),
}));

afterEach(cleanup);

describe('PixelNotebookHome', () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(getGroupedSuggestions).mockReset();
  });

  it('keeps the search task and resource shortcuts ahead of supporting content', () => {
    render(<PixelNotebookHome />);

    expect(screen.getByRole('heading', { name: /tu mochila de estudio/i })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: /buscar recursos académicos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /parciales/i })).toHaveAttribute(
      'href',
      '/buscar?resourceType=PARCIAL',
    );
    expect(screen.getByRole('link', { name: /finales/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /apuntes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /resúmenes/i })).toBeInTheDocument();
  });

  it('renders real grouped suggestions with materias before recursos', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue({
      subjects: [{ kind: 'SUBJECT', id: 'subject-1', name: 'Álgebra I', code: 'ALG-1' }],
      materials: [
        {
          kind: 'MATERIAL',
          id: 'material-1',
          title: 'Parcial resuelto de matrices',
          resourceType: 'PARCIAL',
          subject: { id: 'subject-1', name: 'Álgebra I', code: 'ALG-1' },
        },
      ],
    });
    render(<PixelNotebookHome />);

    const input = screen.getByRole('searchbox', { name: /buscá materia/i });
    await user.click(input);
    await user.type(input, 'álgebra');

    await waitFor(() => expect(getGroupedSuggestions).toHaveBeenCalledWith({ q: 'álgebra' }));
    const subjectHeading = screen.getByRole('heading', { name: 'Materias' });
    const subjectGroup = subjectHeading.closest('section');

    expect(subjectGroup).not.toBeNull();
    expect(subjectGroup?.parentElement).toHaveClass('grid-cols-1');
    expect(within(subjectGroup!).getByRole('link')).toHaveAttribute(
      'href',
      '/buscar?q=%C3%81lgebra+I&subjectId=subject-1',
    );
    expect(screen.getByRole('link', { name: /parcial resuelto de matrices/i })).toHaveTextContent(
      /recurso · parcial · álgebra i/i,
    );

    const resourceHeading = screen.getByRole('heading', { name: 'Recursos' });
    expect(subjectHeading.compareDocumentPosition(resourceHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('keeps a no-match query visible for revision', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue({ subjects: [], materials: [] });
    render(<PixelNotebookHome />);

    const input = screen.getByRole('searchbox', { name: /buscá materia/i });
    await user.click(input);
    await user.type(input, 'sin coincidencias');

    expect(await screen.findByText(/no encontramos coincidencias/i)).toBeInTheDocument();
    expect(input).toHaveValue('sin coincidencias');
  });

  it('navigates to the URL-backed search on submit', async () => {
    const user = userEvent.setup();
    render(<PixelNotebookHome />);

    await user.type(screen.getByRole('searchbox', { name: /buscá materia/i }), 'grafos');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(push).toHaveBeenCalledWith('/buscar?q=grafos');
  });

  it('removes outdated suggestions immediately when the query changes and closes on Escape', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue({
      subjects: [{ kind: 'SUBJECT', id: 'subject-1', name: 'Álgebra I', code: 'ALG-1' }],
      materials: [],
    });
    render(<PixelNotebookHome />);
    const input = screen.getByRole('searchbox', { name: /buscá materia/i });
    await user.type(input, 'álgebra');
    await screen.findByRole('link', { name: /álgebra i/i });
    vi.mocked(getGroupedSuggestions).mockImplementation(() => new Promise(() => {}));

    await user.clear(input);
    await user.type(input, 'física');
    expect(screen.queryByRole('link', { name: /álgebra i/i })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText('Sugerencias de búsqueda')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });
});

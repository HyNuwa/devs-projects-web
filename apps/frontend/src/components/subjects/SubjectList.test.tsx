import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';

import { SubjectList } from './SubjectList';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));

afterEach(cleanup);

describe('SubjectList', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('uses canonical materia links and filters the shared public catalogue', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          code: 'ED-01',
          description: null,
          id: 'subject-1',
          name: 'Estructuras de Datos',
        },
        {
          code: null,
          description: null,
          id: 'subject-2',
          name: 'Análisis Matemático',
        },
      ],
    });

    render(<SubjectList />);

    expect(await screen.findByRole('link', { name: /estructuras de datos/i })).toHaveAttribute(
      'href',
      '/materias/ED-01',
    );
    expect(screen.getByRole('link', { name: /análisis matemático/i })).toHaveAttribute(
      'href',
      '/buscar?q=An%C3%A1lisis%20Matem%C3%A1tico',
    );

    await user.type(screen.getByRole('searchbox', { name: 'Buscar materia' }), 'física');

    expect(screen.getByRole('heading', { name: 'No encontramos esa materia' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /estructuras de datos/i })).not.toBeInTheDocument();
  });
});

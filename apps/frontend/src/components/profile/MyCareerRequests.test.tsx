import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MyCareerRequest } from '@/lib/career-requests-client';

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  withdraw: vi.fn(),
  unsupport: vi.fn(),
}));
vi.mock('@/lib/career-requests-client', () => ({
  getMyRequests: mocks.mine,
  withdrawRequest: mocks.withdraw,
  unsupportRequest: mocks.unsupport,
}));

import { MyCareerRequests } from './MyCareerRequests';

const base: MyCareerRequest = {
  id: 'r-1',
  careerName: 'Licenciatura en Física',
  planUrl: 'https://x.edu.ar/lf',
  faculty: 'Facultad de Ciencias Exactas · UNSa',
  status: 'PENDING',
  rejectionReason: null,
  career: null,
  count: 2,
  mine: true,
  createdAt: '2026-10-10T00:00:00.000Z',
};

const all: MyCareerRequest[] = [
  base,
  { ...base, id: 'r-2', careerName: 'Geología', status: 'ACCEPTED', mine: false },
  {
    ...base,
    id: 'r-3',
    careerName: 'Matemática',
    status: 'PUBLISHED',
    career: { name: 'Licenciatura en Matemática', path: '/universidades/unsa/fce/lm' },
  },
  {
    ...base,
    id: 'r-4',
    careerName: 'Tecnicatura',
    status: 'REJECTED',
    rejectionReason: 'No es de grado',
  },
  {
    ...base,
    id: 'r-5',
    careerName: 'Informática',
    status: 'ALREADY_LOADED',
    career: { name: 'Ingeniería Informática', path: '/universidades/unju/fi/ii' },
  },
  { ...base, id: 'r-6', careerName: 'Astronomía', status: 'WITHDRAWN' },
  { ...base, id: 'r-7', careerName: 'Biología', mine: false },
];

const item = (name: string) => screen.getByRole('heading', { name }).closest('li') as HTMLElement;

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mine.mockResolvedValue(all);
  mocks.withdraw.mockResolvedValue({ status: 'WITHDRAWN' });
  mocks.unsupport.mockResolvedValue(undefined);
});

describe('MyCareerRequests', () => {
  it('labels every status', async () => {
    render(<MyCareerRequests />);
    await screen.findByRole('heading', { name: 'Licenciatura en Física' });
    expect(item('Licenciatura en Física')).toHaveTextContent('Pendiente');
    expect(item('Geología')).toHaveTextContent('La estamos cargando');
    expect(item('Matemática')).toHaveTextContent('Publicada');
    expect(item('Tecnicatura')).toHaveTextContent('No la vamos a sumar');
    expect(item('Tecnicatura')).toHaveTextContent('No es de grado');
    expect(item('Informática')).toHaveTextContent('Ya estaba cargada');
    expect(item('Astronomía')).toHaveTextContent('Retirada');
  });

  it('links the carrera when it is published or already loaded', async () => {
    render(<MyCareerRequests />);
    await screen.findByRole('heading', { name: 'Matemática' });
    expect(
      within(item('Matemática')).getByRole('link', { name: /Licenciatura en Matemática/ }),
    ).toHaveAttribute('href', '/universidades/unsa/fce/lm');
    expect(
      within(item('Informática')).getByRole('link', { name: /Ingeniería Informática/ }),
    ).toHaveAttribute('href', '/universidades/unju/fi/ii');
  });

  it('lets the author withdraw and a supporter leave while pending', async () => {
    const user = userEvent.setup();
    render(<MyCareerRequests />);
    await screen.findByRole('heading', { name: 'Licenciatura en Física' });
    expect(within(item('Geología')).queryByRole('button')).toBeNull();

    await user.click(
      within(item('Licenciatura en Física')).getByRole('button', { name: 'Retirar' }),
    );
    expect(mocks.withdraw).toHaveBeenCalledWith('r-1');

    await user.click(within(item('Biología')).getByRole('button', { name: 'Ya no me interesa' }));
    expect(mocks.unsupport).toHaveBeenCalledWith('r-7');
    expect(mocks.mine).toHaveBeenCalledTimes(3);
  });

  it('says when there are none', async () => {
    mocks.mine.mockResolvedValue([]);
    render(<MyCareerRequests />);
    expect(await screen.findByText(/No pediste ninguna carrera/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedí tu carrera' })).toHaveAttribute(
      'href',
      '/universidades/pedir',
    );
  });
});

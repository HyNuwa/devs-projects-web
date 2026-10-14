import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { id: 'u-1', role: 'USER' } as { id: string; role: string } | null,
  isLoading: false,
  replace: vi.fn(),
  institutions: vi.fn(),
  ask: vi.fn(),
  pending: vi.fn(),
  support: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace }),
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: mocks.isLoading }),
}));
vi.mock('@/lib/study-plans-client', () => ({ getInstitutions: mocks.institutions }));
vi.mock('@/lib/career-requests-client', () => ({
  askForCareer: mocks.ask,
  getPendingRequests: mocks.pending,
  supportRequest: mocks.support,
}));

import { CareerRequestForm } from './CareerRequestForm';

const tree = [
  {
    id: 'u-unsa',
    name: 'Universidad Nacional de Salta',
    shortName: 'UNSa',
    faculties: [
      { id: 'f-fce', name: 'Facultad de Ciencias Exactas', shortName: 'FCE', careers: [] },
    ],
  },
];

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'u-1', role: 'USER' };
  mocks.isLoading = false;
  mocks.institutions.mockResolvedValue(tree);
  mocks.pending.mockResolvedValue([
    {
      id: 'r-1',
      careerName: 'Licenciatura en Física',
      planUrl: 'https://x.edu.ar/lf',
      createdAt: '2026-10-10T00:00:00.000Z',
      count: 2,
      mine: false,
      supported: false,
    },
  ]);
  mocks.ask.mockResolvedValue({ id: 'r-new' });
  mocks.support.mockResolvedValue(undefined);
});

describe('CareerRequestForm', () => {
  it('preselects the facultad and offers «Yo también» on its pending solicitudes', async () => {
    const user = userEvent.setup();
    render(<CareerRequestForm facultyId="f-fce" />);
    await waitFor(() => expect(screen.getByLabelText('Facultad')).toHaveValue('f-fce'));
    expect(screen.getByLabelText('Universidad')).toHaveValue('u-unsa');
    const pending = await screen.findByRole('list', { name: 'Ya pedidas en esta facultad' });
    expect(pending).toHaveTextContent('Licenciatura en Física');
    expect(pending).toHaveTextContent('2 estudiantes');
    await user.click(within(pending).getByRole('button', { name: 'Yo también' }));
    expect(mocks.support).toHaveBeenCalledWith('r-1');
    expect(await within(pending).findByText('Te sumaste')).toBeInTheDocument();
  });

  it('sends a new solicitud for a facultad of the catálogo', async () => {
    const user = userEvent.setup();
    render(<CareerRequestForm facultyId="f-fce" />);
    await waitFor(() => expect(screen.getByLabelText('Facultad')).toHaveValue('f-fce'));
    await user.type(screen.getByLabelText('Carrera'), 'Licenciatura en Química');
    await user.type(
      screen.getByLabelText('Link al plan de estudios oficial'),
      'https://x.edu.ar/lq',
    );
    await user.click(screen.getByRole('button', { name: 'Pedir la carrera' }));
    expect(mocks.ask).toHaveBeenCalledWith({
      facultyId: 'f-fce',
      careerName: 'Licenciatura en Química',
      planUrl: 'https://x.edu.ar/lq',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Listo');
  });

  it('accepts a facultad and universidad written in free text', async () => {
    const user = userEvent.setup();
    render(<CareerRequestForm />);
    await screen.findByRole('option', { name: 'Universidad Nacional de Salta' });
    await user.selectOptions(screen.getByLabelText('Universidad'), '__missing');
    await user.type(screen.getByLabelText('Nombre de tu universidad'), 'Universidad del Norte');
    await user.type(screen.getByLabelText('Nombre de tu facultad'), 'Facultad de Química');
    await user.type(screen.getByLabelText('Carrera'), 'Bioquímica');
    await user.type(
      screen.getByLabelText('Link al plan de estudios oficial'),
      'https://x.edu.ar/bq',
    );
    await user.click(screen.getByRole('button', { name: 'Pedir la carrera' }));
    expect(mocks.ask).toHaveBeenCalledWith({
      universityText: 'Universidad del Norte',
      facultyText: 'Facultad de Química',
      careerName: 'Bioquímica',
      planUrl: 'https://x.edu.ar/bq',
    });
  });

  it('rejects a link that is not https before sending', async () => {
    const user = userEvent.setup();
    render(<CareerRequestForm facultyId="f-fce" />);
    await waitFor(() => expect(screen.getByLabelText('Facultad')).toHaveValue('f-fce'));
    await user.type(screen.getByLabelText('Carrera'), 'Química');
    await user.type(screen.getByLabelText('Link al plan de estudios oficial'), 'http://x.edu.ar/q');
    await user.click(screen.getByRole('button', { name: 'Pedir la carrera' }));
    expect(screen.getByRole('alert')).toHaveTextContent('https://');
    expect(mocks.ask).not.toHaveBeenCalled();
  });

  it('sends a visitor to sign in and back to the form', async () => {
    mocks.user = null;
    render(<CareerRequestForm facultyId="f-fce" />);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/auth/login?redirect=%2Funiversidades%2Fpedir%3Ffacultad%3Df-fce',
      ),
    );
    expect(mocks.institutions).not.toHaveBeenCalled();
  });
});

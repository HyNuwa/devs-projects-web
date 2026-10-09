import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/authStore';
import { TOO_MANY_REQUESTS_MESSAGE, tooManyRequests } from '@/test/too-many-requests';
import { LoginForm } from './LoginForm';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

const appeals = vi.hoisted(() => ({ appeal: vi.fn() }));
vi.mock('@/lib/account-restriction', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/account-restriction')>()),
  appealSuspension: appeals.appeal,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

describe('LoginForm', () => {
  const login = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    login.mockReset();
    login.mockResolvedValue(undefined);
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams(
      'redirect=%2Fmateriales%2Fingenieria-informatica%3Farchivo%3Dmaterial-2',
    );
    useAuthStore.setState({ login });
  });

  it('returns to the same local material preview after a successful sign-in', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'estudiante@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'segura');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'estudiante@example.com',
        password: 'segura',
      }),
    );
    expect(navigation.push).toHaveBeenCalledWith(
      '/materiales/ingenieria-informatica?archivo=material-2',
    );
  });

  it('shows how long to wait after too many attempts', async () => {
    login.mockRejectedValue(tooManyRequests());
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'estudiante@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'segura');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  describe('a suspended account', () => {
    const suspended = (overrides: Record<string, unknown> = {}) => ({
      response: {
        status: 403,
        data: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Tu cuenta está suspendida',
          reason: 'Publicaste spam en varias materias.',
          until: '2026-10-30T12:00:00.000Z',
          appealable: true,
          appealDeadline: '2026-10-14T12:00:00.000Z',
          appealStatus: null,
          appealAnswer: null,
          ...overrides,
        },
      },
    });

    async function signIn() {
      const user = userEvent.setup();
      render(<LoginForm />);
      await user.type(screen.getByLabelText('Email'), 'fede@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'segura');
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      return user;
    }

    it('sees why and until when, and can appeal once with its credentials', async () => {
      login.mockRejectedValue(suspended());
      appeals.appeal.mockResolvedValue(undefined);
      const user = await signIn();

      expect(
        await screen.findByRole('heading', { name: 'Tu cuenta está suspendida' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Publicaste spam en varias materias\./)).toBeInTheDocument();
      expect(screen.getByText(/La suspensión dura hasta el/)).toBeInTheDocument();
      expect(navigation.push).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Apelar esta suspensión' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Contá por qué apelás');
      expect(appeals.appeal).not.toHaveBeenCalled();

      await user.type(screen.getByLabelText('Por qué apelás'), 'No publiqué nada de eso.');
      await user.click(screen.getByRole('button', { name: 'Apelar esta suspensión' }));

      await waitFor(() =>
        expect(appeals.appeal).toHaveBeenCalledWith({
          email: 'fede@example.com',
          password: 'segura',
          explanation: 'No publiqué nada de eso.',
        }),
      );
      expect(await screen.findByText(/Recibimos tu apelación/)).toBeInTheDocument();
    });

    it('is told how long to wait when appealing too many times', async () => {
      login.mockRejectedValue(suspended());
      appeals.appeal.mockRejectedValue(tooManyRequests());
      const user = await signIn();

      await screen.findByRole('heading', { name: 'Tu cuenta está suspendida' });
      await user.type(screen.getByLabelText('Por qué apelás'), 'No publiqué nada de eso.');
      await user.click(screen.getByRole('button', { name: 'Apelar esta suspensión' }));

      expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(/Recibimos tu apelación/)).not.toBeInTheDocument();
    });

    it('sees how its appeal went instead of the form', async () => {
      login.mockRejectedValue(
        suspended({
          appealable: false,
          appealStatus: 'REJECTED',
          appealAnswer: 'Las publicaciones son spam.',
        }),
      );
      await signIn();

      expect(await screen.findByText(/Tu apelación fue rechazada/)).toBeInTheDocument();
      expect(screen.getByText(/Las publicaciones son spam\./)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Apelar esta suspensión' }),
      ).not.toBeInTheDocument();
    });

    it('is told to sign in again to see the reason after being signed out', () => {
      navigation.searchParams = new URLSearchParams('suspendida=1');
      render(<LoginForm />);

      expect(screen.getByRole('status')).toHaveTextContent(
        'Tu cuenta fue suspendida. Ingresá para ver el motivo y apelar.',
      );
    });
  });
});

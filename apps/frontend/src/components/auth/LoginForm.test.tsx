import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from './LoginForm';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
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
});

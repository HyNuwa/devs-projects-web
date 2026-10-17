import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { TOO_MANY_REQUESTS_MESSAGE, tooManyRequests } from '@/test/too-many-requests';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { RegisterForm } from './RegisterForm';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ api: { post } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

describe('forms refused by a rate limit', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('sign-up shows how long to wait', async () => {
    useAuthStore.setState({ register: vi.fn().mockRejectedValue(tooManyRequests()) });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nombre de usuario'), 'fede');
    await user.type(screen.getByLabelText('Email'), 'fede@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Segura123!');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Segura123!');
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
  });

  it('password recovery shows how long to wait', async () => {
    post.mockRejectedValue(tooManyRequests());
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ForgotPasswordForm />
      </ToastProvider>,
    );

    await user.type(screen.getByLabelText('Email'), 'fede@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));

    expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText('Revisá tu email')).not.toBeInTheDocument();
  });
});

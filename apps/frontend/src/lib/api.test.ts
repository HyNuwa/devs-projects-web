import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { loginHrefForCurrentLocation, redirectToLogin } from '@/lib/auth-return-path';

vi.mock('@/lib/auth-return-path', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-return-path')>()),
  redirectToLogin: vi.fn(),
}));

const unauthorized: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, null, {
    config,
    data: { statusCode: 401 },
    headers: {},
    status: 401,
    statusText: 'Unauthorized',
  });
};

describe('api 401 interceptor', () => {
  beforeEach(() => {
    vi.mocked(redirectToLogin).mockReset();
    window.history.pushState({}, '', '/buscar?q=parcial&archivo=material-1');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('keeps a visitor on the public page when a background read opts out of the redirect', async () => {
    await expect(
      api.get('/materials/material-1/viewer-state', {
        adapter: unauthorized,
        skipAuthRedirect: true,
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('still sends a user-initiated mutation to login with a same-origin return path', async () => {
    await expect(
      api.put(
        '/materials/material-1/helpfulness',
        { isHelpful: true },
        {
          adapter: unauthorized,
        },
      ),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(redirectToLogin).toHaveBeenCalledTimes(1);
    expect(loginHrefForCurrentLocation()).toBe(
      '/auth/login?redirect=%2Fbuscar%3Fq%3Dparcial%26archivo%3Dmaterial-1',
    );
  });

  it('does not redirect when the session probe itself is unauthorized', async () => {
    await expect(api.get('/auth/me', { adapter: unauthorized })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});

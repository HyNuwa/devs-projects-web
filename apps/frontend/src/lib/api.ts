import axios from 'axios';

import { redirectToLogin } from '@/lib/auth-return-path';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * Background, viewer-only reads on public pages set this so a 401 (anonymous visitor or
     * expired session) degrades the private UI instead of hard-redirecting to login.
     * User-initiated mutations leave it unset and still send the visitor to login.
     */
    skipAuthRedirect?: boolean;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestPath = typeof error.config?.url === 'string' ? error.config.url : '';
    if (
      error.response?.status === 401 &&
      error.config?.skipAuthRedirect !== true &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/auth/login' &&
      !requestPath.startsWith('/auth/')
    ) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export { api };

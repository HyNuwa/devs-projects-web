import axios from 'axios';

import { loginHrefForCurrentLocation } from '@/lib/auth-return-path';

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
      typeof window !== 'undefined' &&
      window.location.pathname !== '/auth/login' &&
      !requestPath.startsWith('/auth/')
    ) {
      window.location.href = loginHrefForCurrentLocation();
    }
    return Promise.reject(error);
  },
);

export { api };

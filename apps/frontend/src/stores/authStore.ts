'use client';

import { create } from 'zustand';
import { AuthState, LoginPayload, RegisterPayload } from '@/types/auth';
import { api } from '@/lib/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    set({ user: data.user });
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    set({ user: data.user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));

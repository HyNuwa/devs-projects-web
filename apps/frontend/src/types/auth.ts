import type { OwnSanction } from '@/lib/account-restriction';

export type Role = 'VISITOR' | 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Active silenciamiento or suspensión, from GET /auth/me. */
  restriction?: OwnSanction | null;
  /** An advertencia not seen yet, from GET /auth/me. */
  unseenWarning?: OwnSanction | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

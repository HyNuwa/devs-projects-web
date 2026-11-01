import { Role } from '../auth/dto/auth-response.dto';

export const PERMISSIONS = [
  'courses:read',
  'courses:enroll',
  'courses:manage',
  'subjects:manage',
  'drive:manage',
  'roles:read',
  'roles:assign',
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export interface AuthenticatedUser {
  id: number;
  role: Role;
  email: string;
  mutedUntil?: Date | null;
}

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  VISITOR: ['courses:read'],
  USER: ['courses:read', 'courses:enroll'],
  MODERATOR: ['courses:read', 'courses:enroll'],
  ADMIN: PERMISSIONS,
  SUPERADMIN: PERMISSIONS,
};

export function permissionsFor(role: string): readonly Permission[] {
  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)
    ? ROLE_PERMISSIONS[role as Role]
    : [];
}
export function hasPermissions(
  role: string,
  required: readonly string[],
): boolean {
  const granted: readonly string[] = permissionsFor(role);
  return required.every((permission) => granted.includes(permission));
}
export function roleCatalog() {
  return Object.values(Role).map((role) => ({
    role,
    permissions: permissionsFor(role),
  }));
}

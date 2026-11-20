import { describe, expect, it } from 'vitest';

import type { User } from '@/types/auth';
import { getMaterialManagementCapabilities } from './material-management';

const material = { authorId: 'author-1' };
const baseUser: User = {
  id: 'student-1',
  username: 'student',
  email: 'student@example.com',
  role: 'USER',
  displayName: null,
  bio: null,
  avatarUrl: null,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('material management capabilities', () => {
  it('allows the owner to edit and delete', () => {
    expect(getMaterialManagementCapabilities(material, { ...baseUser, id: 'author-1' })).toEqual({
      canDelete: true,
      canEdit: true,
      canManage: true,
    });
  });

  it.each(['MODERATOR', 'ADMIN', 'SUPERADMIN'] as const)(
    'gives a %s no direct delete of another author’s material: staff retire it from a caso',
    (role) => {
      expect(getMaterialManagementCapabilities(material, { ...baseUser, role })).toEqual({
        canDelete: false,
        canEdit: false,
        canManage: false,
      });
    },
  );

  it('does not expose management to an ordinary viewer', () => {
    expect(getMaterialManagementCapabilities(material, baseUser)).toEqual({
      canDelete: false,
      canEdit: false,
      canManage: false,
    });
  });
});

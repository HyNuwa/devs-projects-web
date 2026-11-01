import { Role } from '../auth/dto/auth-response.dto';
import { hasPermissions, permissionsFor } from './permissions';

describe('Permission policy', () => {
  it('denies student and moderator management and unknown roles', () => {
    for (const role of [Role.USER, Role.MODERATOR, 'UNKNOWN']) {
      expect(hasPermissions(role, ['courses:manage'])).toBe(false);
      expect(hasPermissions(role, ['subjects:manage'])).toBe(false);
    }
    expect(permissionsFor('UNKNOWN')).toEqual([]);
  });
  it('requires every declared permission and denies unknown permissions', () => {
    expect(hasPermissions(Role.ADMIN, ['courses:manage', 'drive:manage'])).toBe(
      true,
    );
    expect(hasPermissions(Role.ADMIN, ['courses:manage', 'unknown'])).toBe(
      false,
    );
    expect(hasPermissions(Role.USER, ['courses:read', 'courses:manage'])).toBe(
      false,
    );
  });
});

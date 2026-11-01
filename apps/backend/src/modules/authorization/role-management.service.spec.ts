import { ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleManagementService } from './role-management.service';
import { Role } from '../auth/dto/auth-response.dto';

describe('Role management', () => {
  const tx = {
    $executeRaw: jest.fn(),
    user: { findUnique: jest.fn(), count: jest.fn(), update: jest.fn() },
    roleChangeAudit: { create: jest.fn() },
  };
  const db = {
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const service = new RoleManagementService(db as unknown as PrismaService);
  beforeEach(() => jest.clearAllMocks());
  it('refuses self changes without a write', async () => {
    await expect(
      service.assign(1, 1, { role: Role.USER, reason: 'Cambio solicitado' }),
    ).rejects.toThrow(ForbiddenException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('prevents ADMIN assigning SUPERADMIN', async () => {
    tx.user.findUnique
      .mockResolvedValueOnce({ id: 1, role: Role.ADMIN })
      .mockResolvedValueOnce({ id: 2, role: Role.USER });
    await expect(
      service.assign(1, 2, {
        role: Role.SUPERADMIN,
        reason: 'Cambio solicitado',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('prevents removing the last SUPERADMIN', async () => {
    tx.user.findUnique
      .mockResolvedValueOnce({ id: 1, role: Role.SUPERADMIN })
      .mockResolvedValueOnce({ id: 2, role: Role.SUPERADMIN });
    tx.user.count.mockResolvedValue(1);
    await expect(
      service.assign(1, 2, { role: Role.USER, reason: 'Cambio solicitado' }),
    ).rejects.toThrow(ConflictException);
  });
});

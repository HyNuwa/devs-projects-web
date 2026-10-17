import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { Prisma } from '../../generated/prisma';
import type { PrismaService } from '../../prisma/prisma.service';
import { InstitutionsService } from './institutions.service';

/** «Mi carrera» saves that overlap (openspec academic-structure/institutions). */
describe('InstitutionsService.replaceDeclaredCareers', () => {
  it('answers 409 when another save removed a row this one was updating', async () => {
    const prisma = {
      studyPlan: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'plan', careerId: 'career' }]),
      },
      $transaction: vi.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      ),
    } as unknown as PrismaService;
    const service = new InstitutionsService(prisma);

    await expect(
      service.replaceDeclaredCareers('user', [
        { careerId: 'career', status: 'ACTIVE' },
      ]),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

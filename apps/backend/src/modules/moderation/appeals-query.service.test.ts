import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service';
import { AppealsQueryService } from './appeals-query.service';

const moderator = { id: 'mod-2', role: 'MODERATOR' } as const;
const admin = { id: 'admin-1', role: 'ADMIN' } as const;

/** A pending appeal of an advertencia given with the retiro of an anonymous reseña. */
function sanctionAppeal(appellant: {
  id: string;
  role: string;
  username: string;
}) {
  return {
    id: `appeal-${appellant.role.toLowerCase()}`,
    kind: 'SANCTION',
    status: 'PENDING',
    createdAt: new Date('2026-09-29T12:00:00.000Z'),
    explanation: 'No insulté a nadie.',
    answer: null,
    answeredAt: null,
    decidedById: 'mod-1',
    appellant,
    case: null,
    sanction: {
      type: 'WARNING',
      reason: 'Insultos',
      startsAt: new Date('2026-09-28T12:00:00.000Z'),
      endsAt: null,
      case: {
        courseReview: { isAnonymous: true },
        examExperience: null,
      },
    },
  };
}

const student = { id: 'student-1', role: 'USER', username: 'estudiante_x' };
const staff = { id: 'mod-9', role: 'MODERATOR', username: 'moderador_y' };

describe('AppealsQueryService: sanciones from anonymous casos', () => {
  const prisma = {
    appeal: { findMany: vi.fn(), findUnique: vi.fn() },
    user: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 'mod-1', username: 'decisor' }]),
    },
  };
  let service: AppealsQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([
      { id: 'mod-1', username: 'decisor' },
    ]);
    service = new AppealsQueryService(prisma as unknown as PrismaService);
  });

  it('lists them read-only for a moderator, with «Autor oculto» and no username', async () => {
    prisma.appeal.findMany.mockResolvedValue([sanctionAppeal(student)]);

    const [item] = await service.list(moderator);

    expect(item).toEqual(
      expect.objectContaining({
        canAnswer: false,
        appellant: { hidden: true, username: null },
        decision: expect.objectContaining({
          kind: 'SANCTION',
          type: 'WARNING',
          anonymousCase: true,
        }),
      }),
    );
    const body = JSON.stringify(item);
    expect(body).not.toContain(student.username);
    expect(body).not.toContain(student.id);
  });

  it('looks the same for a moderator whatever the appellant’s role', async () => {
    prisma.appeal.findMany.mockResolvedValue([
      sanctionAppeal(student),
      sanctionAppeal(staff),
    ]);

    const [fromStudent, fromStaff] = await service.list(moderator);

    const { id: _a, ...a } = fromStudent;
    const { id: _b, ...b } = fromStaff;
    expect(a).toEqual(b);
  });

  it('shows the detail read-only to a moderator, without the explanation', async () => {
    prisma.appeal.findUnique.mockResolvedValue(sanctionAppeal(student));

    const detail = await service.detail(moderator, 'appeal-user');

    expect(detail).toEqual(
      expect.objectContaining({
        canAnswer: false,
        appellant: { hidden: true, username: null },
      }),
    );
    const body = JSON.stringify(detail);
    expect(body).not.toContain(student.username);
    expect(body).not.toContain('No insulté a nadie.');
  });

  it('lets an admin answer them, seeing the account', async () => {
    prisma.appeal.findMany.mockResolvedValue([sanctionAppeal(student)]);
    prisma.appeal.findUnique.mockResolvedValue(sanctionAppeal(student));

    const [item] = await service.list(admin);
    const detail = await service.detail(admin, 'appeal-user');

    expect(item).toEqual(
      expect.objectContaining({
        canAnswer: true,
        appellant: { hidden: false, username: student.username },
      }),
    );
    expect(detail).toEqual(
      expect.objectContaining({
        canAnswer: true,
        explanation: 'No insulté a nadie.',
        appellant: { hidden: false, username: student.username },
      }),
    );
  });

  it('keeps showing the appellant of a sanción from a signed caso to a moderator', async () => {
    const signed = sanctionAppeal(student);
    signed.sanction.case = {
      courseReview: { isAnonymous: false },
      examExperience: null,
    };
    prisma.appeal.findMany.mockResolvedValue([signed]);

    const [item] = await service.list(moderator);

    expect(item).toEqual(
      expect.objectContaining({
        canAnswer: true,
        appellant: { hidden: false, username: student.username },
      }),
    );
  });
});

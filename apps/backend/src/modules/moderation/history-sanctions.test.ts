import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from './cases.service';
import { HistoryService } from './history.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');

const event = (overrides: Record<string, unknown>) => ({
  id: 'ev',
  createdAt: NOW,
  actorId: 'mod-1',
  action: 'MUTED',
  targetType: null,
  materialId: null,
  courseReviewId: null,
  examExperienceId: null,
  targetUserId: 'author-1',
  caseId: null,
  reason: 'Motivo',
  metadata: null,
  ...overrides,
});

describe('sanciones, proposals and appeals in the history', () => {
  let service: HistoryService;
  const prisma = {
    moderationEvent: { findMany: vi.fn() },
    courseReview: {
      findMany: vi.fn().mockResolvedValue([{ id: 'rev-1', isAnonymous: true }]),
    },
    examExperience: { findMany: vi.fn().mockResolvedValue([]) },
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'mod-1', username: 'max' },
        { id: 'author-1', username: 'juan.p' },
      ]),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: CasesService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(HistoryService);
  });

  it('shows who silenced which account, with the reason', async () => {
    prisma.moderationEvent.findMany.mockResolvedValue([
      event({ action: 'MUTED', reason: 'Segundo retiro' }),
    ]);

    const page = await service.list({ role: 'MODERATOR' }, {});

    expect(page.items[0]).toEqual(
      expect.objectContaining({
        action: 'MUTED',
        actor: { system: false, username: 'max' },
        targetUser: { username: 'juan.p' },
        reason: 'Segundo retiro',
      }),
    );
  });

  it('does not list to moderators an advertencia given from an anonymous caso', async () => {
    prisma.moderationEvent.findMany.mockResolvedValue([
      event({
        action: 'WARNED',
        targetType: 'COURSE_REVIEW',
        courseReviewId: 'rev-1',
        caseId: 'case-1',
      }),
    ]);

    const page = await service.list({ role: 'MODERATOR' }, {});

    // Staff authors are skipped silently, so the row's existence would tell.
    expect(page.items).toEqual([]);
    expect(
      (await service.list({ role: 'ADMIN' }, {})).items[0].targetUser,
    ).toEqual({ username: 'juan.p' });
  });

  it('hides the appellant of an anonymous retiro, as actor and as target', async () => {
    prisma.moderationEvent.findMany.mockResolvedValue([
      event({
        action: 'APPEAL_FILED',
        actorId: 'author-1',
        targetType: 'COURSE_REVIEW',
        courseReviewId: 'rev-1',
        caseId: 'case-1',
        metadata: { kind: 'RETIRO' },
      }),
    ]);

    const page = await service.list({ role: 'MODERATOR' }, {});

    expect(page.items[0].actor).toEqual({
      system: false,
      username: null,
      hidden: true,
    });
    expect(JSON.stringify(page)).not.toContain('juan.p');
  });

  it('shows admins everything', async () => {
    prisma.moderationEvent.findMany.mockResolvedValue([
      event({
        action: 'APPEAL_FILED',
        actorId: 'author-1',
        targetType: 'COURSE_REVIEW',
        courseReviewId: 'rev-1',
        caseId: 'case-1',
      }),
    ]);

    const page = await service.list({ role: 'ADMIN' }, {});

    expect(page.items[0].actor).toEqual({ system: false, username: 'juan.p' });
  });

  it('filters by the new actions', async () => {
    prisma.moderationEvent.findMany.mockResolvedValue([]);

    await service.list(
      { role: 'MODERATOR' },
      { action: 'SUSPENSION_PROPOSED' },
    );

    expect(prisma.moderationEvent.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: 'SUSPENSION_PROPOSED' }),
      }),
    );
  });
});

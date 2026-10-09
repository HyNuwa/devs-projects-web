import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from './cases.service';
import { HistoryService } from './history.service';

const NOW = new Date('2026-09-29T12:00:00.000Z');

const events = [
  {
    id: 'ev-3',
    createdAt: NOW,
    actorId: 'mod-1',
    action: 'AUTHOR_REVEALED',
    targetType: 'COURSE_REVIEW',
    materialId: null,
    courseReviewId: 'rev-1',
    examExperienceId: null,
    targetUserId: 'author-2',
    caseId: 'case-2',
    reason: 'Evaluar reincidencia',
    metadata: { label: 'Reseña de cursada' },
  },
  {
    id: 'ev-2',
    createdAt: NOW,
    actorId: null,
    action: 'AUTO_HIDDEN',
    targetType: 'COURSE_REVIEW',
    materialId: null,
    courseReviewId: 'rev-1',
    examExperienceId: null,
    targetUserId: 'author-2',
    caseId: 'case-2',
    reason: '3 reportes en 48 h',
    metadata: { label: 'Reseña de cursada' },
  },
  {
    id: 'ev-1',
    createdAt: NOW,
    actorId: 'mod-1',
    action: 'REMOVED',
    targetType: 'MATERIAL',
    materialId: 'mat-1',
    courseReviewId: null,
    examExperienceId: null,
    targetUserId: 'author-1',
    caseId: 'case-1',
    reason: 'Datos personales visibles',
    metadata: { label: 'Parcial 1 escaneado' },
  },
];

describe('HistoryService', () => {
  let service: HistoryService;

  const prisma = {
    moderationEvent: { findMany: jest.fn(), create: jest.fn() },
    moderationCase: { findUnique: jest.fn() },
    courseReview: { findMany: jest.fn(), findUnique: jest.fn() },
    examExperience: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  };
  const cases = { authorSummary: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.moderationEvent.findMany.mockImplementation(
      async ({ where }: { where: { action?: { not: string } } }) =>
        events.filter((event) => event.action !== where.action?.not),
    );
    prisma.courseReview.findMany.mockResolvedValue([
      { id: 'rev-1', isAnonymous: true },
    ]);
    prisma.examExperience.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([
      { id: 'mod-1', username: 'max' },
      { id: 'author-1', username: 'tomi.g' },
      { id: 'author-2', username: 'juan.p' },
    ]);
    cases.authorSummary.mockResolvedValue({
      id: 'author-2',
      username: 'juan.p',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: CasesService, useValue: cases },
      ],
    }).compile();
    service = moduleRef.get(HistoryService);
  });

  describe('list', () => {
    it('hides revelación de autor records from moderators', async () => {
      const page = await service.list({ role: 'MODERATOR' }, {});

      expect(page.items.map((item) => item.action)).toEqual([
        'AUTO_HIDDEN',
        'REMOVED',
      ]);
      expect(prisma.moderationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { not: 'AUTHOR_REVEALED' },
          }),
        }),
      );
    });

    it('shows revelación de autor records to admins', async () => {
      const page = await service.list({ role: 'ADMIN' }, {});

      expect(page.items.map((item) => item.action)).toContain(
        'AUTHOR_REVEALED',
      );
    });

    it('attributes automatic actions to «Sistema»', async () => {
      const page = await service.list({ role: 'MODERATOR' }, {});

      expect(page.items[0]).toEqual(
        expect.objectContaining({
          actor: { system: true },
          reason: '3 reportes en 48 h',
        }),
      );
      expect(page.items[1]).toEqual(
        expect.objectContaining({ actor: { system: false, username: 'max' } }),
      );
    });

    it('does not link anonymous content to its author for moderators', async () => {
      const page = await service.list({ role: 'MODERATOR' }, {});

      expect(page.items[0].targetUser).toBeNull();
      expect(page.items[1].targetUser).toEqual({ username: 'tomi.g' });
      expect(JSON.stringify(page)).not.toContain('juan.p');
    });

    describe('when the author of an anonymous entry acts (a resubmission)', () => {
      const resubmitted = {
        id: 'ev-0',
        createdAt: NOW,
        actorId: 'author-2',
        action: 'RESUBMITTED',
        targetType: 'COURSE_REVIEW',
        materialId: null,
        courseReviewId: 'rev-1',
        examExperienceId: null,
        targetUserId: 'author-2',
        caseId: 'case-3',
        reason: null,
        metadata: { label: 'Reseña de cursada' },
      };

      it('shows moderators «Autor oculto» instead of the actor', async () => {
        prisma.moderationEvent.findMany.mockResolvedValueOnce([resubmitted]);

        const page = await service.list({ role: 'MODERATOR' }, {});

        expect(page.items[0].actor).toEqual({
          system: false,
          username: null,
          hidden: true,
        });
        expect(JSON.stringify(page)).not.toContain('juan.p');
      });

      it('does not let moderators find the entry by filtering on the actor', async () => {
        prisma.moderationEvent.findMany.mockResolvedValueOnce([resubmitted]);

        const page = await service.list(
          { role: 'MODERATOR' },
          { actorId: 'author-2' },
        );

        expect(page.items).toEqual([]);
      });

      it('shows admins who acted', async () => {
        prisma.moderationEvent.findMany.mockResolvedValueOnce([resubmitted]);

        const page = await service.list({ role: 'ADMIN' }, {});

        expect(page.items[0].actor).toEqual({
          system: false,
          username: 'juan.p',
        });
      });
    });

    it('applies filters and a cursor', async () => {
      await service.list(
        { role: 'ADMIN' },
        {
          action: 'REMOVED',
          actorId: 'mod-1',
          from: '2026-09-01',
          to: '2026-09-30',
          cursor: 'ev-9',
        },
      );

      expect(prisma.moderationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'REMOVED',
            actorId: 'mod-1',
            createdAt: {
              gte: new Date('2026-09-01'),
              lte: new Date('2026-09-30'),
            },
          }),
          cursor: { id: 'ev-9' },
          skip: 1,
        }),
      );
    });
  });

  describe('revealAuthor', () => {
    beforeEach(() => {
      prisma.moderationCase.findUnique.mockResolvedValue({
        id: 'case-2',
        targetType: 'COURSE_REVIEW',
        materialId: null,
        courseReviewId: 'rev-1',
        examExperienceId: null,
      });
      prisma.courseReview.findUnique.mockResolvedValue({
        userId: 'author-2',
        subjectId: 'sub-1',
        isAnonymous: true,
        publicationStatus: 'HIDDEN',
        hiddenAt: NOW,
      });
    });

    it('reveals the author of an anonymous entry and records why', async () => {
      const author = await service.revealAuthor(
        'case-2',
        'mod-1',
        'Evaluar reincidencia',
      );

      expect(author).toEqual({ id: 'author-2', username: 'juan.p' });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'mod-1',
          action: 'AUTHOR_REVEALED',
          courseReviewId: 'rev-1',
          targetUserId: 'author-2',
          caseId: 'case-2',
          reason: 'Evaluar reincidencia',
        }),
      });
    });

    it('keeps the author hidden without a reason', async () => {
      await expect(
        service.revealAuthor('case-2', 'mod-1', '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(cases.authorSummary).not.toHaveBeenCalled();
      expect(prisma.moderationEvent.create).not.toHaveBeenCalled();
    });

    it('refuses to reveal content that was not published anonymously', async () => {
      prisma.courseReview.findUnique.mockResolvedValue({
        userId: 'author-2',
        subjectId: 'sub-1',
        isAnonymous: false,
        publicationStatus: 'PUBLISHED',
        hiddenAt: null,
      });

      await expect(
        service.revealAuthor('case-2', 'mod-1', 'curiosidad'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

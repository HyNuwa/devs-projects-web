import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from './cases.service';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
const subject = { id: 'sub-1', code: 'ED-01', name: 'Estructura de Datos' };

const hiddenMaterialCase = {
  id: 'case-hidden',
  kind: 'REPORTS',
  status: 'OPEN',
  targetType: 'MATERIAL',
  materialId: 'mat-1',
  courseReviewId: null,
  examExperienceId: null,
  highPriority: true,
  openedAt: daysAgo(1),
  material: {
    id: 'mat-1',
    title: 'Parcial 1 escaneado',
    authorId: 'author-1',
    publicationStatus: 'HIDDEN',
    hiddenAt: daysAgo(1),
    subject,
  },
  courseReview: null,
  examExperience: null,
  reports: [
    {
      reason: 'DATOS_PERSONALES',
      explanation: 'Se ve el DNI',
      createdAt: daysAgo(1),
      reporterId: 'rep-1',
      reporter: { createdAt: daysAgo(200), emailVerified: true },
    },
  ],
};

const anonymousReviewCase = {
  ...hiddenMaterialCase,
  id: 'case-review',
  targetType: 'COURSE_REVIEW',
  materialId: null,
  courseReviewId: 'rev-1',
  highPriority: false,
  openedAt: daysAgo(9),
  material: null,
  courseReview: {
    id: 'rev-1',
    userId: 'author-2',
    isAnonymous: true,
    comment: 'No la cursen con Gómez',
    recommendation: 1,
    academicYear: 2025,
    publicationStatus: 'HIDDEN',
    hiddenAt: daysAgo(9),
    subject,
  },
};

describe('CasesService', () => {
  let service: CasesService;

  const prisma = {
    moderationCase: { findMany: jest.fn(), findUnique: jest.fn() },
    moderationEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    material: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.clearAllMocks();
    prisma.moderationCase.findMany.mockResolvedValue([
      hiddenMaterialCase,
      anonymousReviewCase,
    ]);
    prisma.moderationEvent.findFirst.mockResolvedValue(null);
    prisma.moderationEvent.count.mockResolvedValue(1);
    prisma.material.count.mockResolvedValue(14);
    prisma.user.findUnique.mockResolvedValue({
      id: 'author-1',
      username: 'tomi.g',
      displayName: null,
      createdAt: daysAgo(365),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [CasesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(CasesService);
  });

  afterEach(() => jest.useRealTimers());

  describe('queue', () => {
    it('groups open casos and never exposes reporter identities', async () => {
      const queue = await service.queue();

      expect(queue.hidden.map((entry) => entry.caseId)).toEqual([
        'case-review',
        'case-hidden',
      ]);
      expect(queue.hidden[1]).toEqual(
        expect.objectContaining({
          label: 'Parcial 1 escaneado',
          subject,
          reportCount: 1,
          topReason: 'DATOS_PERSONALES',
          highPriority: true,
        }),
      );
      expect(JSON.stringify(queue)).not.toContain('rep-1');
    });

    it('flags hidden content left unreviewed for more than 7 days and records it once', async () => {
      const queue = await service.queue();

      expect(queue.hidden[0]).toEqual(
        expect.objectContaining({ overdueHidden: true }),
      );
      expect(prisma.moderationEvent.create).toHaveBeenCalledTimes(1);
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: null,
          action: 'AUTO_UNHIDDEN_OVERDUE',
          caseId: 'case-review',
          courseReviewId: 'rev-1',
        }),
      });

      prisma.moderationEvent.findFirst.mockResolvedValue({ id: 'already' });
      await service.queue();
      expect(prisma.moderationEvent.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('detail', () => {
    it('hides the author of an anonymous entry', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue(anonymousReviewCase);

      const detail = await service.detail('case-review', 'mod-1');

      expect(detail.author).toEqual({ hidden: true });
      expect(JSON.stringify(detail)).not.toContain('author-2');
      expect(detail.target).toEqual(
        expect.objectContaining({
          type: 'COURSE_REVIEW',
          isAnonymous: true,
          comment: 'No la cursen con Gómez',
        }),
      );
    });

    it('shows a named author with their track record', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue(hiddenMaterialCase);

      const detail = await service.detail('case-hidden', 'mod-1');

      expect(detail.author).toEqual({
        hidden: false,
        id: 'author-1',
        username: 'tomi.g',
        displayName: null,
        accountCreatedAt: daysAgo(365),
        publishedMaterials: 14,
        removalsLast90Days: 1,
      });
      expect(detail.reports).toEqual([
        {
          reason: 'DATOS_PERSONALES',
          explanation: 'Se ve el DNI',
          createdAt: daysAgo(1),
          qualifiedReporter: true,
        },
      ]);
    });

    it('lets the moderator decide unless they wrote or reported the content', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue(hiddenMaterialCase);

      expect((await service.detail('case-hidden', 'mod-1')).viewer).toEqual({
        canDecide: true,
        conflict: null,
      });
      expect((await service.detail('case-hidden', 'author-1')).viewer).toEqual({
        canDecide: false,
        conflict: 'OWN_CONTENT',
      });
      expect((await service.detail('case-hidden', 'rep-1')).viewer).toEqual({
        canDecide: false,
        conflict: 'REPORTED',
      });
    });

    it('includes earlier casos about the same content', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue(hiddenMaterialCase);
      prisma.moderationCase.findMany.mockResolvedValue([
        {
          id: 'old-case',
          kind: 'REPORTS',
          decision: 'KEEP_VISIBLE',
          decisionReason: null,
          closedAt: daysAgo(30),
        },
      ]);

      const detail = await service.detail('case-hidden', 'mod-1');

      expect(detail.history).toEqual([
        {
          caseId: 'old-case',
          kind: 'REPORTS',
          decision: 'KEEP_VISIBLE',
          decisionReason: null,
          closedAt: daysAgo(30),
        },
      ]);
    });

    it('returns 404 for an unknown caso', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue(null);

      await expect(service.detail('nope', 'mod-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

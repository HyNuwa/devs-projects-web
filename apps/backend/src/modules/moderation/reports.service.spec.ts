import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from './reports.service';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);
const daysAgo = (days: number) => hoursAgo(days * 24);
const qualified = { createdAt: daysAgo(90), emailVerified: true };
const newcomer = { createdAt: daysAgo(1), emailVerified: true };

describe('ReportsService.file', () => {
  let service: ReportsService;

  const prisma = {
    material: { findUnique: jest.fn(), update: jest.fn() },
    courseReview: { findUnique: jest.fn(), update: jest.fn() },
    examExperience: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
    report: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    moderationCase: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moderationEvent: { create: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const publishedMaterial = {
    id: 'mat-1',
    title: 'Guía 2',
    authorId: 'author-1',
    isDeleted: false,
    publicationStatus: 'PUBLISHED',
    hiddenAt: null,
  };

  /** Open reportes already in the caso, plus the one being filed. */
  function openReports(
    ...reports: Array<{
      reporterId: string;
      reason?: string;
      hours?: number;
      reporter?: object;
    }>
  ) {
    prisma.report.findMany.mockResolvedValue(
      reports.map(
        ({
          reporterId,
          reason = 'INSULTOS_O_ACOSO',
          hours = 0,
          reporter = qualified,
        }) => ({
          reporterId,
          reason,
          createdAt: hoursAgo(hours),
          reporter,
        }),
      ),
    );
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.clearAllMocks();
    prisma.material.findUnique.mockResolvedValue(publishedMaterial);
    prisma.report.findFirst.mockResolvedValue(null);
    prisma.moderationCase.findFirst.mockResolvedValue(null);
    prisma.moderationCase.create.mockResolvedValue({
      id: 'case-1',
      highPriority: false,
    });
    prisma.report.create.mockResolvedValue({ id: 'report-1' });
    prisma.user.findUniqueOrThrow.mockResolvedValue(qualified);
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    openReports({ reporterId: 'reporter-1' });

    const moduleRef = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ReportsService);
  });

  afterEach(() => jest.useRealTimers());

  const file = (overrides: Record<string, unknown> = {}) =>
    service.file('reporter-1', {
      targetType: 'MATERIAL',
      targetId: 'mat-1',
      reason: 'NO_RELACIONADO',
      ...overrides,
    } as never);

  it('opens a caso for the first reporte and keeps the material visible', async () => {
    const result = await file();

    expect(result).toEqual({ status: 'RECEIVED' });
    expect(prisma.moderationCase.create).toHaveBeenCalledWith({
      data: { kind: 'REPORTS', targetType: 'MATERIAL', materialId: 'mat-1' },
    });
    expect(prisma.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: 'case-1',
        reporterId: 'reporter-1',
        reason: 'NO_RELACIONADO',
        targetType: 'MATERIAL',
        materialId: 'mat-1',
      }),
    });
    expect(prisma.material.update).not.toHaveBeenCalled();
  });

  it('serializes reportes on the same content before reading anything', async () => {
    await file();

    const [lockCall] = prisma.$executeRaw.mock.calls as unknown[][];
    expect((lockCall[0] as string[]).join('?')).toContain(
      'pg_advisory_xact_lock',
    );
    expect(lockCall).toContain('mat-1');
    expect(prisma.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.material.findUnique.mock.invocationCallOrder[0],
    );
    expect(prisma.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.moderationCase.findFirst.mock.invocationCallOrder[0],
    );
  });

  it('logs the rule that hid it, not an unqualified personal-data reporte', async () => {
    openReports(
      { reporterId: 'new', reason: 'DATOS_PERSONALES', reporter: newcomer },
      { reporterId: 'a', hours: 2 },
      { reporterId: 'b', hours: 1 },
      { reporterId: 'reporter-1' },
    );

    await file();

    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'AUTO_HIDDEN',
        reason: '3 reportes en 48 h',
      }),
    });
  });

  it('joins the open caso instead of opening another one', async () => {
    prisma.moderationCase.findFirst.mockResolvedValue({
      id: 'case-9',
      highPriority: false,
    });

    await file();

    expect(prisma.moderationCase.create).not.toHaveBeenCalled();
    expect(prisma.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ caseId: 'case-9' }),
    });
  });

  it('hides the material on the third qualified reporter within 48 hours, without touching points', async () => {
    openReports(
      { reporterId: 'a', hours: 30 },
      { reporterId: 'b', hours: 10 },
      { reporterId: 'reporter-1' },
    );

    await file();

    expect(prisma.material.update).toHaveBeenCalledWith({
      where: { id: 'mat-1' },
      data: {
        publicationStatus: 'HIDDEN',
        hiddenAt: NOW,
        statusChangedAt: NOW,
      },
    });
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: null,
        action: 'AUTO_HIDDEN',
        materialId: 'mat-1',
        caseId: 'case-1',
        targetUserId: 'author-1',
        reason: '3 reportes en 48 h',
      }),
    });
  });

  it('hides immediately on a qualified personal-data reporte and marks the caso urgent', async () => {
    openReports({ reporterId: 'reporter-1', reason: 'DATOS_PERSONALES' });

    await file({ reason: 'DATOS_PERSONALES' });

    expect(prisma.material.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publicationStatus: 'HIDDEN' }),
      }),
    );
    expect(prisma.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { highPriority: true },
    });
  });

  it('only raises priority for a personal-data reporte from a new account', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(newcomer);
    openReports({
      reporterId: 'reporter-1',
      reason: 'DATOS_PERSONALES',
      reporter: newcomer,
    });

    await file({ reason: 'DATOS_PERSONALES' });

    expect(prisma.material.update).not.toHaveBeenCalled();
    expect(prisma.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { highPriority: true },
    });
  });

  it('refuses a second reporte from the same account', async () => {
    prisma.report.findFirst.mockResolvedValue({ id: 'report-0' });

    await expect(file()).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('refuses reporting your own content', async () => {
    prisma.material.findUnique.mockResolvedValue({
      ...publishedMaterial,
      authorId: 'reporter-1',
    });

    await expect(file()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each(['PENDING_REVIEW', 'REJECTED', 'REMOVED'])(
    'refuses reporting content that is %s',
    async (publicationStatus) => {
      prisma.material.findUnique.mockResolvedValue({
        ...publishedMaterial,
        publicationStatus,
      });

      await expect(file()).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('reports an anonymous reseña by its author account without exposing it', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'rev-1',
      userId: 'author-2',
      isAnonymous: true,
      publicationStatus: 'PUBLISHED',
      hiddenAt: null,
    });

    const result = await file({
      targetType: 'COURSE_REVIEW',
      targetId: 'rev-1',
    });

    expect(result).toEqual({ status: 'RECEIVED' });
    expect(prisma.moderationCase.create).toHaveBeenCalledWith({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: 'rev-1',
      },
    });
  });
});

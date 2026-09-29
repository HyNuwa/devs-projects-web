import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { DecisionsService } from './decisions.service';

const NOW = new Date('2026-09-29T12:00:00.000Z');

type CaseFixture = {
  id: string;
  kind: 'REPORTS' | 'PRIOR_REVIEW';
  status: 'OPEN' | 'CLOSED';
  decision?: string | null;
  targetType: 'MATERIAL' | 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';
  materialId?: string | null;
  courseReviewId?: string | null;
  examExperienceId?: string | null;
  reports: Array<{ reporterId: string }>;
};

describe('DecisionsService.decide', () => {
  let service: DecisionsService;

  const prisma = {
    moderationCase: { findUnique: jest.fn(), update: jest.fn() },
    report: { updateMany: jest.fn() },
    moderationEvent: { create: jest.fn() },
    material: { findUnique: jest.fn(), update: jest.fn() },
    courseReview: { findUnique: jest.fn(), update: jest.fn() },
    examExperience: { findUnique: jest.fn(), update: jest.fn() },
    subject: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const points = { awardFor: jest.fn(), revertFor: jest.fn() };
  const materials = { publishStagedFile: jest.fn() };

  const material = (publicationStatus: string) => ({
    authorId: 'author-1',
    title: 'Parcial 1',
    subjectId: 'sub-1',
    isDeleted: false,
    publicationStatus,
    hiddenAt: publicationStatus === 'HIDDEN' ? NOW : null,
  });
  const review = (publicationStatus: string) => ({
    userId: 'author-2',
    subjectId: 'sub-1',
    isAnonymous: true,
    publicationStatus,
    hiddenAt: null,
  });

  function withCase(fixture: CaseFixture) {
    prisma.moderationCase.findUnique.mockResolvedValue({
      materialId: null,
      courseReviewId: null,
      examExperienceId: null,
      decision: null,
      ...fixture,
    });
  }

  const materialCase = (overrides: Partial<CaseFixture> = {}): CaseFixture => ({
    id: 'case-1',
    kind: 'REPORTS',
    status: 'OPEN',
    targetType: 'MATERIAL',
    materialId: 'mat-1',
    reports: [{ reporterId: 'reporter-1' }],
    ...overrides,
  });

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    materials.publishStagedFile.mockResolvedValue({
      fileUrl: 'https://drive/f',
      driveFileId: 'drive-1',
      drivePreviewUrl: 'https://drive/f/preview',
      driveDownloadUrl: 'https://drive/f/download',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: points },
        { provide: MaterialsService, useValue: materials },
      ],
    }).compile();
    service = moduleRef.get(DecisionsService);
  });

  afterEach(() => jest.useRealTimers());

  it('keeps a hidden material visible, dismisses its reportes and closes the caso', async () => {
    withCase(materialCase());
    prisma.material.findUnique.mockResolvedValue(material('HIDDEN'));

    const result = await service.decide('case-1', 'mod-1', {
      decision: 'KEEP_VISIBLE',
    });

    expect(result).toEqual({
      caseId: 'case-1',
      decision: 'KEEP_VISIBLE',
      status: 'PUBLISHED',
    });
    expect(prisma.material.update).toHaveBeenCalledWith({
      where: { id: 'mat-1' },
      data: expect.objectContaining({
        publicationStatus: 'PUBLISHED',
        hiddenAt: null,
      }),
    });
    expect(prisma.report.updateMany).toHaveBeenCalledWith({
      where: { caseId: 'case-1', status: 'OPEN' },
      data: { status: 'DISMISSED', resolvedAt: NOW },
    });
    expect(prisma.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: expect.objectContaining({
        status: 'CLOSED',
        closedAt: NOW,
        decision: 'KEEP_VISIBLE',
        decidedById: 'mod-1',
      }),
    });
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'mod-1',
        action: 'KEPT_VISIBLE',
        caseId: 'case-1',
      }),
    });
    expect(points.revertFor).not.toHaveBeenCalled();
  });

  it('retires a reseña with an author-facing reason, confirms reportes and reverts its points', async () => {
    withCase({
      id: 'case-2',
      kind: 'REPORTS',
      status: 'OPEN',
      targetType: 'COURSE_REVIEW',
      courseReviewId: 'rev-1',
      reports: [{ reporterId: 'reporter-1' }],
    });
    prisma.courseReview.findUnique.mockResolvedValue(review('HIDDEN'));

    await service.decide('case-2', 'mod-1', {
      decision: 'REMOVE',
      reason: 'Ataca a una persona en lugar de contar la cursada.',
    });

    expect(prisma.courseReview.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data: expect.objectContaining({
        publicationStatus: 'REMOVED',
        authorFacingReason:
          'Ataca a una persona en lugar de contar la cursada.',
      }),
    });
    expect(prisma.report.updateMany).toHaveBeenCalledWith({
      where: { caseId: 'case-2', status: 'OPEN' },
      data: { status: 'CONFIRMED', resolvedAt: NOW },
    });
    expect(points.revertFor).toHaveBeenCalledWith(prisma, 'rev-1');
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'REMOVED',
        targetUserId: 'author-2',
        reason: 'Ataca a una persona en lugar de contar la cursada.',
      }),
    });
  });

  it('removes a retired material from its materia count', async () => {
    withCase(materialCase());
    prisma.material.findUnique.mockResolvedValue(material('PUBLISHED'));

    await service.decide('case-1', 'mod-1', {
      decision: 'REMOVE',
      reason: 'Datos personales',
    });

    expect(prisma.subject.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { materialCount: { decrement: 1 } },
    });
  });

  it.each([
    ['REMOVE', 'REPORTS', 'PUBLISHED'],
    ['RESTORE', 'REPORTS', 'REMOVED'],
    ['REJECT', 'PRIOR_REVIEW', 'PENDING_REVIEW'],
  ] as const)('requires a reason to %s', async (decision, kind, status) => {
    withCase(
      materialCase({
        kind,
        status: decision === 'RESTORE' ? 'CLOSED' : 'OPEN',
        decision: decision === 'RESTORE' ? 'REMOVE' : null,
      }),
    );
    prisma.material.findUnique.mockResolvedValue(material(status));

    await expect(
      service.decide('case-1', 'mod-1', { decision, reason: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.moderationEvent.create).not.toHaveBeenCalled();
  });

  it('restores a retired material from its closed caso and re-awards its points', async () => {
    withCase(materialCase({ status: 'CLOSED', decision: 'REMOVE' }));
    prisma.material.findUnique.mockResolvedValue(material('REMOVED'));

    const result = await service.decide('case-1', 'mod-1', {
      decision: 'RESTORE',
      reason: 'Los datos ya estaban tapados.',
    });

    expect(result.status).toBe('PUBLISHED');
    expect(points.awardFor).toHaveBeenCalledWith(prisma, {
      userId: 'author-1',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'mat-1',
    });
    expect(prisma.subject.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { materialCount: { increment: 1 } },
    });
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'RESTORED',
        reason: 'Los datos ya estaban tapados.',
      }),
    });
    expect(prisma.moderationCase.update).not.toHaveBeenCalled();
  });

  it('approves a material in revisión previa: publishes its staged file, awards points and closes the caso', async () => {
    withCase(materialCase({ kind: 'PRIOR_REVIEW', reports: [] }));
    prisma.material.findUnique.mockResolvedValue(material('PENDING_REVIEW'));

    await service.decide('case-1', 'mod-1', { decision: 'APPROVE' });

    expect(materials.publishStagedFile).toHaveBeenCalledWith('mat-1');
    expect(prisma.material.update).toHaveBeenCalledWith({
      where: { id: 'mat-1' },
      data: expect.objectContaining({
        publicationStatus: 'PUBLISHED',
        fileUrl: 'https://drive/f',
        driveFileId: 'drive-1',
        stagedFilePath: null,
      }),
    });
    expect(points.awardFor).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        userId: 'author-1',
        amount: 10,
        referenceId: 'mat-1',
      }),
    );
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PRIOR_REVIEW_APPROVED' }),
    });
  });

  it('rejects a revisión previa with a reason the author will see, without points', async () => {
    withCase(materialCase({ kind: 'PRIOR_REVIEW', reports: [] }));
    prisma.material.findUnique.mockResolvedValue(material('PENDING_REVIEW'));

    await service.decide('case-1', 'mod-1', {
      decision: 'REJECT',
      reason: 'Tapá los DNI y volvé a enviarlo.',
    });

    expect(prisma.material.update).toHaveBeenCalledWith({
      where: { id: 'mat-1' },
      data: expect.objectContaining({
        publicationStatus: 'REJECTED',
        authorFacingReason: 'Tapá los DNI y volvé a enviarlo.',
      }),
    });
    expect(materials.publishStagedFile).not.toHaveBeenCalled();
    expect(points.awardFor).not.toHaveBeenCalled();
  });

  it.each([
    ['their own content', 'author-1'],
    ['a caso they reported', 'reporter-1'],
  ])('refuses a decision on %s', async (_label, moderatorId) => {
    withCase(materialCase());
    prisma.material.findUnique.mockResolvedValue(material('HIDDEN'));

    await expect(
      service.decide('case-1', moderatorId, { decision: 'KEEP_VISIBLE' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.material.update).not.toHaveBeenCalled();
  });

  it('refuses deciding a closed caso again', async () => {
    withCase(materialCase({ status: 'CLOSED', decision: 'KEEP_VISIBLE' }));
    prisma.material.findUnique.mockResolvedValue(material('PUBLISHED'));

    await expect(
      service.decide('case-1', 'mod-1', {
        decision: 'REMOVE',
        reason: 'tarde',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses restoring content that is not retired', async () => {
    withCase(materialCase({ status: 'CLOSED', decision: 'REMOVE' }));
    prisma.material.findUnique.mockResolvedValue(material('PUBLISHED'));

    await expect(
      service.decide('case-1', 'mod-1', {
        decision: 'RESTORE',
        reason: 'error',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

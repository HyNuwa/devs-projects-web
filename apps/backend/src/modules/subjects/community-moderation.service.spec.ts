import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CommunityModerationActionType,
  CommunityReportReason,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/dto/auth-response.dto';
import { CommunityModerationService } from './community-moderation.service';

const createdAt = new Date('2026-08-28T12:00:00.000Z');
const removedAt = new Date('2026-08-28T13:00:00.000Z');
const author = {
  id: '10000000-0000-4000-8000-000000000001',
  username: 'estudiante',
  displayName: 'Estudiante Uno',
  avatarUrl: '/avatar.png',
};
const visibleTarget = {
  id: '30000000-0000-4000-8000-000000000001',
  userId: author.id,
  subjectId: '20000000-0000-4000-8000-000000000001',
  isAnonymous: true,
  isRemoved: false,
  removedReason: null,
  removedAt: null,
  createdAt,
  updatedAt: createdAt,
  user: author,
};

describe('CommunityModerationService', () => {
  let service: CommunityModerationService;

  const transaction = {
    courseReview: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    examExperience: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    communityReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    communityModerationAction: { create: jest.fn() },
  };
  const prisma = {
    ...transaction,
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityModerationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CommunityModerationService);
  });

  it('registra un reporte categorizado sin modificar la visibilidad', async () => {
    transaction.courseReview.findFirst.mockResolvedValue({
      id: visibleTarget.id,
    });
    transaction.communityReport.create.mockResolvedValue({
      id: 'report-1',
      reason: CommunityReportReason.POSIBLEMENTE_ENGANOSO,
      explanation: 'El dato de la mesa parece incorrecto.',
      createdAt,
    });

    const result = await service.reportReview(visibleTarget.id, 'reporter-1', {
      reason: CommunityReportReason.POSIBLEMENTE_ENGANOSO,
      explanation: 'El dato de la mesa parece incorrecto.',
    });

    expect(result.id).toBe('report-1');
    expect(transaction.courseReview.findFirst).toHaveBeenCalledWith({
      where: { id: visibleTarget.id, isRemoved: false },
      select: { id: true },
    });
    expect(transaction.communityReport.create).toHaveBeenCalledWith({
      data: {
        reporterId: 'reporter-1',
        reason: CommunityReportReason.POSIBLEMENTE_ENGANOSO,
        explanation: 'El dato de la mesa parece incorrecto.',
        courseReviewId: visibleTarget.id,
      },
      select: {
        id: true,
        reason: true,
        explanation: true,
        createdAt: true,
      },
    });
    expect(transaction.courseReview.update).not.toHaveBeenCalled();
  });

  it('registra reportes de finales y rechaza objetivos no visibles', async () => {
    transaction.examExperience.findFirst.mockResolvedValueOnce({
      id: 'exam-1',
    });
    transaction.communityReport.create.mockResolvedValue({ id: 'report-2' });

    await service.reportExam('exam-1', 'reporter-1', {
      reason: CommunityReportReason.SPAM_O_REPETIDO,
    });

    expect(transaction.communityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ examExperienceId: 'exam-1' }),
      }),
    );

    transaction.examExperience.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.reportExam('exam-removed', 'reporter-1', {
        reason: CommunityReportReason.NO_RELACIONADO,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('retira una reseña y guarda evidencia inmutable del moderador y autor', async () => {
    transaction.courseReview.findUnique.mockResolvedValue(visibleTarget);
    transaction.courseReview.update.mockImplementation(({ data }) => ({
      ...visibleTarget,
      ...data,
    }));
    transaction.communityModerationAction.create.mockResolvedValue({
      id: 'action-1',
      action: CommunityModerationActionType.REMOVE,
      reason: 'Expone datos personales',
      createdAt: removedAt,
    });

    const result = await service.removeReview(visibleTarget.id, 'moderator-1', {
      reason: 'Expone datos personales',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.courseReview.update).toHaveBeenCalledWith({
      where: { id: visibleTarget.id },
      data: {
        isRemoved: true,
        removedReason: 'Expone datos personales',
        removedAt: expect.any(Date),
        removedById: 'moderator-1',
      },
      select: expect.any(Object),
    });
    expect(transaction.communityModerationAction.create).toHaveBeenCalledWith({
      data: {
        moderatorId: 'moderator-1',
        authorId: author.id,
        action: CommunityModerationActionType.REMOVE,
        reason: 'Expone datos personales',
        courseReviewId: visibleTarget.id,
      },
      select: expect.any(Object),
    });
    expect(result.target.author).toEqual(author);
    expect(result.target.moderation).toEqual({
      isRemoved: true,
      reason: 'Expone datos personales',
      date: expect.any(Date),
    });
  });

  it('restaura el mismo final y agrega una acción RESTORE sin recrearlo', async () => {
    const removedTarget = {
      ...visibleTarget,
      id: 'exam-1',
      isRemoved: true,
      removedReason: 'Contenido ajeno a la materia',
      removedAt,
    };
    transaction.examExperience.findUnique.mockResolvedValue(removedTarget);
    transaction.examExperience.update.mockImplementation(({ data }) => ({
      ...removedTarget,
      ...data,
    }));
    transaction.communityModerationAction.create.mockResolvedValue({
      id: 'action-2',
      action: CommunityModerationActionType.RESTORE,
      reason: 'La revisión confirmó que corresponde a la materia',
      createdAt,
    });

    const result = await service.restoreExam('exam-1', 'moderator-1', {
      reason: 'La revisión confirmó que corresponde a la materia',
    });

    expect(transaction.examExperience.update).toHaveBeenCalledWith({
      where: { id: 'exam-1' },
      data: {
        isRemoved: false,
        removedReason: null,
        removedAt: null,
        removedById: null,
      },
      select: expect.any(Object),
    });
    expect(transaction.communityModerationAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: CommunityModerationActionType.RESTORE,
        examExperienceId: 'exam-1',
        authorId: author.id,
      }),
      select: expect.any(Object),
    });
    expect(result.target.id).toBe('exam-1');
    expect(result.target.moderation).toEqual({
      isRemoved: false,
      reason: null,
      date: null,
    });
  });

  it('no duplica acciones de retiro o restauración ya aplicadas', async () => {
    transaction.courseReview.findUnique.mockResolvedValue({
      ...visibleTarget,
      isRemoved: true,
    });
    await expect(
      service.removeReview(visibleTarget.id, 'moderator-1', {
        reason: 'Motivo repetido',
      }),
    ).rejects.toThrow(ConflictException);

    transaction.examExperience.findUnique.mockResolvedValue(visibleTarget);
    await expect(
      service.restoreExam(visibleTarget.id, 'moderator-1', {
        reason: 'Restauración repetida',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaction.communityModerationAction.create).not.toHaveBeenCalled();
  });

  it('muestra al autor el motivo y fecha, pero bloquea a terceros', async () => {
    transaction.courseReview.findUnique.mockResolvedValue({
      ...visibleTarget,
      isRemoved: true,
      removedReason: 'Expone datos personales',
      removedAt,
    });

    const result = await service.getReviewManagementView(visibleTarget.id, {
      id: author.id,
      role: Role.USER,
    });

    expect(result.moderation).toEqual({
      isRemoved: true,
      reason: 'Expone datos personales',
      date: removedAt,
    });
    expect(result).not.toHaveProperty('removedById');

    await expect(
      service.getReviewManagementView(visibleTarget.id, {
        id: 'other-user',
        role: Role.USER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite al moderador resolver la autoría real de una entrada anónima', async () => {
    transaction.examExperience.findUnique.mockResolvedValue(visibleTarget);

    const result = await service.getExamManagementView(visibleTarget.id, {
      id: 'moderator-1',
      role: Role.MODERATOR,
    });

    expect(result.isAnonymous).toBe(true);
    expect(result.author).toEqual(author);
  });

  it('proyecta una cola acotada con la autoría real solo para moderación', async () => {
    transaction.communityReport.findMany.mockResolvedValue([
      {
        id: 'report-1',
        reason: CommunityReportReason.DATOS_PERSONALES,
        explanation: null,
        createdAt,
        courseReview: {
          id: visibleTarget.id,
          isAnonymous: true,
          isRemoved: false,
          user: author,
          subject: {
            id: visibleTarget.subjectId,
            code: 'ED-01',
            name: 'Estructura de Datos',
          },
        },
        examExperience: null,
      },
    ]);

    const result = await service.listReports();

    expect(transaction.communityReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
    expect(result[0].target).toEqual(
      expect.objectContaining({
        type: 'COURSE_REVIEW',
        isAnonymous: true,
        author,
      }),
    );
  });
});

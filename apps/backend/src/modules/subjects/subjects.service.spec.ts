import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  ExamFormat,
  ExamOutcome,
  ExamSession,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { SubjectsService } from './subjects.service';

describe('SubjectsService community writes', () => {
  let service: SubjectsService;
  let findByCodeSpy: jest.SpyInstance;

  const prisma = {
    subject: { findFirst: jest.fn() },
    subjectProfessor: { findUnique: jest.fn() },
    courseReview: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    examExperience: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    material: { count: jest.fn() },
  };
  const pointService = { awardPoints: jest.fn() };
  const configService = {
    get: jest.fn((_key: string, fallback: unknown) => fallback),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.subjectProfessor.findUnique.mockResolvedValue({ id: 'link-1' });
    prisma.courseReview.findFirst.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: pointService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(SubjectsService);
    findByCodeSpy = jest
      .spyOn(service, 'findByCode')
      .mockResolvedValue({ id: 'sub-1' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('crea reseñas independientes aunque compartan autor, materia, año y franja', async () => {
    prisma.courseReview.create
      .mockResolvedValueOnce({ id: 'review-1' })
      .mockResolvedValueOnce({ id: 'review-2' });
    const dto = {
      academicYear: 2026,
      condition: CourseCondition.REGULAR,
      attempt: CourseAttempt.PRIMERA_CURSADA,
      recommendation: 4,
      comment:
        'La cursada tuvo ejercicios y evaluaciones claramente explicadas.',
    };

    await service.createReview('ED-01', 'user-1', dto);
    await service.createReview('ED-01', 'user-1', dto);

    expect(prisma.courseReview.create).toHaveBeenCalledTimes(2);
    expect(prisma.courseReview.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        userId: 'user-1',
        subjectId: 'sub-1',
        academicYear: 2026,
        attempt: CourseAttempt.PRIMERA_CURSADA,
        comment: dto.comment,
      }),
    });
    expect(pointService.awardPoints).toHaveBeenNthCalledWith(
      1,
      'user-1',
      5,
      'COURSE_REVIEWED',
      'review-1',
    );
  });

  it('advierte sobre un duplicado probable sin sobrescribir ni publicar', async () => {
    prisma.courseReview.findFirst.mockResolvedValue({
      id: 'review-previous',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
    });

    await expect(
      service.createReview('ED-01', 'user-1', {
        academicYear: 2026,
        condition: CourseCondition.REGULAR,
        attempt: CourseAttempt.PRIMERA_CURSADA,
        recommendation: 4,
        comment:
          'La cursada tuvo ejercicios y evaluaciones claramente explicadas.',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'PROBABLE_DUPLICATE',
        probableDuplicate: expect.objectContaining({ id: 'review-previous' }),
      }),
    });

    expect(prisma.courseReview.create).not.toHaveBeenCalled();
    expect(pointService.awardPoints).not.toHaveBeenCalled();
  });

  it('publica una cursada independiente cuando el autor confirma el aviso', async () => {
    prisma.courseReview.findFirst.mockResolvedValue({
      id: 'review-previous',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
    });
    prisma.courseReview.create.mockResolvedValue({ id: 'review-confirmed' });

    await service.createReview('ED-01', 'user-1', {
      academicYear: 2026,
      condition: CourseCondition.REGULAR,
      attempt: CourseAttempt.PRIMERA_CURSADA,
      recommendation: 5,
      comment:
        'Esta segunda cursada tuvo otra comisión y una experiencia diferente.',
      isAnonymous: true,
      confirmProbableDuplicate: true,
    });

    expect(prisma.courseReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        subjectId: 'sub-1',
        isAnonymous: true,
      }),
    });
    expect(prisma.courseReview.create.mock.calls[0][0].data).not.toHaveProperty(
      'id',
    );
    expect(prisma.courseReview.create.mock.calls[0][0].data).not.toHaveProperty(
      'confirmProbableDuplicate',
    );
  });

  it('permite al autor editar la misma reseña y conserva su identidad', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-1',
      subjectId: 'sub-1',
    });
    prisma.courseReview.update.mockResolvedValue({
      id: 'review-1',
      recommendation: 5,
    });

    const result = await service.updateReview('review-1', 'user-1', {
      academicYear: 2026,
      condition: CourseCondition.PROMO,
      attempt: CourseAttempt.PRIMERA_CURSADA,
      recommendation: 5,
      comment:
        'Actualicé la reseña con el resultado final y el contexto completo.',
      isAnonymous: true,
    });

    expect(result.id).toBe('review-1');
    expect(prisma.courseReview.update).toHaveBeenCalledWith({
      where: { id: 'review-1' },
      data: expect.objectContaining({
        condition: CourseCondition.PROMO,
        isAnonymous: true,
      }),
    });
    expect(pointService.awardPoints).not.toHaveBeenCalled();
  });

  it('impide editar o eliminar una reseña ajena', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'owner-1',
      subjectId: 'sub-1',
    });
    const dto = {
      academicYear: 2026,
      condition: CourseCondition.REGULAR,
      attempt: CourseAttempt.PRIMERA_CURSADA,
      recommendation: 4,
      comment:
        'La cursada tuvo ejercicios y evaluaciones claramente explicadas.',
    };

    await expect(
      service.updateReview('review-1', 'user-1', dto),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.deleteReview('review-1', 'user-1')).rejects.toThrow(
      ForbiddenException,
    );

    expect(prisma.courseReview.update).not.toHaveBeenCalled();
    expect(prisma.courseReview.delete).not.toHaveBeenCalled();
  });

  it('elimina permanentemente la reseña cuando lo solicita su autor', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-1',
    });
    prisma.courseReview.delete.mockResolvedValue({ id: 'review-1' });

    await expect(service.deleteReview('review-1', 'user-1')).resolves.toEqual({
      message: 'Reseña eliminada',
    });
    expect(prisma.courseReview.delete).toHaveBeenCalledWith({
      where: { id: 'review-1' },
    });
  });

  it('crea finales con dificultad general y sin escribir dificultad legacy', async () => {
    prisma.examExperience.create.mockResolvedValue({ id: 'exam-1' });

    await service.createExam('ED-01', 'user-1', {
      year: 2026,
      session: ExamSession.JULIO,
      format: ExamFormat.ORAL,
      difficulty: CommunityDifficulty.ALTA,
      outcome: ExamOutcome.APROBADO,
      grade: 8,
      isAnonymous: true,
      comment:
        'La mesa evaluó conceptos centrales y permitió justificar cada decisión.',
    });

    expect(prisma.examExperience.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        difficultyTheory: expect.anything(),
        difficultyPractice: expect.anything(),
      }),
    });
    expect(prisma.examExperience.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subjectId: 'sub-1',
        difficulty: CommunityDifficulty.ALTA,
        outcome: ExamOutcome.APROBADO,
        grade: 8,
        isAnonymous: true,
      }),
    });
  });

  it('crea intentos de final independientes sin deduplicarlos', async () => {
    prisma.examExperience.create
      .mockResolvedValueOnce({ id: 'exam-1' })
      .mockResolvedValueOnce({ id: 'exam-2' });
    const dto = {
      year: 2026,
      session: ExamSession.JULIO,
      format: ExamFormat.ESCRITO,
      comment:
        'La mesa tomó los mismos temas, pero este fue un intento independiente.',
    };

    await service.createExam('ED-01', 'user-1', dto);
    await service.createExam('ED-01', 'user-1', dto);

    expect(prisma.examExperience.create).toHaveBeenCalledTimes(2);
    expect(pointService.awardPoints).toHaveBeenNthCalledWith(
      2,
      'user-1',
      5,
      'EXAM_EXPERIENCE_SHARED',
      'exam-2',
    );
  });

  it('permite al autor editar el mismo intento con el contrato completo', async () => {
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'user-1',
      subjectId: 'sub-1',
    });
    prisma.examExperience.update.mockResolvedValue({
      id: 'exam-1',
      grade: 4,
    });

    const result = await service.updateExam('exam-1', 'user-1', {
      year: 2026,
      session: ExamSession.DICIEMBRE,
      format: ExamFormat.ORAL,
      difficulty: CommunityDifficulty.MEDIA,
      outcome: ExamOutcome.DESAPROBADO,
      grade: 4,
      comment:
        'Actualicé la experiencia con el resultado y el contexto completo.',
      isAnonymous: true,
    });

    expect(result.id).toBe('exam-1');
    expect(prisma.examExperience.update).toHaveBeenCalledWith({
      where: { id: 'exam-1' },
      data: expect.objectContaining({
        session: ExamSession.DICIEMBRE,
        difficulty: CommunityDifficulty.MEDIA,
        outcome: ExamOutcome.DESAPROBADO,
        grade: 4,
        isAnonymous: true,
      }),
    });
    expect(
      prisma.examExperience.update.mock.calls[0][0].data,
    ).not.toHaveProperty('difficultyTheory');
    expect(
      prisma.examExperience.update.mock.calls[0][0].data,
    ).not.toHaveProperty('difficultyPractice');
    expect(pointService.awardPoints).not.toHaveBeenCalled();
  });

  it('impide editar o eliminar una experiencia de final ajena', async () => {
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'owner-1',
      subjectId: 'sub-1',
    });
    const dto = {
      year: 2026,
      session: ExamSession.JULIO,
      format: ExamFormat.ORAL,
      comment:
        'La mesa evaluó conceptos centrales y permitió justificar cada decisión.',
    };

    await expect(service.updateExam('exam-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.deleteExam('exam-1', 'user-1')).rejects.toThrow(
      ForbiddenException,
    );

    expect(prisma.examExperience.update).not.toHaveBeenCalled();
    expect(prisma.examExperience.delete).not.toHaveBeenCalled();
  });

  it('elimina permanentemente la experiencia cuando lo solicita su autor', async () => {
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'user-1',
    });
    prisma.examExperience.delete.mockResolvedValue({ id: 'exam-1' });

    await expect(service.deleteExam('exam-1', 'user-1')).resolves.toEqual({
      message: 'Experiencia de final eliminada',
    });
    expect(prisma.examExperience.delete).toHaveBeenCalledWith({
      where: { id: 'exam-1' },
    });
  });

  it('rechaza profesores que no pertenecen a la materia', async () => {
    prisma.subjectProfessor.findUnique.mockResolvedValue(null);

    await expect(
      service.createReview('ED-01', 'user-1', {
        academicYear: 2026,
        condition: CourseCondition.REGULAR,
        attempt: CourseAttempt.PRIMERA_CURSADA,
        professorId: '30000000-0000-4000-8000-000000000001',
        recommendation: 4,
        comment:
          'La cursada tuvo ejercicios y evaluaciones claramente explicadas.',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.courseReview.create).not.toHaveBeenCalled();
  });

  it('cuenta sólo materiales aprobados y no eliminados en el hub', async () => {
    findByCodeSpy.mockRestore();
    prisma.subject.findFirst.mockResolvedValue({
      id: 'sub-1',
      code: 'ED-01',
      name: 'Estructura de Datos',
      studyPlans: [],
      professors: [],
    });
    prisma.courseReview.aggregate.mockResolvedValue({
      _avg: { recommendation: null },
      _count: 0,
    });
    prisma.examExperience.count.mockResolvedValue(0);
    prisma.material.count.mockResolvedValue(2);

    const result = await service.findByCode('ED-01');

    expect(result.stats.materialCount).toBe(2);
    expect(prisma.courseReview.aggregate).toHaveBeenCalledWith({
      where: { subjectId: 'sub-1', isRemoved: false },
      _avg: { recommendation: true },
      _count: true,
    });
    expect(prisma.examExperience.count).toHaveBeenCalledWith({
      where: { subjectId: 'sub-1', isRemoved: false },
    });
    expect(prisma.material.count).toHaveBeenCalledWith({
      where: {
        subjectId: 'sub-1',
        moderationStatus: 'APPROVED',
        isDeleted: false,
      },
    });
  });

  it('excluye reseñas retiradas y protege la identidad pública anónima', async () => {
    prisma.courseReview.findMany.mockResolvedValue([
      {
        id: 'review-1',
        subjectId: 'sub-1',
        isAnonymous: true,
        isRemoved: false,
        removedReason: null,
        removedAt: null,
        removedById: null,
        recommendation: 5,
        user: {
          id: 'user-1',
          username: 'identidad-privada',
          displayName: 'Identidad Privada',
          avatarUrl: '/avatar.png',
        },
      },
    ]);
    prisma.courseReview.groupBy.mockResolvedValue([
      { condition: CourseCondition.PROMO, _count: 1 },
    ]);

    const result = await service.getReviews('ED-01');

    expect(prisma.courseReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subjectId: 'sub-1', isRemoved: false },
      }),
    );
    expect(prisma.courseReview.groupBy).toHaveBeenCalledWith({
      by: ['condition'],
      where: { subjectId: 'sub-1', isRemoved: false },
      _count: true,
    });
    expect(result.reviews[0]).toEqual(
      expect.objectContaining({
        id: 'review-1',
        user: { username: 'Anónimo' },
      }),
    );
    expect(result.reviews[0]).not.toHaveProperty('removedReason');
    expect(result.reviews[0]).not.toHaveProperty('removedAt');
    expect(result.reviews[0]).not.toHaveProperty('removedById');
    expect(result.reviews[0]).not.toHaveProperty('isRemoved');
  });

  it('excluye finales retirados y no expone avatar ni alias estable al anónimo', async () => {
    prisma.examExperience.findMany.mockResolvedValue([
      {
        id: 'exam-1',
        subjectId: 'sub-1',
        isAnonymous: true,
        isRemoved: false,
        removedReason: null,
        removedAt: null,
        removedById: null,
        year: 2026,
        user: {
          id: 'user-1',
          username: 'identidad-privada',
          displayName: 'Identidad Privada',
          avatarUrl: '/avatar.png',
        },
        professor: null,
      },
    ]);

    const result = await service.getExams('ED-01');

    expect(prisma.examExperience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subjectId: 'sub-1', isRemoved: false },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'exam-1',
        user: { username: 'Anónimo' },
      }),
    );
    expect(result[0]).not.toHaveProperty('removedReason');
    expect(result[0]).not.toHaveProperty('removedAt');
    expect(result[0]).not.toHaveProperty('removedById');
    expect(result[0]).not.toHaveProperty('isRemoved');
  });
});

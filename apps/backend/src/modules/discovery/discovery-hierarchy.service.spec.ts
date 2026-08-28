import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService hierarchy read model', () => {
  let service: DiscoveryService;

  const prisma = {
    career: { findMany: jest.fn(), findUnique: jest.fn() },
    studyPlan: { findMany: jest.fn(), findFirst: jest.fn() },
    studyPlanSubject: { groupBy: jest.fn(), findMany: jest.fn() },
    subject: { findUnique: jest.fn() },
    material: { groupBy: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('lista carreras con identificadores estables, conteo y límite', async () => {
    prisma.career.findMany.mockResolvedValue([
      {
        id: 'career-1',
        name: 'Ingeniería Informática',
        code: 'II',
        _count: { studyPlans: 2 },
      },
      {
        id: 'career-2',
        name: 'Ingeniería en Minas',
        code: 'IM',
        _count: { studyPlans: 1 },
      },
    ]);

    await expect(service.getCareers({ limit: 1 })).resolves.toEqual({
      careers: [
        {
          id: 'career-1',
          name: 'Ingeniería Informática',
          code: 'II',
          studyPlanCount: 2,
        },
      ],
      hasMore: true,
    });
    expect(prisma.career.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2 }),
    );
  });

  it('agrupa años por plan con conteos sin cargar materias una por una', async () => {
    prisma.career.findUnique.mockResolvedValue({
      id: 'career-1',
      name: 'Ingeniería Informática',
      code: 'II',
      _count: { studyPlans: 2 },
    });
    prisma.studyPlanSubject.groupBy.mockResolvedValue([
      { studyPlanId: 'plan-2', year: 2, _count: { _all: 3 } },
      { studyPlanId: 'plan-1', year: 1, _count: { _all: 4 } },
      { studyPlanId: 'plan-1', year: 2, _count: { _all: 5 } },
    ]);
    prisma.studyPlan.findMany.mockResolvedValue([
      { id: 'plan-1', name: 'Plan 2023', code: 'II-2023' },
      { id: 'plan-2', name: 'Plan 2024', code: 'II-2024' },
    ]);

    const result = await service.getCurriculumYears('career-1', { limit: 2 });

    expect(result.years).toEqual([
      {
        id: 'plan-1:1',
        year: 1,
        studyPlan: { id: 'plan-1', name: 'Plan 2023', code: 'II-2023' },
        subjectCount: 4,
      },
      {
        id: 'plan-1:2',
        year: 2,
        studyPlan: { id: 'plan-1', name: 'Plan 2023', code: 'II-2023' },
        subjectCount: 5,
      },
    ]);
    expect(result.hasMore).toBe(true);
    expect(prisma.studyPlanSubject.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.studyPlan.findMany).toHaveBeenCalledTimes(1);
  });

  it('mantiene un año vacío como contexto válido de una carrera y plan existentes', async () => {
    prisma.studyPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      name: 'Plan 2023',
      code: 'II-2023',
      career: {
        id: 'career-1',
        name: 'Ingeniería Informática',
        code: 'II',
        _count: { studyPlans: 1 },
      },
    });
    prisma.studyPlanSubject.findMany.mockResolvedValue([]);

    await expect(
      service.getSubjects('career-1', 'plan-1', 5, {}),
    ).resolves.toMatchObject({ year: 5, subjects: [], hasMore: false });
  });

  it('proyecta materias con el conteo sólo de materiales aprobados', async () => {
    prisma.studyPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      name: 'Plan 2023',
      code: 'II-2023',
      career: {
        id: 'career-1',
        name: 'Ingeniería Informática',
        code: 'II',
        _count: { studyPlans: 1 },
      },
    });
    prisma.studyPlanSubject.findMany.mockResolvedValue([
      {
        id: 'assignment-1',
        semester: 1,
        credits: 8,
        subject: {
          id: 'subject-1',
          name: 'Álgebra Lineal',
          code: 'AL-01',
          _count: { materials: 2 },
        },
      },
    ]);

    const result = await service.getSubjects('career-1', 'plan-1', 1, {});

    expect(result.subjects).toEqual([
      expect.objectContaining({
        id: 'subject-1',
        curriculumAssignmentId: 'assignment-1',
        approvedMaterialCount: 2,
      }),
    ]);
    expect(prisma.studyPlanSubject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          subject: expect.objectContaining({
            select: expect.objectContaining({
              _count: expect.objectContaining({
                select: expect.objectContaining({
                  materials: expect.objectContaining({
                    where: expect.objectContaining({
                      moderationStatus: 'APPROVED',
                      isDeleted: false,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    );
  });

  it('devuelve categorías y archivos aprobados sin consultas por fila', async () => {
    prisma.subject.findUnique.mockResolvedValue({
      id: 'subject-1',
      name: 'Álgebra Lineal',
      code: 'AL-01',
    });
    prisma.material.groupBy.mockResolvedValue([
      { resourceType: 'APUNTE', _count: { _all: 3 } },
    ]);
    prisma.material.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'Apunte de vectores',
        fileType: 'pdf',
        resourceType: 'APUNTE',
        academicYear: 2026,
        createdAt: new Date('2026-08-28T00:00:00.000Z'),
      },
      {
        id: 'material-2',
        title: 'Apunte de matrices',
        fileType: 'pdf',
        resourceType: 'APUNTE',
        academicYear: null,
        createdAt: new Date('2026-08-27T00:00:00.000Z'),
      },
    ]);

    await expect(service.getResourceCategories('subject-1')).resolves.toEqual({
      subject: {
        id: 'subject-1',
        name: 'Álgebra Lineal',
        code: 'AL-01',
      },
      categories: [{ id: 'APUNTE', resourceType: 'APUNTE', materialCount: 3 }],
    });
    await expect(
      service.getMaterialFiles('subject-1', 'APUNTE', { limit: 1 }),
    ).resolves.toMatchObject({
      subject: { id: 'subject-1' },
      resourceType: 'APUNTE',
      files: [expect.objectContaining({ id: 'material-1' })],
      hasMore: true,
    });
    expect(prisma.material.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subjectId: 'subject-1',
          moderationStatus: 'APPROVED',
          isDeleted: false,
        }),
      }),
    );
    expect(prisma.material.findMany).toHaveBeenCalledTimes(1);
  });

  it('mantiene vacías las categorías y archivos si la materia existe', async () => {
    prisma.subject.findUnique.mockResolvedValue({
      id: 'subject-1',
      name: 'Álgebra Lineal',
      code: 'AL-01',
    });
    prisma.material.groupBy.mockResolvedValue([]);
    prisma.material.findMany.mockResolvedValue([]);

    await expect(service.getResourceCategories('subject-1')).resolves.toEqual(
      expect.objectContaining({ categories: [] }),
    );
    await expect(
      service.getMaterialFiles('subject-1', 'FINAL', {}),
    ).resolves.toEqual(expect.objectContaining({ files: [], hasMore: false }));
  });

  it('rechaza contextos padre inexistentes', async () => {
    prisma.studyPlan.findFirst.mockResolvedValue(null);
    prisma.subject.findUnique.mockResolvedValue(null);

    await expect(
      service.getSubjects('career-1', 'plan-1', 1, {}),
    ).rejects.toThrow(NotFoundException);
    await expect(service.getResourceCategories('subject-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});

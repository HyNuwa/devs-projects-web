import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService exam-experience discovery', () => {
  let service: DiscoveryService;
  const prisma = {
    examExperience: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const experience = {
    id: 'exam-1',
    year: 2026,
    session: 'JULIO',
    format: 'ORAL',
    examDate: new Date('2026-07-15T00:00:00.000Z'),
    shift: null,
    examinerName: null,
    difficulty: null,
    outcome: null,
    comment:
      'El examen tuvo ejercicios similares a los vistos durante la cursada.',
    isAnonymous: false,
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    subject: { id: 'subject-1', code: 'S2-14', name: 'Algoritmos' },
    professor: null,
    user: { username: 'franco-m' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
    prisma.examExperience.findMany.mockResolvedValue([experience]);
    prisma.examExperience.count.mockResolvedValue(1);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DiscoveryService);
  });

  it('filtra, pagina y usa fecha de final con publicación e id como desempates estables', async () => {
    await service.getExamExperiences({
      subjectId: 'subject-1',
      year: 2026,
      session: 'JULIO',
      professorId: 'professor-1',
      format: 'ORAL',
      outcome: 'APROBADO',
      page: 2,
      limit: 5,
    });

    const where = {
      isRemoved: false,
      subjectId: 'subject-1',
      year: 2026,
      session: 'JULIO',
      professorId: 'professor-1',
      format: 'ORAL',
      outcome: 'APROBADO',
    };
    expect(prisma.examExperience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [
          { examDate: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
        skip: 5,
        take: 5,
      }),
    );
    expect(prisma.examExperience.count).toHaveBeenCalledWith({ where });
  });

  it('protege anonimato y omite hechos opcionales desconocidos sin seleccionar la nota', async () => {
    prisma.examExperience.findMany.mockResolvedValue([
      { ...experience, isAnonymous: true, user: { username: 'privado' } },
    ]);
    const result = await service.getExamExperiences({});

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        author: { username: 'Anónimo' },
        subject: expect.objectContaining({ href: '/materias/S2-14' }),
      }),
    );
    expect(result.data[0]).not.toHaveProperty('grade');
    expect(result.data[0]).not.toHaveProperty('shift');
    expect(result.data[0]).not.toHaveProperty('outcome');
    expect(
      prisma.examExperience.findMany.mock.calls[0][0].select,
    ).not.toHaveProperty('grade');
  });

  it('mantiene un presupuesto fijo para una página de múltiples finales', async () => {
    prisma.examExperience.findMany.mockResolvedValue([
      experience,
      { ...experience, id: 'exam-2' },
      { ...experience, id: 'exam-3' },
    ]);
    prisma.examExperience.count.mockResolvedValue(3);

    await service.getExamExperiences({ limit: 3 });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.examExperience.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.examExperience.count).toHaveBeenCalledTimes(1);
    expect(prisma.examExperience.findFirst).not.toHaveBeenCalled();
  });

  it('expone el detalle visible sin nota ni identidad privada', async () => {
    prisma.examExperience.findFirst.mockResolvedValue({
      ...experience,
      isAnonymous: true,
    });
    const result = await service.getExamExperienceDetail('exam-1');

    expect(result).toEqual(
      expect.objectContaining({
        author: { username: 'Anónimo' },
        comment: experience.comment,
      }),
    );
    expect(result).not.toHaveProperty('grade');
    expect(prisma.examExperience.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'exam-1', isRemoved: false } }),
    );
    expect(prisma.examExperience.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.examExperience.findMany).not.toHaveBeenCalled();
  });
});

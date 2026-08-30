import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscoveryCourseReviewSort } from './dto/discovery-course-reviews.dto';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService course-review discovery', () => {
  let service: DiscoveryService;

  const prisma = {
    courseReview: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const review = {
    id: 'review-1',
    academicYear: 2026,
    shift: 'TARDE',
    condition: 'REGULAR',
    attempt: 'PRIMERA_CURSADA',
    difficulty: 'ALTA',
    recommendation: 4,
    professorName: null,
    comment: 'La guía práctica ayudó a preparar cada parcial con tiempo.',
    isAnonymous: false,
    createdAt: new Date('2026-08-28T00:00:00.000Z'),
    updatedAt: new Date('2026-08-29T00:00:00.000Z'),
    subject: {
      id: 'subject-1',
      code: 'S2-14',
      name: 'Algoritmos y Estructuras de Datos',
    },
    professor: { id: 'professor-1', name: 'Laura Quiroga' },
    user: { username: 'luciana-g' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
    prisma.courseReview.findMany.mockResolvedValue([review]);
    prisma.courseReview.count.mockResolvedValue(1);
    prisma.courseReview.aggregate.mockResolvedValue({
      _avg: { recommendation: 4 },
      _count: 1,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('pagina reseñas públicas recientes, preserva cada cursada y proyecta el autor de forma segura', async () => {
    const anonymousReview = {
      ...review,
      id: 'review-2',
      isAnonymous: true,
      user: { username: 'identidad-privada' },
      subject: { ...review.subject, code: null },
    };
    prisma.courseReview.findMany.mockResolvedValue([review, anonymousReview]);
    prisma.courseReview.count.mockResolvedValue(3);
    prisma.courseReview.aggregate.mockResolvedValue({
      _avg: { recommendation: 4.33 },
      _count: 3,
    });

    const result = await service.getCourseReviews({ page: 2, limit: 2 });

    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: 'review-1',
          author: { username: 'luciana-g' },
          subject: expect.objectContaining({ href: '/materias/S2-14' }),
        }),
        expect.objectContaining({
          id: 'review-2',
          author: { username: 'Anónimo' },
          subject: expect.objectContaining({ href: '/materias/subject-1' }),
        }),
      ],
      aggregate: { averageRecommendation: 4.33, reviewCount: 3 },
      meta: { page: 2, limit: 2, total: 3, totalPages: 2 },
    });
    expect(result.data[1]).not.toHaveProperty('isAnonymous');
    expect(result.data[1]).not.toHaveProperty('user');
    expect(result.data[1]).not.toHaveProperty('userId');
    expect(prisma.courseReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isRemoved: false },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: 2,
        take: 2,
      }),
    );
  });

  it('aplica todos los filtros soportados y excluye entradas retiradas de lista, conteo y promedio', async () => {
    await service.getCourseReviews({
      subjectId: 'subject-1',
      academicYear: 2026,
      professorId: 'professor-1',
      difficulty: 'ALTA',
      attempt: 'PRIMERA_RECURSADA',
    });

    const where = {
      isRemoved: false,
      subjectId: 'subject-1',
      academicYear: 2026,
      professorId: 'professor-1',
      difficulty: 'ALTA',
      attempt: 'PRIMERA_RECURSADA',
    };
    expect(prisma.courseReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(prisma.courseReview.count).toHaveBeenCalledWith({ where });
    expect(prisma.courseReview.aggregate).toHaveBeenCalledWith({
      where,
      _avg: { recommendation: true },
      _count: true,
    });
  });

  it.each([
    [
      DiscoveryCourseReviewSort.STARS_ASC,
      [{ recommendation: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    ],
    [
      DiscoveryCourseReviewSort.STARS_DESC,
      [{ recommendation: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    ],
  ])('ordena por estrellas de forma estable: %s', async (sort, orderBy) => {
    await service.getCourseReviews({ sort });

    expect(prisma.courseReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy }),
    );
  });

  it('recorta el extracto sin cargar detalles ni relaciones adicionales por reseña', async () => {
    prisma.courseReview.findMany.mockResolvedValue([
      {
        ...review,
        comment: 'a'.repeat(400),
      },
    ]);

    const result = await service.getCourseReviews({});

    expect(result.data[0].excerpt).toHaveLength(361);
    expect(result.data[0].excerpt?.endsWith('…')).toBe(true);
    expect(prisma.courseReview.findMany).toHaveBeenCalledTimes(1);
  });

  it('expone el detalle visible sin identidad privada y oculta retiradas como no encontradas', async () => {
    prisma.courseReview.findFirst.mockResolvedValue({
      ...review,
      isAnonymous: true,
    });

    await expect(service.getCourseReviewDetail('review-1')).resolves.toEqual(
      expect.objectContaining({
        author: { username: 'Anónimo' },
        comment: review.comment,
      }),
    );
    expect(prisma.courseReview.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'review-1', isRemoved: false } }),
    );
    prisma.courseReview.findFirst.mockResolvedValue(null);
    await expect(service.getCourseReviewDetail('removed-1')).rejects.toThrow(
      'Reseña no encontrada',
    );
  });
});

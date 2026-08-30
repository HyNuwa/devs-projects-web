import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { Role } from '../auth/dto/auth-response.dto';
import { MaterialSort } from './dto/materials-query.dto';
import { MaterialResourceType } from '../../generated/prisma';

describe('MaterialsService', () => {
  let service: MaterialsService;

  const prisma = {
    material: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    materialRating: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    materialHelpfulness: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    savedMaterial: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subjectProfessor: {
      findUnique: jest.fn(),
    },
    moderationLog: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const storage = {
    stage: jest.fn(),
    publish: jest.fn(),
    discard: jest.fn(),
  };

  const pointService = {
    awardPoints: jest.fn(),
  };

  const mockFile = {
    originalname: 'apuntes.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('contenido de prueba'),
  } as Express.Multer.File;

  const publicMaterialRecord = {
    id: 'mat-1',
    title: 'Árboles y grafos',
    description: null,
    fileUrl: '/materials/arboles.pdf',
    fileType: 'pdf',
    fileSize: BigInt(1024),
    thumbnailUrl: null,
    authorId: 'user-1',
    subjectId: 'sub-1',
    resourceType: 'PARCIAL',
    academicYear: 2026,
    professorId: null,
    shift: 'TARDE',
    downloadCount: 3,
    avgRating: { toString: () => '4.50' },
    ratingCount: 2,
    drivePreviewUrl: '/preview/arboles.pdf',
    driveDownloadUrl: '/download/arboles.pdf',
    createdAt: new Date('2026-08-28T00:00:00.000Z'),
    updatedAt: new Date('2026-08-28T00:00:00.000Z'),
    author: {
      id: 'user-1',
      username: 'estudiante',
      displayName: null,
      avatarUrl: null,
    },
    subject: { id: 'sub-1', name: 'Estructura de Datos', code: 'ED-01' },
    professor: null,
    _count: { helpfulness: 5, ratings: 1 },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
    prisma.subjectProfessor.findUnique.mockResolvedValue({ id: 'link-1' });
    prisma.$queryRaw.mockResolvedValue([{ id: 'mat-1' }]);
    prisma.$transaction.mockImplementation(
      (operation: unknown[] | ((transaction: typeof prisma) => unknown)) =>
        typeof operation === 'function'
          ? operation(prisma)
          : Promise.all(operation),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'FILE_STORAGE', useValue: storage },
        { provide: PointService, useValue: pointService },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  describe('create', () => {
    it('hace staging del archivo y crea el material en PENDING sin puntos', async () => {
      storage.stage.mockResolvedValue({
        stagedPath: '/tmp/staging/abc.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        thumbnailUrl: null,
      });
      prisma.material.create.mockResolvedValue({ id: 'mat-1' });

      const dto = {
        title: 'Apuntes de Cálculo',
        subjectId: 'sub-1',
        resourceType: 'APUNTE' as const,
      };
      const result = await service.create(dto, mockFile, 'user-1');

      expect(storage.stage).toHaveBeenCalledWith(mockFile);
      expect(prisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Apuntes de Cálculo',
            searchKey: 'apuntes de calculo',
            fileType: 'pdf',
            fileSize: BigInt(1024),
            authorId: 'user-1',
            subjectId: 'sub-1',
            resourceType: 'APUNTE',
            moderationStatus: 'PENDING',
            stagedFilePath: '/tmp/staging/abc.pdf',
          }),
        }),
      );
      // No se otorgan puntos al crear.
      expect(pointService.awardPoints).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'mat-1' });
    });

    it('rechaza un profesor que no pertenece a la materia antes del staging', async () => {
      prisma.subjectProfessor.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Apuntes de Cálculo',
            subjectId: 'sub-1',
            resourceType: 'APUNTE',
            professorId: 'prof-1',
          },
          mockFile,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(storage.stage).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('solo devuelve materiales aprobados y no eliminados', async () => {
      prisma.material.findMany.mockResolvedValue([publicMaterialRecord]);
      prisma.material.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            moderationStatus: 'APPROVED',
            id: { in: ['mat-1'] },
          }),
        }),
      );
      expect(result.meta.total).toBe(1);
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: 'mat-1',
          helpfulCount: 5,
          commentCount: 1,
          preview: expect.objectContaining({ capability: 'PDF' }),
        }),
      );
      expect(result.data[0]).not.toHaveProperty('moderationStatus');
      expect(result.data[0]).not.toHaveProperty('moderationReason');
      expect(result.data[0]).not.toHaveProperty('isApproved');
    });

    it('aplica cada filtro público y mantiene la materia como alcance obligatorio', async () => {
      prisma.material.findMany.mockResolvedValue([publicMaterialRecord]);
      prisma.material.count.mockResolvedValue(1);

      await service.findAll({
        subjectId: 'sub-1',
        resourceType: 'PARCIAL',
        academicYear: 2026,
        professorId: 'prof-1',
        search: '  Árboles  ',
        sort: MaterialSort.RELEVANCE,
      });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            moderationStatus: 'APPROVED',
            subjectId: 'sub-1',
            resourceType: 'PARCIAL',
            academicYear: 2026,
            professorId: 'prof-1',
            searchKey: { contains: 'arboles' },
            id: { in: ['mat-1'] },
          }),
        }),
      );
    });

    const materialFilterCases: Array<
      [Parameters<MaterialsService['findAll']>[0], Record<string, unknown>]
    > = [
      [
        { resourceType: MaterialResourceType.APUNTE },
        { resourceType: MaterialResourceType.APUNTE },
      ],
      [{ academicYear: 2025 }, { academicYear: 2025 }],
      [{ professorId: 'prof-1' }, { professorId: 'prof-1' }],
      [
        { subjectId: 'sub-1', search: 'grafos', sort: MaterialSort.RECENT },
        {
          subjectId: 'sub-1',
          searchKey: { contains: 'grafos' },
        },
      ],
    ];

    it.each(materialFilterCases)(
      'admite filtros aislados y combinados: %j',
      async (query, expected) => {
        prisma.material.findMany.mockResolvedValue([]);
        prisma.material.count.mockResolvedValue(0);

        await service.findAll(query);

        expect(prisma.material.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              ...expected,
              id: { in: ['mat-1'] },
            }),
          }),
        );
      },
    );

    it('pagina con orden reciente explícito y no devuelve otra materia', async () => {
      prisma.material.findMany.mockResolvedValue([]);
      prisma.material.count.mockResolvedValue(0);

      await service.findAll({
        subjectId: 'sub-1',
        search: 'apuntes',
        sort: MaterialSort.RECENT,
        page: 3,
        limit: 5,
      });

      expect(prisma.material.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subjectId: 'sub-1',
            id: { in: ['mat-1'] },
          }),
        }),
      );
      const rankingQuery = prisma.$queryRaw.mock.calls[0][0] as {
        text: string;
        values: unknown[];
      };
      expect(rankingQuery.text).toContain(
        'ORDER BY m.created_at DESC, m.id ASC',
      );
      expect(rankingQuery.values).toEqual(expect.arrayContaining([10, 5]));
    });

    it('preserva el orden determinista de la base entre páginas y no ordena por estrellas', async () => {
      const firstPageIds = ['mat-2', 'mat-1'];
      const secondPageIds = ['mat-4', 'mat-3'];
      const records = new Map(
        [
          {
            ...publicMaterialRecord,
            id: 'mat-1',
            avgRating: { toString: () => '1.00' },
            ratingCount: 1,
          },
          {
            ...publicMaterialRecord,
            id: 'mat-2',
            avgRating: { toString: () => '5.00' },
            ratingCount: 99,
          },
          { ...publicMaterialRecord, id: 'mat-3' },
          { ...publicMaterialRecord, id: 'mat-4' },
        ].map((record) => [record.id, record]),
      );
      prisma.$queryRaw
        .mockResolvedValueOnce(firstPageIds.map((id) => ({ id })))
        .mockResolvedValueOnce(secondPageIds.map((id) => ({ id })));
      prisma.material.count.mockResolvedValue(4);
      prisma.material.findMany.mockImplementation(({ where }) => {
        const ids = (where.id.in as string[]).toReversed();
        return Promise.resolve(ids.map((id) => records.get(id)));
      });

      const firstPage = await service.findAll({
        search: 'arboles',
        page: 1,
        limit: 2,
      });
      const secondPage = await service.findAll({
        search: 'arboles',
        page: 2,
        limit: 2,
      });

      expect(firstPage.data.map((material) => material.id)).toEqual(
        firstPageIds,
      );
      expect(secondPage.data.map((material) => material.id)).toEqual(
        secondPageIds,
      );
      expect(firstPage.meta).toEqual({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2,
      });
      const rankingQuery = prisma.$queryRaw.mock.calls[0][0] as {
        text: string;
      };
      expect(rankingQuery.text).not.toContain('avg_rating');
      expect(rankingQuery.text).not.toContain('rating_count');
    });
  });

  describe('approve', () => {
    it('publica el archivo, marca aprobado y otorga puntos al autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        subjectId: 'sub-1',
        fileType: 'pdf',
        stagedFilePath: '/tmp/staging/abc.pdf',
        moderationStatus: 'PENDING',
        isDeleted: false,
      });
      storage.publish.mockResolvedValue({
        fileUrl: '/uploads/materials/final.pdf',
        driveFileId: 'drive-1',
        drivePreviewUrl: 'https://drive.google.com/file/d/drive-1/preview',
        driveDownloadUrl:
          'https://drive.google.com/uc?id=drive-1&export=download',
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.subject.update.mockResolvedValue({ id: 'sub-1' });
      prisma.moderationLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.approve('mat-1', 'mod-1');

      expect(storage.publish).toHaveBeenCalledWith('/tmp/staging/abc.pdf', {
        fileType: 'pdf',
      });
      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'APPROVED',
            isApproved: true,
            driveFileId: 'drive-1',
            stagedFilePath: null,
          }),
        }),
      );
      expect(pointService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        10,
        'MATERIAL_APPROVED',
        'mat-1',
      );
      expect(result).toEqual({ id: 'mat-1' });
    });

    it('rechaza la transición REJECTED → APPROVED', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        moderationStatus: 'REJECTED',
        isDeleted: false,
        stagedFilePath: null,
      });

      await expect(service.approve('mat-1', 'mod-1')).rejects.toThrow(
        ConflictException,
      );
      expect(storage.publish).not.toHaveBeenCalled();
      expect(prisma.moderationLog.create).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('descarta el staging, marca rechazado con motivo y no otorga puntos', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        subjectId: 'sub-1',
        stagedFilePath: '/tmp/staging/abc.pdf',
        moderationStatus: 'PENDING',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });
      prisma.moderationLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.reject('mat-1', 'mod-1', {
        reason: 'Contenido duplicado',
      });

      expect(storage.discard).toHaveBeenCalledWith('/tmp/staging/abc.pdf');
      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'REJECTED',
            moderationReason: 'Contenido duplicado',
            stagedFilePath: null,
          }),
        }),
      );
      expect(pointService.awardPoints).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'mat-1' });
    });

    it('rechaza la transición APPROVED → REJECTED', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        moderationStatus: 'APPROVED',
        isDeleted: false,
      });

      await expect(
        service.reject('mat-1', 'mod-1', { reason: 'Fuera de contexto' }),
      ).rejects.toThrow(ConflictException);
      expect(storage.discard).not.toHaveBeenCalled();
      expect(prisma.moderationLog.create).not.toHaveBeenCalled();
    });
  });

  describe('moderation evidence', () => {
    it('incluye evidencia de moderación en la vista del contributor', async () => {
      prisma.material.findMany.mockResolvedValue([]);

      await service.findMine('user-1');

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 'user-1', isDeleted: false },
          include: expect.objectContaining({
            moderationLogs: expect.objectContaining({
              select: expect.objectContaining({ action: true, reason: true }),
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('lanza NotFoundException si el material no está aprobado', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.findById('mat-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('proyecta un material aprobado sin evidencia interna de moderación', async () => {
      prisma.material.findFirst.mockResolvedValue({
        ...publicMaterialRecord,
        moderationStatus: 'APPROVED',
        moderationReason: 'dato que no debe salir',
      });

      const result = await service.findById('mat-1');

      expect(result).not.toHaveProperty('moderationStatus');
      expect(result).not.toHaveProperty('moderationReason');
      expect(prisma.material.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'mat-1',
            isDeleted: false,
            moderationStatus: 'APPROVED',
          },
        }),
      );
    });

    it.each([
      {
        label: 'PDF compatible',
        record: {},
        expected: {
          capability: 'PDF',
          canPreview: true,
          url: '/preview/arboles.pdf',
          downloadUrl: '/download/arboles.pdf',
          fallback: {
            reason: 'PREVIEW_FAILED',
            downloadUrl: '/download/arboles.pdf',
          },
        },
      },
      {
        label: 'imagen compatible',
        record: {
          fileType: 'image/png',
          drivePreviewUrl: '/preview/arboles.png',
          driveDownloadUrl: '/download/arboles.png',
        },
        expected: {
          capability: 'IMAGE',
          canPreview: true,
          url: '/preview/arboles.png',
          downloadUrl: '/download/arboles.png',
          fallback: {
            reason: 'PREVIEW_FAILED',
            downloadUrl: '/download/arboles.png',
          },
        },
      },
      {
        label: 'formato no compatible',
        record: {
          fileType: 'docx',
          drivePreviewUrl: '/preview/arboles.docx',
          driveDownloadUrl: '/download/arboles.docx',
        },
        expected: {
          capability: 'UNSUPPORTED',
          canPreview: false,
          url: null,
          downloadUrl: '/download/arboles.docx',
          fallback: {
            reason: 'UNSUPPORTED',
            downloadUrl: '/download/arboles.docx',
          },
        },
      },
      {
        label: 'vista previa no disponible',
        record: {
          fileUrl: '',
          drivePreviewUrl: null,
          driveDownloadUrl: '/download/arboles.pdf',
        },
        expected: {
          capability: 'UNAVAILABLE',
          canPreview: false,
          url: null,
          downloadUrl: '/download/arboles.pdf',
          fallback: {
            reason: 'UNAVAILABLE',
            downloadUrl: '/download/arboles.pdf',
          },
        },
      },
    ])(
      'expone el contrato de vista previa para $label',
      async ({ record, expected }) => {
        prisma.material.findFirst.mockResolvedValue({
          ...publicMaterialRecord,
          ...record,
        });

        const result = await service.findById('mat-1');

        expect(result.preview).toEqual(expected);
      },
    );
  });

  describe('getRatings', () => {
    it('no expone comentarios de un material no aprobado', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.getRatings('mat-1', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.materialRating.findMany).not.toHaveBeenCalled();
    });

    it('permite comentarios sólo después de comprobar visibilidad pública', async () => {
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.materialRating.findMany.mockResolvedValue([]);
      prisma.materialRating.count.mockResolvedValue(0);

      const result = await service.getRatings('mat-1', {});

      expect(result.meta.total).toBe(0);
      expect(prisma.material.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'mat-1',
          isDeleted: false,
          moderationStatus: 'APPROVED',
        },
        select: { id: true },
      });
    });
  });

  describe('viewer interactions', () => {
    it('establece Me sirvió de forma idempotente y mantiene el agregado exacto', async () => {
      const helpfulUsers = new Set<string>();
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.materialHelpfulness.upsert.mockImplementation(
        ({ create }: { create: { userId: string } }) => {
          helpfulUsers.add(create.userId);
          return Promise.resolve({ id: 'helpful-1' });
        },
      );
      prisma.materialHelpfulness.deleteMany.mockImplementation(
        ({ where }: { where: { userId: string } }) => {
          const removed = helpfulUsers.delete(where.userId);
          return Promise.resolve({ count: removed ? 1 : 0 });
        },
      );
      prisma.materialHelpfulness.count.mockImplementation(() =>
        Promise.resolve(helpfulUsers.size),
      );

      await expect(
        service.setHelpfulness('mat-1', 'user-1', true),
      ).resolves.toEqual({ isHelpful: true, helpfulCount: 1 });
      await expect(
        service.setHelpfulness('mat-1', 'user-1', true),
      ).resolves.toEqual({ isHelpful: true, helpfulCount: 1 });
      await expect(
        service.setHelpfulness('mat-1', 'user-1', false),
      ).resolves.toEqual({ isHelpful: false, helpfulCount: 0 });
      await expect(
        service.setHelpfulness('mat-1', 'user-1', false),
      ).resolves.toEqual({ isHelpful: false, helpfulCount: 0 });

      expect(prisma.material.update).not.toHaveBeenCalled();
      expect(pointService.awardPoints).not.toHaveBeenCalled();
    });

    it('establece Guardar de forma idempotente sin alterar señales públicas', async () => {
      const savedUsers = new Set<string>();
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.savedMaterial.upsert.mockImplementation(
        ({ create }: { create: { userId: string } }) => {
          savedUsers.add(create.userId);
          return Promise.resolve({ id: 'saved-1' });
        },
      );
      prisma.savedMaterial.deleteMany.mockImplementation(
        ({ where }: { where: { userId: string } }) => {
          const removed = savedUsers.delete(where.userId);
          return Promise.resolve({ count: removed ? 1 : 0 });
        },
      );

      await expect(service.setSaved('mat-1', 'user-1', true)).resolves.toEqual({
        isSaved: true,
      });
      await expect(service.setSaved('mat-1', 'user-1', true)).resolves.toEqual({
        isSaved: true,
      });
      await expect(service.setSaved('mat-1', 'user-1', false)).resolves.toEqual(
        {
          isSaved: false,
        },
      );
      await expect(service.setSaved('mat-1', 'user-1', false)).resolves.toEqual(
        {
          isSaved: false,
        },
      );

      expect(savedUsers.size).toBe(0);
      expect(prisma.material.update).not.toHaveBeenCalled();
      expect(prisma.materialHelpfulness.upsert).not.toHaveBeenCalled();
    });

    it('devuelve ambos estados del viewer para un material aprobado', async () => {
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.materialHelpfulness.findUnique.mockResolvedValue({ id: 'help-1' });
      prisma.savedMaterial.findUnique.mockResolvedValue(null);

      await expect(service.getViewerState('mat-1', 'user-1')).resolves.toEqual({
        isHelpful: true,
        isSaved: false,
      });
    });

    it('rechaza interacciones sobre materiales no públicos', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.setHelpfulness('mat-1', 'user-1', true),
      ).rejects.toThrow(NotFoundException);
      await expect(service.setSaved('mat-1', 'user-1', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza la clave normalizada cuando cambia el título', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });

      await service.update(
        'mat-1',
        { title: '  Árboles   BÚSQUEDA ' },
        'user-1',
      );

      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: '  Árboles   BÚSQUEDA ',
            searchKey: 'arboles busqueda',
          }),
        }),
      );
    });

    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'otro-user',
        isDeleted: false,
      });

      await expect(
        service.update('mat-1', { title: 'Nuevo' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('permite al moderador eliminar un material ajeno', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });

      const result = await service.remove('mat-1', 'mod-1', Role.MODERATOR);

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { isDeleted: true },
      });
      expect(result).toEqual({ id: 'mat-1' });
    });
  });
});

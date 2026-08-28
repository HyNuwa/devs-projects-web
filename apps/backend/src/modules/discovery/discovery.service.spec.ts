import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;

  const prisma = {
    subject: { findMany: jest.fn() },
    material: { findMany: jest.fn() },
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

  it('agrupa materias antes de recursos y consulta con la clave sin acentos', async () => {
    prisma.subject.findMany.mockResolvedValue([
      {
        id: 'subject-1',
        code: 'S2-14',
        name: 'Algoritmos y Estructuras de Datos',
        searchKey: 'algoritmos y estructuras de datos s2-14',
      },
    ]);
    prisma.material.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'Parcial resuelto de algoritmos',
        searchKey: 'parcial resuelto de algoritmos',
        resourceType: 'PARCIAL',
        subject: {
          id: 'subject-1',
          code: 'S2-14',
          name: 'Algoritmos y Estructuras de Datos',
        },
      },
    ]);

    const result = await service.getSuggestions({
      q: '  ÁLGORITMOS ',
      limit: 4,
    });

    expect(Object.keys(result)).toEqual(['subjects', 'materials']);
    expect(result).toEqual({
      subjects: [
        {
          kind: 'SUBJECT',
          id: 'subject-1',
          code: 'S2-14',
          name: 'Algoritmos y Estructuras de Datos',
        },
      ],
      materials: [
        {
          kind: 'MATERIAL',
          id: 'material-1',
          title: 'Parcial resuelto de algoritmos',
          resourceType: 'PARCIAL',
          subject: {
            id: 'subject-1',
            code: 'S2-14',
            name: 'Algoritmos y Estructuras de Datos',
          },
        },
      ],
    });
    expect(prisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { searchKey: { contains: 'algoritmos' } },
        take: 4,
      }),
    );
    expect(prisma.material.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          searchKey: { contains: 'algoritmos' },
          isDeleted: false,
          moderationStatus: 'APPROVED',
        },
        take: 4,
      }),
    );
  });

  it('no expone resultados que no coincidan con la consulta actual', async () => {
    prisma.subject.findMany.mockResolvedValue([
      {
        id: 'subject-1',
        code: null,
        name: 'Geometría',
        searchKey: 'geometria',
      },
    ]);
    prisma.material.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'Apunte de geometría',
        searchKey: 'geometria',
        resourceType: 'APUNTE',
        subject: { id: 'subject-1', code: null, name: 'Geometría' },
      },
    ]);

    await expect(service.getSuggestions({ q: 'álgebra' })).resolves.toEqual({
      subjects: [],
      materials: [],
    });
  });

  it('devuelve grupos vacíos explícitos cuando no hay coincidencias', async () => {
    prisma.subject.findMany.mockResolvedValue([]);
    prisma.material.findMany.mockResolvedValue([]);

    await expect(
      service.getSuggestions({ q: 'sin coincidencias' }),
    ).resolves.toEqual({ subjects: [], materials: [] });
  });
});

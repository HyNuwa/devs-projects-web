import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/index';
import { PrismaService } from '../../prisma/prisma.service';
import { MaterialStorageService } from './material-storage.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RateMaterialDto } from './dto/rate-material.dto';
import { MaterialsQueryDto } from './dto/materials-query.dto';
import { Role } from '../auth/dto/auth-response.dto';
import { PointService } from '../ranking/point.service';

const MODERATOR_ROLES = [Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN];

const authorSelect = {
  select: {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  },
} as const;

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private storage: MaterialStorageService,
    private pointService: PointService,
  ) {}

  async create(
    dto: CreateMaterialDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    const stored = await this.storage.save(file);

    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        description: dto.description,
        fileUrl: stored.fileUrl,
        fileType: stored.fileType,
        fileSize: BigInt(stored.fileSize),
        thumbnailUrl: stored.thumbnailUrl,
        authorId: userId,
        subjectId: dto.subjectId,
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });

    await this.prisma.subject.update({
      where: { id: dto.subjectId },
      data: { materialCount: { increment: 1 } },
    });

    await this.pointService.awardPoints(
      userId,
      10,
      'MATERIAL_CREATED',
      material.id,
    );

    return material;
  }

  async findAll(query: MaterialsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MaterialWhereInput = {
      isDeleted: false,
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: authorSelect,
          subject: true,
        },
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false },
      include: {
        author: authorSelect,
        subject: true,
      },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, userId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }

    if (material.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar este material',
      );
    }

    return this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId } : {}),
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });
  }

  async remove(id: string, userId: string, role: Role) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }

    const isModerator = MODERATOR_ROLES.includes(role);
    if (material.authorId !== userId && !isModerator) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este material',
      );
    }

    return this.prisma.material.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async download(id: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    await this.prisma
      .$executeRaw`UPDATE materials SET download_count = download_count + 1 WHERE id = ${id}`;

    return material;
  }

  async rate(id: string, userId: string, dto: RateMaterialDto) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    await this.prisma.materialRating.upsert({
      where: { userId_materialId: { userId, materialId: id } },
      create: {
        userId,
        materialId: id,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    const agg = await this.prisma.materialRating.aggregate({
      where: { materialId: id },
      _avg: { rating: true },
      _count: true,
    });

    return this.prisma.material.update({
      where: { id },
      data: {
        avgRating: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });
  }

  async getRatings(id: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MaterialRatingWhereInput = { materialId: id };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.materialRating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.materialRating.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

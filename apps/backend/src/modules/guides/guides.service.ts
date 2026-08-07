import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/index';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { Role } from '../auth/dto/auth-response.dto';
import { PointService } from '../ranking/point.service';

const MODERATOR_ROLES = [Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN];

const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class GuidesService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
  ) {}

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'guia';
    const existing = await this.prisma.guide.findUnique({
      where: { slug: base },
      select: { id: true },
    });

    if (!existing) {
      return base;
    }

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  async create(dto: CreateGuideDto, userId: string) {
    const slug = await this.generateUniqueSlug(dto.title);

    const guide = await this.prisma.guide.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content ?? '',
        isPublished: dto.isPublished ?? true,
        slug,
        authorId: userId,
      },
    });

    await this.pointService.awardPoints(userId, 15, 'GUIDE_CREATED', guide.id);

    return guide;
  }

  async findAll(query: { page?: number; limit?: number }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.GuideWhereInput = { isDeleted: false };

    const [data, total] = await Promise.all([
      this.prisma.guide.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { steps: true } },
        },
      }),
      this.prisma.guide.count({ where }),
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

  async findBySlug(slug: string) {
    const guide = await this.prisma.guide.findUnique({
      where: { slug },
    });

    if (!guide || guide.isDeleted) {
      throw new NotFoundException('Guía no encontrada');
    }

    await this.prisma.guide.update({
      where: { id: guide.id },
      data: { viewCount: { increment: 1 } },
    });

    return this.prisma.guide.findUnique({
      where: { id: guide.id },
      include: {
        author: { select: AUTHOR_SELECT },
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateGuideDto, userId: string) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });

    if (!guide || guide.isDeleted) {
      throw new NotFoundException('Guía no encontrada');
    }

    if (guide.authorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar esta guía');
    }

    const data: Prisma.GuideUpdateInput = {
      title: dto.title,
      description: dto.description,
      content: dto.content,
      isPublished: dto.isPublished,
    };

    if (dto.title && dto.title !== guide.title) {
      data.slug = await this.generateUniqueSlug(dto.title);
    }

    return this.prisma.guide.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string, role: Role) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });

    if (!guide || guide.isDeleted) {
      throw new NotFoundException('Guía no encontrada');
    }

    if (guide.authorId !== userId && !MODERATOR_ROLES.includes(role)) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta guía',
      );
    }

    return this.prisma.guide.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async addStep(guideId: string, dto: CreateStepDto, userId: string) {
    const guide = await this.prisma.guide.findUnique({
      where: { id: guideId },
    });

    if (!guide || guide.isDeleted) {
      throw new NotFoundException('Guía no encontrada');
    }

    if (guide.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta guía',
      );
    }

    let stepOrder = dto.stepOrder;

    if (stepOrder === undefined) {
      const lastStep = await this.prisma.guideStep.findFirst({
        where: { guideId },
        orderBy: { stepOrder: 'desc' },
        select: { stepOrder: true },
      });
      stepOrder = (lastStep?.stepOrder ?? 0) + 1;
    }

    return this.prisma.guideStep.create({
      data: {
        guideId,
        title: dto.title,
        content: dto.content,
        stepOrder,
      },
    });
  }

  async updateStep(stepId: string, dto: UpdateStepDto, userId: string) {
    const step = await this.prisma.guideStep.findUnique({
      where: { id: stepId },
      include: { guide: { select: { authorId: true, isDeleted: true } } },
    });

    if (!step || step.guide.isDeleted) {
      throw new NotFoundException('Paso no encontrado');
    }

    if (step.guide.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta guía',
      );
    }

    return this.prisma.guideStep.update({
      where: { id: stepId },
      data: {
        title: dto.title,
        content: dto.content,
        stepOrder: dto.stepOrder,
      },
    });
  }

  async removeStep(stepId: string, userId: string) {
    const step = await this.prisma.guideStep.findUnique({
      where: { id: stepId },
      include: { guide: { select: { authorId: true, isDeleted: true } } },
    });

    if (!step || step.guide.isDeleted) {
      throw new NotFoundException('Paso no encontrado');
    }

    if (step.guide.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta guía',
      );
    }

    await this.prisma.guideStep.delete({ where: { id: stepId } });

    await this.prisma.guideStep.updateMany({
      where: {
        guideId: step.guideId,
        stepOrder: { gt: step.stepOrder },
      },
      data: { stepOrder: { decrement: 1 } },
    });

    return { message: 'Paso eliminado correctamente' };
  }
}

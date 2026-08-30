import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/index';
import { PrismaService } from '../../prisma/prisma.service';
import { FileStorageService, StagedFile } from './file-storage.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RateMaterialDto } from './dto/rate-material.dto';
import { MaterialsQueryDto } from './dto/materials-query.dto';
import { RejectMaterialDto } from './dto/reject-material.dto';
import { Role } from '../auth/dto/auth-response.dto';
import { PointService } from '../ranking/point.service';
import { normalizeSearchKey } from '../../common/search/search-key';
import {
  MaterialPreviewCapability,
  MaterialPreviewFallbackReason,
} from './dto/material-response.dto';
import {
  buildMaterialRankingQuery,
  RankedMaterialId,
} from './material-ranking.query';

const MODERATOR_ROLES = [Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN];

const authorSelect = {
  select: {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  },
} as const;

const moderationEvidenceSelect = {
  select: {
    id: true,
    action: true,
    reason: true,
    createdAt: true,
  },
} as const;

const publicMaterialSelect = {
  id: true,
  title: true,
  description: true,
  fileUrl: true,
  fileType: true,
  fileSize: true,
  thumbnailUrl: true,
  authorId: true,
  subjectId: true,
  resourceType: true,
  academicYear: true,
  professorId: true,
  shift: true,
  downloadCount: true,
  avgRating: true,
  ratingCount: true,
  drivePreviewUrl: true,
  driveDownloadUrl: true,
  createdAt: true,
  updatedAt: true,
  author: authorSelect,
  subject: {
    select: { id: true, name: true, code: true },
  },
  professor: {
    select: { id: true, name: true },
  },
  _count: {
    select: {
      helpfulness: true,
      ratings: { where: { comment: { not: null } } },
    },
  },
} satisfies Prisma.MaterialSelect;

type PublicMaterialRecord = Prisma.MaterialGetPayload<{
  select: typeof publicMaterialSelect;
}>;

function getPreviewCapability(
  fileType: string,
  previewUrl: string | null,
): MaterialPreviewCapability {
  if (!previewUrl) {
    return MaterialPreviewCapability.UNAVAILABLE;
  }

  const normalized = fileType.toLowerCase().replace(/^image\//, '');
  if (normalized === 'pdf' || normalized === 'application/pdf') {
    return MaterialPreviewCapability.PDF;
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(normalized)) {
    return MaterialPreviewCapability.IMAGE;
  }
  return MaterialPreviewCapability.UNSUPPORTED;
}

function toPublicMaterial(material: PublicMaterialRecord) {
  const previewCandidate = material.drivePreviewUrl || material.fileUrl || null;
  const capability = getPreviewCapability(material.fileType, previewCandidate);
  const previewUrl =
    capability === MaterialPreviewCapability.PDF ||
    capability === MaterialPreviewCapability.IMAGE
      ? previewCandidate
      : null;
  const average = material.avgRating.toString();
  const downloadUrl = material.driveDownloadUrl ?? material.fileUrl;
  const fallbackReason =
    capability === MaterialPreviewCapability.UNSUPPORTED
      ? MaterialPreviewFallbackReason.UNSUPPORTED
      : capability === MaterialPreviewCapability.UNAVAILABLE
        ? MaterialPreviewFallbackReason.UNAVAILABLE
        : MaterialPreviewFallbackReason.PREVIEW_FAILED;

  return {
    id: material.id,
    title: material.title,
    description: material.description,
    fileUrl: material.fileUrl,
    fileType: material.fileType,
    fileSize: material.fileSize.toString(),
    thumbnailUrl: material.thumbnailUrl,
    authorId: material.authorId,
    subjectId: material.subjectId,
    resourceType: material.resourceType,
    academicYear: material.academicYear,
    professorId: material.professorId,
    shift: material.shift,
    downloadCount: material.downloadCount,
    avgRating: average,
    ratingCount: material.ratingCount,
    helpfulCount: material._count.helpfulness,
    commentCount: material._count.ratings,
    starSummary: { average, count: material.ratingCount },
    commentSummary: { count: material._count.ratings },
    preview: {
      capability,
      url: previewUrl,
      canPreview: previewUrl !== null,
      downloadUrl,
      fallback: { reason: fallbackReason, downloadUrl },
    },
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
    author: material.author,
    subject: material.subject,
    professor: material.professor,
  };
}

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    @Inject('FILE_STORAGE') private storage: FileStorageService,
    private pointService: PointService,
  ) {}

  private async assertAcademicContext(
    subjectId: string,
    professorId?: string | null,
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    if (!professorId) {
      return;
    }

    const association = await this.prisma.subjectProfessor.findUnique({
      where: { subjectId_professorId: { subjectId, professorId } },
      select: { id: true },
    });

    if (!association) {
      throw new BadRequestException(
        'El profesor indicado no está asociado a la materia',
      );
    }
  }

  async create(
    dto: CreateMaterialDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    await this.assertAcademicContext(dto.subjectId, dto.professorId);
    const staged: StagedFile = await this.storage.stage(file);

    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        searchKey: normalizeSearchKey(dto.title),
        description: dto.description,
        fileUrl: '',
        fileType: staged.fileType,
        fileSize: BigInt(staged.fileSize),
        thumbnailUrl: staged.thumbnailUrl,
        authorId: userId,
        subjectId: dto.subjectId,
        resourceType: dto.resourceType,
        academicYear: dto.academicYear,
        professorId: dto.professorId,
        shift: dto.shift,
        moderationStatus: 'PENDING',
        stagedFilePath: staged.stagedPath,
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });

    // No se otorgan puntos hasta la aprobación.
    return material;
  }

  async findAll(query: MaterialsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const searchKey = query.search
      ? normalizeSearchKey(query.search)
      : undefined;

    const where: Prisma.MaterialWhereInput = {
      isDeleted: false,
      moderationStatus: 'APPROVED',
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(searchKey ? { searchKey: { contains: searchKey } } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(query.professorId ? { professorId: query.professorId } : {}),
    };

    const { data, total } = await this.prisma.$transaction(
      async (transaction) => {
        const [rankedRows, total] = await Promise.all([
          transaction.$queryRaw<RankedMaterialId[]>(
            buildMaterialRankingQuery({
              academicYear: query.academicYear,
              limit,
              offset,
              professorId: query.professorId,
              resourceType: query.resourceType,
              searchKey,
              sort: query.sort,
              subjectId: query.subjectId,
            }),
          ),
          transaction.material.count({ where }),
        ]);
        const materialIds = rankedRows.map(({ id }) => id);

        if (materialIds.length === 0) {
          return { data: [], total };
        }

        const materials = await transaction.material.findMany({
          where: { ...where, id: { in: materialIds } },
          select: publicMaterialSelect,
        });
        const materialById = new Map(
          materials.map((material) => [material.id, material]),
        );

        return {
          data: materialIds.flatMap((id) => {
            const material = materialById.get(id);
            return material ? [material] : [];
          }),
          total,
        };
      },
    );

    return {
      data: data.map(toPublicMaterial),
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
      where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
      select: publicMaterialSelect,
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    return toPublicMaterial(material);
  }

  async findMine(userId: string) {
    return this.prisma.material.findMany({
      where: { authorId: userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        author: authorSelect,
        subject: true,
        moderationLogs: moderationEvidenceSelect,
      },
    });
  }

  async findPending() {
    return this.prisma.material.findMany({
      where: { moderationStatus: 'PENDING', isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        author: authorSelect,
        subject: true,
        moderationLogs: moderationEvidenceSelect,
      },
    });
  }

  async approve(id: string, moderatorId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }

    if (material.moderationStatus === 'APPROVED') {
      return this.findById(id);
    }

    if (material.moderationStatus !== 'PENDING') {
      throw new ConflictException(
        'Solo los materiales pendientes pueden aprobarse',
      );
    }

    if (!material.stagedFilePath) {
      throw new ConflictException(
        'El material pendiente no conserva un archivo para publicar',
      );
    }

    const published = await this.storage.publish(material.stagedFilePath, {
      fileType: material.fileType,
    });

    const updated = await this.prisma.material.update({
      where: { id },
      data: {
        moderationStatus: 'APPROVED',
        isApproved: true,
        moderationReason: null,
        fileUrl: published.fileUrl,
        driveFileId: published.driveFileId,
        drivePreviewUrl: published.drivePreviewUrl,
        driveDownloadUrl: published.driveDownloadUrl,
        stagedFilePath: null,
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });

    await this.prisma.subject.update({
      where: { id: material.subjectId },
      data: { materialCount: { increment: 1 } },
    });

    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        targetMaterialId: id,
        action: 'APPROVE_MATERIAL',
      },
    });

    // Puntos únicamente al aprobar.
    await this.pointService.awardPoints(
      material.authorId,
      10,
      'MATERIAL_APPROVED',
      id,
    );

    return updated;
  }

  async reject(id: string, moderatorId: string, dto: RejectMaterialDto) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }

    if (material.moderationStatus === 'REJECTED') {
      return material;
    }

    if (material.moderationStatus !== 'PENDING') {
      throw new ConflictException(
        'Solo los materiales pendientes pueden rechazarse',
      );
    }

    if (material.stagedFilePath) {
      await this.storage.discard(material.stagedFilePath);
    }

    const updated = await this.prisma.material.update({
      where: { id },
      data: {
        moderationStatus: 'REJECTED',
        isApproved: false,
        moderationReason: dto.reason,
        stagedFilePath: null,
      },
      include: {
        author: authorSelect,
        subject: true,
      },
    });

    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        targetMaterialId: id,
        action: 'REJECT_MATERIAL',
        reason: dto.reason,
      },
    });

    return updated;
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

    const nextSubjectId = dto.subjectId ?? material.subjectId;
    const nextProfessorId =
      dto.professorId === undefined ? material.professorId : dto.professorId;
    await this.assertAcademicContext(nextSubjectId, nextProfessorId);

    return this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.title !== undefined
          ? { searchKey: normalizeSearchKey(dto.title) }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId } : {}),
        ...(dto.resourceType !== undefined
          ? { resourceType: dto.resourceType }
          : {}),
        ...(dto.academicYear !== undefined
          ? { academicYear: dto.academicYear }
          : {}),
        ...(dto.professorId !== undefined
          ? { professorId: dto.professorId }
          : {}),
        ...(dto.shift !== undefined ? { shift: dto.shift } : {}),
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
      where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
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
      where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
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

  async setHelpfulness(id: string, userId: string, isHelpful: boolean) {
    return this.prisma.$transaction(async (transaction) => {
      const material = await transaction.material.findFirst({
        where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
        select: { id: true },
      });

      if (!material) {
        throw new NotFoundException('Material no encontrado');
      }

      if (isHelpful) {
        await transaction.materialHelpfulness.upsert({
          where: { userId_materialId: { userId, materialId: id } },
          create: { userId, materialId: id },
          update: {},
        });
      } else {
        await transaction.materialHelpfulness.deleteMany({
          where: { userId, materialId: id },
        });
      }

      const helpfulCount = await transaction.materialHelpfulness.count({
        where: { materialId: id },
      });

      return { isHelpful, helpfulCount };
    });
  }

  async setSaved(id: string, userId: string, isSaved: boolean) {
    return this.prisma.$transaction(async (transaction) => {
      const material = await transaction.material.findFirst({
        where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
        select: { id: true },
      });

      if (!material) {
        throw new NotFoundException('Material no encontrado');
      }

      if (isSaved) {
        await transaction.savedMaterial.upsert({
          where: { userId_materialId: { userId, materialId: id } },
          create: { userId, materialId: id },
          update: {},
        });
      } else {
        await transaction.savedMaterial.deleteMany({
          where: { userId, materialId: id },
        });
      }

      return { isSaved };
    });
  }

  async getViewerState(id: string, userId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
      select: { id: true },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    const [helpfulness, saved] = await Promise.all([
      this.prisma.materialHelpfulness.findUnique({
        where: { userId_materialId: { userId, materialId: id } },
        select: { id: true },
      }),
      this.prisma.savedMaterial.findUnique({
        where: { userId_materialId: { userId, materialId: id } },
        select: { id: true },
      }),
    ]);

    return { isHelpful: Boolean(helpfulness), isSaved: Boolean(saved) };
  }

  async getRatings(id: string, query: { page?: number; limit?: number }) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false, moderationStatus: 'APPROVED' },
      select: { id: true },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

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

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma, type Material } from '../../generated/prisma/index';
import { PrismaService } from '../../prisma/prisma.service';
import { FileStorageService, StagedFile } from './file-storage.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RateMaterialDto } from './dto/rate-material.dto';
import { MaterialsQueryDto } from './dto/materials-query.dto';
import { ContributionPoints } from '../ranking/contribution-points';
import { HelpfulPoints } from '../ranking/helpful-points';
import { PioneerBonus } from '../ranking/pioneer-bonus';
import { closeObsolete } from '../corrections/close-obsolete';
import { normalizeSearchKey } from '../../common/search/search-key';
import {
  buildMaterialRankingQuery,
  RankedMaterialId,
} from './material-ranking.query';
import { toMaterialPreview } from './material-preview.mapper';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import type { PriorReviewReason } from '../moderation/rules';
import { isPubliclyVisible, publicVisibility } from '../moderation/visibility';

const authorSelect = {
  select: {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  },
} as const;

// docs/README_MODERACION.md §3.2
const DAILY_UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

export type MaterialSubmissionOutcome =
  | { outcome: 'PUBLISHED'; reason: null }
  | { outcome: 'PENDING_REVIEW'; reason: PriorReviewReason };

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

function toPublicMaterial(material: PublicMaterialRecord) {
  const average = material.avgRating.toString();

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
    preview: toMaterialPreview(material),
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
    private contributionPoints: ContributionPoints,
    private helpfulPoints: HelpfulPoints,
    private pioneerBonus: PioneerBonus,
    private publicationPolicy: PublicationPolicy,
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

  /**
   * Publishes a material immediately, or holds it for revisión previa when its author
   * meets a risk condition (openspec moderation/publication).
   */
  async create(
    dto: CreateMaterialDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    if (!file.size || !file.buffer?.length) {
      throw new BadRequestException('El archivo está vacío');
    }
    await this.assertAcademicContext(dto.subjectId, dto.professorId);

    const fileHash = createHash('sha256').update(file.buffer).digest('hex');
    await this.assertNotDuplicate(dto.subjectId, fileHash);
    await this.assertUploadLimit(userId);

    const priorReview = await this.publicationPolicy.priorReviewFor(userId);
    const staged: StagedFile = await this.storage.stage(file);
    const baseData = {
      title: dto.title,
      searchKey: normalizeSearchKey(dto.title),
      description: dto.description,
      fileType: staged.fileType,
      fileSize: BigInt(staged.fileSize),
      thumbnailUrl: staged.thumbnailUrl,
      fileHash,
      authorId: userId,
      subjectId: dto.subjectId,
      resourceType: dto.resourceType,
      academicYear: dto.academicYear,
      professorId: dto.professorId,
      shift: dto.shift,
    };

    if (priorReview) {
      const material = await this.prisma.$transaction(async (tx) => {
        const created = await tx.material.create({
          data: {
            ...baseData,
            fileUrl: '',
            publicationStatus: 'PENDING_REVIEW',
            stagedFilePath: staged.stagedPath,
          },
          include: { author: authorSelect, subject: true },
        });
        await this.publicationPolicy.openPriorReview(
          tx,
          { type: 'MATERIAL', id: created.id },
          userId,
          priorReview,
          created.title,
        );
        return created;
      });
      return {
        material,
        outcome: 'PENDING_REVIEW' as const,
        reason: priorReview,
      };
    }

    let published;
    try {
      published = await this.storage.publish(staged.stagedPath, {
        fileType: staged.fileType,
      });
    } catch (error) {
      await this.storage.discard(staged.stagedPath).catch(() => undefined);
      throw error;
    }

    const material = await this.prisma.$transaction(async (tx) => {
      const created = await tx.material.create({
        data: {
          ...baseData,
          publicationStatus: 'PUBLISHED',
          fileUrl: published.fileUrl,
          driveFileId: published.driveFileId,
          drivePreviewUrl: published.drivePreviewUrl,
          driveDownloadUrl: published.driveDownloadUrl,
          stagedFilePath: null,
        },
        include: { author: authorSelect, subject: true },
      });
      await tx.subject.update({
        where: { id: dto.subjectId },
        data: { materialCount: { increment: 1 } },
      });
      await this.contributionPoints.published(tx, {
        type: 'MATERIAL',
        id: created.id,
        authorId: userId,
        isAnonymous: false,
      });
      return created;
    });
    return { material, outcome: 'PUBLISHED' as const, reason: null };
  }

  private async assertNotDuplicate(
    subjectId: string,
    fileHash: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.material.findFirst({
      where: {
        subjectId,
        fileHash,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        isDeleted: false,
        publicationStatus: { in: ['PUBLISHED', 'PENDING_REVIEW', 'HIDDEN'] },
      },
      select: { id: true, publicationStatus: true, hiddenAt: true },
    });
    if (existing) {
      // Only a public copy is named: a pending or hidden one is not the
      // uploader's to see.
      throw new ConflictException(
        isPubliclyVisible(existing, new Date())
          ? {
              code: 'DUPLICATE_MATERIAL',
              visible: true,
              materialId: existing.id,
              message: 'Este archivo ya está publicado en esta materia',
            }
          : {
              code: 'DUPLICATE_MATERIAL',
              visible: false,
              message:
                'Este archivo ya se subió a esta materia y está en revisión',
            },
      );
    }
  }

  /**
   * Returns a material rejected in revisión previa to review, optionally with a
   * corrected file (openspec moderation/publication, «Correct and resubmit»).
   */
  async resubmit(id: string, userId: string, file?: Express.Multer.File) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }
    if (material.authorId !== userId) {
      throw new ForbiddenException(
        'Solo el autor puede reenviar este material',
      );
    }
    if (material.publicationStatus !== 'REJECTED') {
      throw new ConflictException(
        'Solo se pueden reenviar los materiales rechazados en revisión previa',
      );
    }

    let replacement: { staged: StagedFile; fileHash: string } | undefined;
    if (file) {
      if (!file.size || !file.buffer?.length) {
        throw new BadRequestException('El archivo está vacío');
      }
      const fileHash = createHash('sha256').update(file.buffer).digest('hex');
      await this.assertNotDuplicate(material.subjectId, fileHash, id);
      replacement = { staged: await this.storage.stage(file), fileHash };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.material.update({
        where: { id },
        data: {
          publicationStatus: 'PENDING_REVIEW',
          statusChangedAt: new Date(),
          authorFacingReason: null,
          ...(replacement
            ? {
                stagedFilePath: replacement.staged.stagedPath,
                fileHash: replacement.fileHash,
                fileType: replacement.staged.fileType,
                fileSize: BigInt(replacement.staged.fileSize),
                thumbnailUrl: replacement.staged.thumbnailUrl,
              }
            : {}),
        },
      });
      await this.publicationPolicy.openPriorReview(
        tx,
        { type: 'MATERIAL', id },
        userId,
        'RESUBMITTED',
        material.title,
        'RESUBMITTED',
      );
      return next;
    });

    if (replacement && material.stagedFilePath) {
      await this.storage
        .discard(material.stagedFilePath)
        .catch(() => undefined);
    }
    return updated;
  }

  /**
   * Uploads the staged file of a material approved in revisión previa to its final
   * storage and returns the published file fields. The caller writes them.
   */
  async publishStagedFile(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      select: { stagedFilePath: true, fileType: true },
    });
    if (!material?.stagedFilePath) {
      throw new ConflictException(
        'El material pendiente no conserva un archivo para publicar',
      );
    }
    const published = await this.storage.publish(material.stagedFilePath, {
      fileType: material.fileType,
    });
    return {
      fileUrl: published.fileUrl,
      driveFileId: published.driveFileId,
      drivePreviewUrl: published.drivePreviewUrl,
      driveDownloadUrl: published.driveDownloadUrl,
    };
  }

  private async assertUploadLimit(userId: string, now = new Date()) {
    const since = new Date(now.getTime() - UPLOAD_WINDOW_MS);
    const recent = await this.prisma.material.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: DAILY_UPLOAD_LIMIT,
      select: { createdAt: true },
    });
    if (recent.length >= DAILY_UPLOAD_LIMIT) {
      // A slot frees up when the oldest of these leaves the 24-hour window.
      const oldest = recent[DAILY_UPLOAD_LIMIT - 1].createdAt;
      throw new HttpException(
        {
          code: 'UPLOAD_LIMIT',
          retryAt: new Date(oldest.getTime() + UPLOAD_WINDOW_MS).toISOString(),
          message: `Podés subir hasta ${DAILY_UPLOAD_LIMIT} materiales por día`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async findAll(query: MaterialsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const searchKey = query.search
      ? normalizeSearchKey(query.search)
      : undefined;

    const now = new Date();
    const where: Prisma.MaterialWhereInput = {
      isDeleted: false,
      ...publicVisibility(now),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.facultyId ? { subject: { facultyId: query.facultyId } } : {}),
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
              facultyId: query.facultyId,
              limit,
              now,
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
      where: { id, isDeleted: false, ...publicVisibility(new Date()) },
      select: publicMaterialSelect,
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }

    return toPublicMaterial(material);
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

    return this.prisma.$transaction(async (tx) => {
      await this.applyClassification(tx, material, {
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
      });
      return tx.material.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.title !== undefined
            ? { searchKey: normalizeSearchKey(dto.title) }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.shift !== undefined ? { shift: dto.shift } : {}),
        },
        include: {
          author: authorSelect,
          subject: true,
        },
      });
    });
  }

  /**
   * Changes a material's classification (materia, tipo, ciclo, profesor) with
   * the author's validation, inside the caller's transaction. Shared by the
   * author's edit and by accepted corrections (openspec
   * academic-resources/corrections). The pioneer bonus belongs to a materia and
   * type: changing either reverts it and evaluates it again with the new values.
   * Open suggestions the change made obsolete are closed.
   */
  async applyClassification(
    tx: Prisma.TransactionClient,
    target: Pick<Material, 'id'>,
    changes: Partial<
      Pick<
        Material,
        'subjectId' | 'resourceType' | 'academicYear' | 'professorId'
      >
    >,
  ) {
    // Lock and read it fresh: concurrent edits and accepted corrections must
    // validate and move the pioneer bonus against the same values.
    await tx.$queryRaw`SELECT 1 FROM "materials" WHERE "id" = ${target.id}::uuid FOR UPDATE`;
    const material = await tx.material.findUniqueOrThrow({
      where: { id: target.id },
      select: {
        id: true,
        subjectId: true,
        resourceType: true,
        professorId: true,
        authorId: true,
      },
    });
    const nextSubjectId = changes.subjectId ?? material.subjectId;
    const nextProfessorId =
      changes.professorId === undefined
        ? material.professorId
        : changes.professorId;
    await this.assertAcademicContext(nextSubjectId, nextProfessorId);

    const pioneerChanges =
      (changes.subjectId !== undefined &&
        changes.subjectId !== material.subjectId) ||
      (changes.resourceType !== undefined &&
        changes.resourceType !== material.resourceType);

    if (pioneerChanges) await this.pioneerBonus.revoke(tx, material);
    if (Object.keys(changes).length > 0) {
      await tx.material.update({ where: { id: material.id }, data: changes });
    }
    if (pioneerChanges) await this.pioneerBonus.evaluate(tx, material.id);
    await closeObsolete(tx, material.id);
  }

  /**
   * Only the author deletes directly. Staff take content down with a retiro,
   * which follows the alcance de moderación and stays in the history.
   */
  async remove(id: string, userId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material || material.isDeleted) {
      throw new NotFoundException('Material no encontrado');
    }

    if (material.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este material',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.material.update({
        where: { id },
        data: { isDeleted: true },
      });
      // Deleting a material takes back its points, as a retiro does.
      await this.contributionPoints.withdrawn(tx, {
        type: 'MATERIAL',
        id,
        isAnonymous: false,
      });
      await closeObsolete(tx, id);
      return deleted;
    });
  }

  async download(id: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, isDeleted: false, ...publicVisibility(new Date()) },
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
      where: { id, isDeleted: false, ...publicVisibility(new Date()) },
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
        where: { id, isDeleted: false, ...publicVisibility(new Date()) },
        select: { id: true },
      });

      if (!material) {
        throw new NotFoundException('Material no encontrado');
      }

      const mark = { materialId: id, giverId: userId };
      if (isHelpful) {
        await transaction.materialHelpfulness.upsert({
          where: { userId_materialId: { userId, materialId: id } },
          create: { userId, materialId: id },
          update: {},
        });
        await this.helpfulPoints.marked(transaction, mark);
      } else {
        await transaction.materialHelpfulness.deleteMany({
          where: { userId, materialId: id },
        });
        await this.helpfulPoints.unmarked(transaction, mark);
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
        where: { id, isDeleted: false, ...publicVisibility(new Date()) },
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
      where: { id, isDeleted: false, ...publicVisibility(new Date()) },
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
      where: { id, isDeleted: false, ...publicVisibility(new Date()) },
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

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertCorrectionInScope,
  correctionWhere,
  narrow,
  scopeOf,
} from '../moderation/scope';

import {
  MaterialResourceType,
  Prisma,
  type CorrectionField,
  type CorrectionSuggestion,
  type Role,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../common/validation/academic-year';
import { MaterialsService } from '../materials/materials.service';
import { CORRECTION_POINTS, PointLedger } from '../ranking/point-ledger';
import { TrustService } from '../trust/trust.service';
import {
  changeFor,
  isGone,
  isObsolete,
  RESOURCE_TYPE_LABELS,
  serialize,
} from './correction-values';
import type { CreateCorrectionDto } from './dto/create-correction.dto';

/** The author decides for this long; then moderation does. */
export const AUTHOR_PHASE_MS = 7 * 86_400_000;
export const MAX_OPEN_PER_SUGGESTER = 10;

const NO_LONGER_APPLIES = 'La sugerencia ya no aplica.';

const materialSelect = {
  id: true,
  title: true,
  authorId: true,
  subjectId: true,
  resourceType: true,
  academicYear: true,
  professorId: true,
  publicationStatus: true,
  isDeleted: true,
  subject: { select: { code: true, name: true, facultyId: true } },
} as const;

type Decider = { kind: 'AUTHOR' | 'MODERATION'; userId: string };

/**
 * Correction suggestions (openspec academic-resources/corrections): a trusted
 * student proposes a new classification value, the author decides during 7
 * days, then moderation. Phases and obsolescence are computed on read.
 */
@Injectable()
export class CorrectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
    private readonly materials: MaterialsService,
    private readonly ledger: PointLedger,
  ) {}

  async create(
    suggesterId: string,
    materialId: string,
    dto: CreateCorrectionDto,
  ) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      select: materialSelect,
    });
    if (
      !material ||
      material.isDeleted ||
      material.publicationStatus !== 'PUBLISHED'
    ) {
      throw new NotFoundException('Material no encontrado');
    }
    if (material.authorId === suggesterId) {
      throw new ForbiddenException(
        'No podés sugerir correcciones a tus propios materiales.',
      );
    }
    if (!(await this.trust.canSuggestCorrections(suggesterId))) {
      throw new ForbiddenException(
        'Todavía no tenés el privilegio de sugerir correcciones.',
      );
    }

    const proposed = await this.validValue(
      material,
      dto.field,
      dto.proposedValue,
    );
    const current = serialize(material, dto.field);
    if (proposed === current) {
      throw new BadRequestException('Ese ya es el valor actual.');
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        // Concurrent creates by the same student must not pass the limit together.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`corrections:${suggesterId}`}))`;
        const open = await tx.correctionSuggestion.count({
          where: { suggesterId, status: 'OPEN' },
        });
        if (open >= MAX_OPEN_PER_SUGGESTER) {
          throw new ConflictException(
            `Ya tenés ${MAX_OPEN_PER_SUGGESTER} sugerencias abiertas. Esperá a que se decidan.`,
          );
        }
        return tx.correctionSuggestion.create({
          data: {
            materialId,
            suggesterId,
            field: dto.field,
            currentValue: current,
            proposedValue: proposed,
            comment: dto.comment?.trim() || null,
          },
        });
      });
      return { id: created.id, field: created.field, status: created.status };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya hay una sugerencia abierta para ese dato.',
        );
      }
      throw error;
    }
  }

  /**
   * What a correction form offers for a material: materias of its facultad,
   * the professors of its materia, the tipos, and the current values.
   */
  async options(materialId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      select: materialSelect,
    });
    if (
      !material ||
      material.isDeleted ||
      material.publicationStatus !== 'PUBLISHED'
    ) {
      throw new NotFoundException('Material no encontrado');
    }
    const [subjects, links] = await Promise.all([
      this.prisma.subject.findMany({
        where: { facultyId: material.subject.facultyId },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.subjectProfessor.findMany({
        where: { subjectId: material.subjectId },
        orderBy: { professor: { name: 'asc' } },
        select: { professor: { select: { id: true, name: true } } },
      }),
    ]);
    return {
      subjects,
      professors: links.map((link) => link.professor),
      resourceTypes: Object.entries(RESOURCE_TYPE_LABELS).map(
        ([value, label]) => ({ value, label }),
      ),
      current: {
        SUBJECT: serialize(material, 'SUBJECT'),
        RESOURCE_TYPE: serialize(material, 'RESOURCE_TYPE'),
        ACADEMIC_YEAR: serialize(material, 'ACADEMIC_YEAR'),
        PROFESSOR: serialize(material, 'PROFESSOR'),
      },
    };
  }

  /** «Mis envíos»: open suggestions on the author's materials, in their phase. */
  async forAuthor(authorId: string) {
    const rows = await this.openWhere(
      { material: { authorId } },
      { createdAt: { gt: new Date(Date.now() - AUTHOR_PHASE_MS) } },
    );
    return Promise.all(rows.map((row) => this.view(row, false)));
  }

  /** Correcciones tab: suggestions the author left for 7 days, oldest first. */
  async forModeration(
    moderator: { id: string; role: Role },
    seesSuggester = false,
    facultyId?: string,
  ) {
    const moderatorId = moderator.id;
    const scope = correctionWhere(
      narrow(await scopeOf(this.prisma, moderator), facultyId),
    );
    const rows = await this.openWhere(
      {
        suggesterId: { not: moderatorId },
        ...scope,
        material: {
          ...(scope.material as Prisma.MaterialWhereInput),
          authorId: { not: moderatorId },
        },
      },
      { createdAt: { lte: new Date(Date.now() - AUTHOR_PHASE_MS) } },
    );
    return Promise.all(rows.map((row) => this.view(row, seesSuggester)));
  }

  async countForModeration(
    moderator: { id: string; role: Role },
    facultyId?: string,
  ) {
    return (await this.forModeration(moderator, false, facultyId)).length;
  }

  decideAsAuthor(id: string, authorId: string, accept: boolean) {
    return this.decide(id, { kind: 'AUTHOR', userId: authorId }, accept);
  }

  async decideAsModeration(
    id: string,
    moderator: { id: string; role: Role },
    accept: boolean,
  ) {
    await assertCorrectionInScope(this.prisma, moderator, id);
    return this.decide(
      id,
      { kind: 'MODERATION', userId: moderator.id },
      accept,
    );
  }

  private async decide(id: string, decider: Decider, accept: boolean) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "correction_suggestions" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const found = await tx.correctionSuggestion.findUnique({
        where: { id },
        select: { materialId: true },
      });
      if (!found) throw new NotFoundException('Sugerencia no encontrada');
      // The material is locked before it is read, so an author edit or another
      // decision cannot change it between the checks and the change.
      await tx.$queryRaw`SELECT 1 FROM "materials" WHERE "id" = ${found.materialId}::uuid FOR UPDATE`;
      const suggestion = await tx.correctionSuggestion.findUniqueOrThrow({
        where: { id },
        include: { material: { select: materialSelect } },
      });
      this.assertMayDecide(suggestion, decider);
      if (suggestion.status !== 'OPEN') {
        throw new ConflictException({
          message: NO_LONGER_APPLIES,
          code: 'NO_LONGER_APPLIES',
        });
      }
      if (isObsolete(suggestion, suggestion.material)) {
        await tx.correctionSuggestion.update({
          where: { id },
          data: {
            status: 'CLOSED',
            closedReason: isGone(suggestion.material)
              ? 'MATERIAL_GONE'
              : 'FIELD_CHANGED',
            decidedAt: new Date(),
          },
        });
        return 'obsolete' as const;
      }
      if (suggestion.material.publicationStatus !== 'PUBLISHED') {
        throw new ConflictException({
          message:
            'El material está en revisión; decidí cuando vuelva a estar publicado.',
          code: 'MATERIAL_UNDER_REVIEW',
        });
      }

      if (accept) {
        const change = changeFor(suggestion.field, suggestion.proposedValue);
        // A new materia drops a profesor who does not teach it.
        if (
          change.subjectId &&
          suggestion.material.professorId &&
          !(await tx.subjectProfessor.findUnique({
            where: {
              subjectId_professorId: {
                subjectId: change.subjectId,
                professorId: suggestion.material.professorId,
              },
            },
            select: { id: true },
          }))
        ) {
          change.professorId = null;
        }
        try {
          await this.materials.applyClassification(
            tx,
            suggestion.material,
            change,
          );
        } catch (error) {
          // The materia or profesor disappeared since: the change is invalid.
          if (error instanceof NotFoundException) {
            throw new BadRequestException(error.message);
          }
          throw error;
        }
        await this.ledger.award(tx, {
          userId: suggestion.suggesterId,
          reason: 'CORRECTION_ACCEPTED',
          referenceId: suggestion.id,
          amount: CORRECTION_POINTS,
        });
      }
      await tx.correctionSuggestion.update({
        where: { id },
        data: {
          status: accept ? 'ACCEPTED' : 'REJECTED',
          decidedBy: decider.kind,
          decidedById: decider.userId,
          decidedAt: new Date(),
          // Applying it may have marked it obsolete on the way.
          closedReason: null,
        },
      });
      return accept ? ('accepted' as const) : ('rejected' as const);
    });
    // The closing is committed; only then is the decision refused.
    if (outcome === 'obsolete') {
      throw new ConflictException({
        message: NO_LONGER_APPLIES,
        code: 'NO_LONGER_APPLIES',
      });
    }
    return { status: outcome === 'accepted' ? 'ACCEPTED' : 'REJECTED' };
  }

  private assertMayDecide(
    suggestion: CorrectionSuggestion & { material: { authorId: string } },
    decider: Decider,
  ) {
    const authorPhase =
      Date.now() - suggestion.createdAt.getTime() < AUTHOR_PHASE_MS;
    if (decider.kind === 'AUTHOR') {
      if (suggestion.material.authorId !== decider.userId) {
        throw new NotFoundException('Sugerencia no encontrada');
      }
      if (!authorPhase) {
        throw new ConflictException(
          'Pasaron 7 días: ahora la decide moderación.',
        );
      }
      return;
    }
    if (
      suggestion.suggesterId === decider.userId ||
      suggestion.material.authorId === decider.userId
    ) {
      throw new ForbiddenException(
        'No podés decidir sobre tu propia sugerencia o tu propio material.',
      );
    }
    if (authorPhase) {
      throw new ConflictException(
        'El autor todavía puede decidir esta sugerencia.',
      );
    }
  }

  /** Open suggestions that still apply, oldest first. */
  private async openWhere(
    scope: Prisma.CorrectionSuggestionWhereInput,
    phase: Prisma.CorrectionSuggestionWhereInput,
  ) {
    const rows = await this.prisma.correctionSuggestion.findMany({
      where: {
        status: 'OPEN',
        ...scope,
        ...phase,
        material: {
          ...(scope.material as Prisma.MaterialWhereInput),
          publicationStatus: 'PUBLISHED',
          isDeleted: false,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        material: { select: materialSelect },
        suggester: { select: { username: true } },
      },
    });
    // A field changed after the suggestion was made: it no longer applies.
    return rows.filter((row) => !isObsolete(row, row.material));
  }

  private async view(
    row: CorrectionSuggestion & {
      material: {
        id: string;
        title: string;
        subject: { code: string | null; name: string };
      };
      suggester: { username: string };
    },
    withSuggester: boolean,
  ) {
    const [current, proposed] = await Promise.all([
      this.label(row.field, row.currentValue),
      this.label(row.field, row.proposedValue),
    ]);
    return {
      id: row.id,
      field: row.field,
      material: {
        id: row.material.id,
        title: row.material.title,
        subject: {
          code: row.material.subject.code,
          name: row.material.subject.name,
        },
      },
      current,
      proposed,
      comment: row.comment,
      createdAt: row.createdAt,
      // The author judges the content, never who suggested it.
      ...(withSuggester ? { suggester: row.suggester.username } : {}),
    };
  }

  private async label(field: CorrectionField, value: string | null) {
    if (value === null) {
      return field === 'PROFESSOR' ? 'Sin profesor' : 'Sin ciclo lectivo';
    }
    switch (field) {
      case 'RESOURCE_TYPE':
        return RESOURCE_TYPE_LABELS[value as MaterialResourceType] ?? value;
      case 'ACADEMIC_YEAR':
        return value;
      case 'SUBJECT': {
        const subject = await this.prisma.subject.findUnique({
          where: { id: value },
          select: { code: true, name: true },
        });
        if (!subject) return 'Materia eliminada';
        return subject.code
          ? `${subject.name} (${subject.code})`
          : subject.name;
      }
      case 'PROFESSOR': {
        const professor = await this.prisma.professor.findUnique({
          where: { id: value },
          select: { name: true },
        });
        return professor?.name ?? 'Profesor eliminado';
      }
    }
  }

  /** The proposed value, serialized, after the same checks an author edit runs. */
  private async validValue(
    material: {
      subjectId: string;
      professorId: string | null;
      subject: { facultyId: string };
    },
    field: CorrectionField,
    raw: string | null,
  ): Promise<string | null> {
    const value = typeof raw === 'string' ? raw.trim() : null;
    switch (field) {
      case 'RESOURCE_TYPE':
        if (!value || !Object.hasOwn(MaterialResourceType, value)) {
          throw new BadRequestException('Ese tipo de recurso no existe.');
        }
        return value;
      case 'ACADEMIC_YEAR': {
        if (value === null || value === '') return null;
        const year = Number(value);
        if (
          !Number.isInteger(year) ||
          year < MIN_ACADEMIC_YEAR ||
          year > MAX_ACADEMIC_YEAR
        ) {
          throw new BadRequestException('Ese ciclo lectivo no es válido.');
        }
        return String(year);
      }
      case 'SUBJECT': {
        if (!value) throw new BadRequestException('Elegí una materia.');
        const subject = await this.findUuid(() =>
          this.prisma.subject.findUnique({
            where: { id: value },
            select: { facultyId: true },
          }),
        );
        if (!subject) throw new BadRequestException('Esa materia no existe.');
        if (subject.facultyId !== material.subject.facultyId) {
          throw new BadRequestException(
            'La materia tiene que ser de la misma facultad.',
          );
        }
        // A profesor who does not teach the new materia is dropped on accept.
        return value;
      }
      case 'PROFESSOR': {
        if (value === null || value === '') return null;
        await this.assertProfessorOf(material.subjectId, value);
        return value;
      }
    }
  }

  private async assertProfessorOf(subjectId: string, professorId: string) {
    const link = await this.findUuid(() =>
      this.prisma.subjectProfessor.findUnique({
        where: { subjectId_professorId: { subjectId, professorId } },
        select: { id: true },
      }),
    );
    if (!link) {
      throw new BadRequestException(
        'El profesor indicado no está asociado a la materia.',
      );
    }
  }

  /** A malformed uuid is just «not found», never a 500. */
  private async findUuid<T>(query: () => Promise<T | null>) {
    try {
      return await query();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) return null;
      if (error instanceof Prisma.PrismaClientValidationError) return null;
      throw error;
    }
  }
}

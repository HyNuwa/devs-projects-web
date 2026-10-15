import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import type { ModerationEventAction } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeSearchKey } from '../../common/search/search-key';
import { CODE_MAX, proposeSubjectCode } from './catalog-codes';
import { recordSlugChange, resolveAlias } from './slug-aliases';
import type {
  CreateCareerDto,
  CreateFacultyDto,
  CreateSubjectDto,
  CreateUniversityDto,
  PlacementDto,
  UpdateCareerDto,
  UpdateFacultyDto,
  UpdateSubjectDto,
  UpdateUniversityDto,
} from './dto/catalog.dto';
import { placementValue } from './dto/catalog.dto';

type Tx = Prisma.TransactionClient;
export type CatalogKind = 'UNIVERSITY' | 'FACULTY' | 'CAREER' | 'SUBJECT';
type Snapshot = Record<string, unknown> | null;

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});
const byName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

type Placed = { name: string; year: number | null; semester: number | null };
/** By año and cuatrimestre (anual first), then optativas, each by name. */
export const byPlacement = (a: Placed, b: Placed) =>
  Number(a.year === null) - Number(b.year === null) ||
  (a.year ?? 0) - (b.year ?? 0) ||
  (a.semester ?? 0) - (b.semester ?? 0) ||
  byName(a, b);

const duplicate = (field: string, message: string) =>
  new ConflictException({ code: 'CATALOG_DUPLICATE', field, message });

const BLOCKER_LABELS: Record<string, string> = {
  faculties: 'facultades',
  careers: 'carreras',
  subjects: 'materias',
  moderators: 'moderadores asignados',
  requests: 'solicitudes de carrera',
  declarations: 'estudiantes que la declararon',
  materials: 'materiales',
  reviews: 'reseñas',
  experiences: 'experiencias de final',
};

/** Refuses a deletion while anything depends on the entity, saying what. */
function blockIfAny(counts: Record<string, number>) {
  const blockers = Object.fromEntries(
    Object.entries(counts).filter(([, count]) => count > 0),
  );
  if (Object.keys(blockers).length === 0) return;
  const list = Object.entries(blockers)
    .map(([key, count]) => `${count} ${BLOCKER_LABELS[key]}`)
    .join(', ');
  throw new ConflictException({
    code: 'CATALOG_BLOCKED',
    blockers,
    message: `No se puede borrar: tiene ${list}.`,
  });
}

/** Keeps only the fields a request changes, for the history's before/after. */
function changed<T extends Record<string, unknown>>(
  current: T,
  patch: Partial<T>,
): { before: Partial<T>; after: Partial<T> } {
  const before: Partial<T> = {};
  const after: Partial<T> = {};
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (patch[key] === undefined || patch[key] === current[key]) continue;
    before[key] = current[key];
    after[key] = patch[key];
  }
  return { before, after };
}

/**
 * Every catálogo write (openspec academic-structure/catalog-editing). Each
 * method runs in one transaction that also records its history event, so no
 * write can skip the record.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reading the tree ──────────────────────────────────────────────────────

  async universities() {
    const rows = await this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        _count: { select: { faculties: true } },
      },
    });
    return rows
      .map(({ _count, ...university }) => ({
        ...university,
        facultyCount: _count.faculties,
      }))
      .sort(byName);
  }

  async faculties(universityId: string) {
    await this.mustExist('UNIVERSITY', universityId);
    const rows = await this.prisma.faculty.findMany({
      where: { universityId },
      select: {
        id: true,
        name: true,
        shortName: true,
        _count: { select: { careers: true, subjects: true, moderators: true } },
      },
    });
    return rows
      .map(({ _count, ...faculty }) => ({
        ...faculty,
        careerCount: _count.careers,
        subjectCount: _count.subjects,
        moderatorCount: _count.moderators,
      }))
      .sort(byName);
  }

  async careers(facultyId: string) {
    await this.mustExist('FACULTY', facultyId);
    const rows = await this.prisma.career.findMany({
      where: { facultyId },
      select: { id: true, name: true, code: true, status: true, planUrl: true },
    });
    return rows.sort(byName);
  }

  async subjects(facultyId: string) {
    await this.mustExist('FACULTY', facultyId);
    const rows = await this.prisma.subject.findMany({
      where: { facultyId },
      select: { id: true, name: true, code: true, materialCount: true },
    });
    return rows.sort(byName);
  }

  async career(careerId: string) {
    const career = await this.prisma.career.findUnique({
      where: { id: careerId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        planUrl: true,
        faculty: {
          select: {
            id: true,
            name: true,
            shortName: true,
            university: { select: { id: true, name: true, shortName: true } },
          },
        },
        studyPlans: {
          select: {
            _count: { select: { users: true } },
            subjects: {
              select: {
                year: true,
                semester: true,
                credits: true,
                subject: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    const [plan] = career.studyPlans;
    const placements = (plan?.subjects ?? [])
      .map(({ subject, ...placement }) => ({
        subjectId: subject.id,
        name: subject.name,
        code: subject.code,
        ...placement,
      }))
      .sort(byPlacement);
    const { studyPlans: _plans, ...rest } = career;
    return {
      ...rest,
      declarationCount: plan?._count.users ?? 0,
      placements,
    };
  }

  // ── Universidades and facultades ──────────────────────────────────────────

  /** `outer` joins a caller's transaction (accepting a solicitud). */
  createUniversity(actorId: string, dto: CreateUniversityDto, outer?: Tx) {
    return this.run(outer, async (tx) => {
      await this.assertUniversityFree(tx, dto);
      const university = await tx.university.create({
        data: { name: dto.name, shortName: dto.shortName },
        select: { id: true, name: true, shortName: true },
      });
      await this.afterRename(
        tx,
        'UNIVERSITY',
        university.id,
        null,
        undefined,
        dto.shortName,
      );
      await this.record(tx, actorId, 'CATALOG_CREATED', {
        kind: 'UNIVERSITY',
        id: university.id,
        label: university.name,
        before: null,
        after: { name: university.name, shortName: university.shortName },
      });
      return university;
    });
  }

  updateUniversity(actorId: string, id: string, dto: UpdateUniversityDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.university.findUnique({
        where: { id },
        select: { name: true, shortName: true },
      });
      if (!current) throw new NotFoundException('Universidad no encontrada');
      const { before, after } = changed(current, dto);
      await this.assertUniversityFree(tx, after, id);
      const university = await tx.university.update({
        where: { id },
        data: after,
        select: { id: true, name: true, shortName: true },
      });
      await this.afterRename(
        tx,
        'UNIVERSITY',
        id,
        null,
        before.shortName,
        after.shortName,
      );
      await this.recordUpdate(
        tx,
        actorId,
        'UNIVERSITY',
        id,
        university.name,
        before,
        after,
      );
      return university;
    });
  }

  /** `outer` joins a caller's transaction (accepting a solicitud). */
  createFaculty(actorId: string, dto: CreateFacultyDto, outer?: Tx) {
    return this.run(outer, async (tx) => {
      await this.mustExist('UNIVERSITY', dto.universityId, tx);
      await this.assertFacultyFree(tx, dto.universityId, dto);
      const faculty = await tx.faculty.create({
        data: {
          universityId: dto.universityId,
          name: dto.name,
          shortName: dto.shortName,
        },
        select: { id: true, universityId: true, name: true, shortName: true },
      });
      await this.afterRename(
        tx,
        'FACULTY',
        faculty.id,
        dto.universityId,
        undefined,
        dto.shortName,
      );
      await this.record(tx, actorId, 'CATALOG_CREATED', {
        kind: 'FACULTY',
        id: faculty.id,
        label: faculty.name,
        before: null,
        after: {
          universityId: dto.universityId,
          name: dto.name,
          shortName: dto.shortName,
        },
      });
      return faculty;
    });
  }

  updateFaculty(actorId: string, id: string, dto: UpdateFacultyDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.faculty.findUnique({
        where: { id },
        select: { universityId: true, name: true, shortName: true },
      });
      if (!current) throw new NotFoundException('Facultad no encontrada');
      const { universityId, ...editable } = current;
      const { before, after } = changed(editable, dto);
      await this.assertFacultyFree(tx, universityId, after, id);
      const faculty = await tx.faculty.update({
        where: { id },
        data: after,
        select: { id: true, universityId: true, name: true, shortName: true },
      });
      await this.afterRename(
        tx,
        'FACULTY',
        id,
        universityId,
        before.shortName,
        after.shortName,
      );
      await this.recordUpdate(
        tx,
        actorId,
        'FACULTY',
        id,
        faculty.name,
        before,
        after,
      );
      return faculty;
    });
  }

  // ── Carreras ──────────────────────────────────────────────────────────────

  /** `outer` joins a caller's transaction (accepting a solicitud). */
  createCareer(actorId: string, dto: CreateCareerDto, outer?: Tx) {
    return this.run(outer, async (tx) => {
      await this.mustExist('FACULTY', dto.facultyId, tx);
      await this.assertCareerCodeFree(tx, dto.facultyId, dto.code);
      const career = await tx.career.create({
        data: {
          facultyId: dto.facultyId,
          name: dto.name,
          code: dto.code,
          planUrl: dto.planUrl ?? null,
          status: 'DRAFT',
          // The single internal plan (ADR 0003); duration follows the años.
          studyPlans: {
            create: [{ name: dto.name, code: dto.code, duration: 0 }],
          },
        },
        select: {
          id: true,
          facultyId: true,
          name: true,
          code: true,
          planUrl: true,
          status: true,
        },
      });
      await this.afterRename(
        tx,
        'CAREER',
        career.id,
        dto.facultyId,
        undefined,
        dto.code,
      );
      await this.record(tx, actorId, 'CATALOG_CREATED', {
        kind: 'CAREER',
        id: career.id,
        label: career.name,
        before: null,
        after: {
          facultyId: dto.facultyId,
          name: dto.name,
          code: dto.code,
          planUrl: career.planUrl,
        },
      });
      return career;
    });
  }

  updateCareer(actorId: string, id: string, dto: UpdateCareerDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.career.findUnique({
        where: { id },
        select: { facultyId: true, name: true, code: true, planUrl: true },
      });
      if (!current) throw new NotFoundException('Carrera no encontrada');
      const { facultyId, ...editable } = current;
      const { before, after } = changed(editable, dto);
      if (after.code !== undefined) {
        await this.assertCareerCodeFree(tx, facultyId, after.code, id);
      }
      const career = await tx.career.update({
        where: { id },
        data: after,
        select: {
          id: true,
          facultyId: true,
          name: true,
          code: true,
          planUrl: true,
          status: true,
        },
      });
      await this.afterRename(
        tx,
        'CAREER',
        id,
        facultyId,
        before.code,
        after.code,
      );
      await this.recordUpdate(
        tx,
        actorId,
        'CAREER',
        id,
        career.name,
        before,
        after,
      );
      return career;
    });
  }

  publish(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const career = await this.lockCareer(tx, id);
      if (career.status === 'PUBLISHED') {
        return { id, status: 'PUBLISHED' as const, publishedRequestIds: [] };
      }
      await tx.career.update({ where: { id }, data: { status: 'PUBLISHED' } });
      // Its accepted solicitudes are done; their students get an email after commit.
      const accepted = await tx.careerRequest.findMany({
        where: { careerId: id, status: 'ACCEPTED' },
        select: { id: true },
      });
      await tx.careerRequest.updateMany({
        where: { careerId: id, status: 'ACCEPTED' },
        data: { status: 'PUBLISHED' },
      });
      await this.record(tx, actorId, 'CAREER_PUBLISHED', {
        kind: 'CAREER',
        id,
        label: career.name,
        before: { status: 'DRAFT' },
        after: { status: 'PUBLISHED' },
      });
      return {
        id,
        status: 'PUBLISHED' as const,
        publishedRequestIds: accepted.map((request) => request.id),
      };
    });
  }

  /** Back to borrador, only while nobody declared it. */
  unpublish(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const career = await this.lockCareer(tx, id);
      if (career.status === 'DRAFT') return { id, status: 'DRAFT' as const };
      const declarations = await tx.userStudyPlan.count({
        where: { studyPlan: { careerId: id } },
      });
      if (declarations > 0) {
        throw new ConflictException({
          code: 'CATALOG_BLOCKED',
          blockers: { declarations },
          message:
            'No se puede volver a borrador: hay estudiantes que la declararon.',
        });
      }
      await tx.career.update({ where: { id }, data: { status: 'DRAFT' } });
      await this.record(tx, actorId, 'CAREER_UNPUBLISHED', {
        kind: 'CAREER',
        id,
        label: career.name,
        before: { status: 'PUBLISHED' },
        after: { status: 'DRAFT' },
      });
      return { id, status: 'DRAFT' as const };
    });
  }

  /** Locks the carrera row so publishing races with declarations serialize. */
  private async lockCareer(tx: Tx, id: string) {
    const [career] = await tx.$queryRaw<
      { name: string; status: 'DRAFT' | 'PUBLISHED' }[]
    >`
      SELECT "name", "status"::text AS "status" FROM "careers" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!career) throw new NotFoundException('Carrera no encontrada');
    return career;
  }

  // ── Materias and placements ───────────────────────────────────────────────

  async proposeCode(
    facultyId: string,
    name: string,
    tx: Tx = this.prisma,
    extra: ReadonlySet<string> = new Set(),
  ) {
    const faculty = await tx.faculty.findUnique({
      where: { id: facultyId },
      select: { shortName: true, university: { select: { shortName: true } } },
    });
    if (!faculty) throw new NotFoundException('Facultad no encontrada');
    const base = proposeSubjectCode(
      faculty.university.shortName,
      faculty.shortName,
      name,
      new Set(),
    );
    const taken = new Set(extra);
    // A truncated base gets its -N suffix by cutting more characters, so look
    // for taken codes by a prefix short enough to cover suffixes up to -9999.
    const prefix = base.slice(0, CODE_MAX - 5).replace(/-+$/, '');
    const [codes, aliases] = await Promise.all([
      tx.subject.findMany({
        where: { code: { startsWith: prefix, mode: 'insensitive' } },
        select: { code: true },
      }),
      tx.catalogSlugAlias.findMany({
        where: { kind: 'SUBJECT', slug: { startsWith: prefix.toLowerCase() } },
        select: { slug: true },
      }),
    ]);
    for (const { code } of codes) if (code) taken.add(code.toLowerCase());
    for (const { slug } of aliases) taken.add(slug);
    return proposeSubjectCode(
      faculty.university.shortName,
      faculty.shortName,
      name,
      taken,
    );
  }

  createSubject(actorId: string, dto: CreateSubjectDto) {
    return this.prisma.$transaction(async (tx) => {
      const code =
        dto.code ?? (await this.proposeCode(dto.facultyId, dto.name, tx));
      if (dto.code) {
        await this.mustExist('FACULTY', dto.facultyId, tx);
        await this.assertSubjectCodeFree(tx, code);
      }
      const subject = await tx.subject.create({
        data: {
          facultyId: dto.facultyId,
          name: dto.name,
          code,
          searchKey: normalizeSearchKey(dto.name, code),
        },
        select: { id: true, facultyId: true, name: true, code: true },
      });
      await this.afterRename(tx, 'SUBJECT', subject.id, null, undefined, code);
      await this.record(tx, actorId, 'CATALOG_CREATED', {
        kind: 'SUBJECT',
        id: subject.id,
        label: subject.name,
        before: null,
        after: { facultyId: dto.facultyId, name: dto.name, code },
      });
      return subject;
    });
  }

  updateSubject(actorId: string, id: string, dto: UpdateSubjectDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.subject.findUnique({
        where: { id },
        select: { name: true, code: true },
      });
      if (!current) throw new NotFoundException('Materia no encontrada');
      const { before, after } = changed(current, dto);
      if (after.code) await this.assertSubjectCodeFree(tx, after.code, id);
      const subject = await tx.subject.update({
        where: { id },
        // Discovery search reads the key built from name and code.
        data: {
          ...after,
          searchKey: normalizeSearchKey(
            after.name ?? current.name,
            after.code ?? current.code,
          ),
        },
        select: { id: true, facultyId: true, name: true, code: true },
      });
      await this.afterRename(
        tx,
        'SUBJECT',
        id,
        null,
        before.code ?? undefined,
        after.code ?? undefined,
      );
      await this.recordUpdate(
        tx,
        actorId,
        'SUBJECT',
        id,
        subject.name,
        before,
        after,
      );
      return subject;
    });
  }

  setPlacement(
    actorId: string,
    careerId: string,
    subjectId: string,
    dto: PlacementDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { planId, career } = await this.placementTarget(
        tx,
        careerId,
        subjectId,
      );
      const value = placementValue(dto);
      const before = await tx.studyPlanSubject.findUnique({
        where: { studyPlanId_subjectId: { studyPlanId: planId, subjectId } },
        select: { year: true, semester: true, credits: true },
      });
      await tx.studyPlanSubject.upsert({
        where: { studyPlanId_subjectId: { studyPlanId: planId, subjectId } },
        create: { studyPlanId: planId, subjectId, ...value },
        update: value,
      });
      await this.refreshDuration(tx, planId);
      await this.record(tx, actorId, 'CATALOG_PLACEMENT_CHANGED', {
        kind: 'CAREER',
        id: careerId,
        label: career.name,
        before: before && { subjectId, ...before },
        after: { subjectId, ...value },
      });
      return { subjectId, ...value };
    });
  }

  removePlacement(actorId: string, careerId: string, subjectId: string) {
    return this.prisma.$transaction(async (tx) => {
      const { planId, career } = await this.placementTarget(
        tx,
        careerId,
        subjectId,
      );
      const before = await tx.studyPlanSubject.findUnique({
        where: { studyPlanId_subjectId: { studyPlanId: planId, subjectId } },
        select: { year: true, semester: true, credits: true },
      });
      if (!before)
        throw new NotFoundException('La materia no está en la carrera');
      await tx.studyPlanSubject.delete({
        where: { studyPlanId_subjectId: { studyPlanId: planId, subjectId } },
      });
      await this.refreshDuration(tx, planId);
      await this.record(tx, actorId, 'CATALOG_PLACEMENT_CHANGED', {
        kind: 'CAREER',
        id: careerId,
        label: career.name,
        before: { subjectId, ...before },
        after: null,
      });
    });
  }

  // ── Deleting what is empty ────────────────────────────────────────────────

  deleteUniversity(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const university = await tx.university.findUnique({
        where: { id },
        select: {
          name: true,
          shortName: true,
          _count: { select: { faculties: true } },
        },
      });
      if (!university) throw new NotFoundException('Universidad no encontrada');
      blockIfAny({ faculties: university._count.faculties });
      await tx.university.delete({ where: { id } });
      await tx.catalogSlugAlias.deleteMany({ where: { parentId: id } });
      await this.deleted(tx, actorId, 'UNIVERSITY', id, university.name, {
        name: university.name,
        shortName: university.shortName,
      });
    });
  }

  deleteFaculty(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const faculty = await tx.faculty.findUnique({
        where: { id },
        select: {
          universityId: true,
          name: true,
          shortName: true,
          _count: {
            select: {
              careers: true,
              subjects: true,
              moderators: true,
              careerRequests: true,
            },
          },
        },
      });
      if (!faculty) throw new NotFoundException('Facultad no encontrada');
      const {
        careers,
        subjects,
        moderators,
        careerRequests: requests,
      } = faculty._count;
      blockIfAny({ careers, subjects, moderators, requests });
      await tx.faculty.delete({ where: { id } });
      await tx.catalogSlugAlias.deleteMany({ where: { parentId: id } });
      await this.deleted(tx, actorId, 'FACULTY', id, faculty.name, {
        universityId: faculty.universityId,
        name: faculty.name,
        shortName: faculty.shortName,
      });
    });
  }

  /** Deletes a carrera nobody declared; its accepted solicitudes go back to pending. */
  deleteCareer(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const career = await this.lockCareer(tx, id);
      const fields = await tx.career.findUniqueOrThrow({
        where: { id },
        select: { facultyId: true, code: true, planUrl: true },
      });
      const declarations = await tx.userStudyPlan.count({
        where: { studyPlan: { careerId: id } },
      });
      blockIfAny({ declarations });
      await tx.careerRequest.updateMany({
        where: { careerId: id, status: 'ACCEPTED' },
        data: {
          status: 'PENDING',
          careerId: null,
          resolvedById: null,
          resolvedAt: null,
        },
      });
      await tx.career.delete({ where: { id } });
      await this.deleted(tx, actorId, 'CAREER', id, career.name, {
        ...fields,
        name: career.name,
        status: career.status,
      });
    });
  }

  /** Deletes a materia without content; it leaves every carrera. */
  deleteSubject(actorId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({
        where: { id },
        select: {
          facultyId: true,
          name: true,
          code: true,
          _count: {
            select: {
              materials: true,
              courseReviews: true,
              examExperiences: true,
            },
          },
        },
      });
      if (!subject) throw new NotFoundException('Materia no encontrada');
      const {
        materials,
        courseReviews: reviews,
        examExperiences: experiences,
      } = subject._count;
      blockIfAny({ materials, reviews, experiences });
      await tx.subject.delete({ where: { id } });
      await this.deleted(tx, actorId, 'SUBJECT', id, subject.name, {
        facultyId: subject.facultyId,
        name: subject.name,
        code: subject.code,
      });
    });
  }

  private async deleted(
    tx: Tx,
    actorId: string,
    kind: CatalogKind,
    id: string,
    label: string,
    before: Record<string, unknown>,
  ) {
    await tx.catalogSlugAlias.deleteMany({ where: { targetId: id } });
    await this.record(tx, actorId, 'CATALOG_DELETED', {
      kind,
      id,
      label,
      before,
      after: null,
    });
  }

  // ── Helpers shared with the other catálogo services ───────────────────────

  private run<T>(outer: Tx | undefined, work: (tx: Tx) => Promise<T>) {
    return outer ? work(outer) : this.prisma.$transaction(work);
  }

  async record(
    tx: Tx,
    actorId: string,
    action: ModerationEventAction,
    metadata: {
      kind: CatalogKind;
      id: string;
      label: string;
      before: Snapshot;
      after: Snapshot;
    } & Record<string, unknown>,
  ) {
    await tx.moderationEvent.create({
      data: { actorId, action, metadata: metadata as Prisma.InputJsonValue },
    });
  }

  /** Keeps old slugs redirecting after a create or rename. */
  async afterRename(
    tx: Tx,
    kind: CatalogKind,
    id: string,
    parentId: string | null,
    previous: string | undefined,
    next: string | undefined,
  ) {
    await recordSlugChange(tx, kind, id, parentId, previous, next);
  }

  /**
   * Who an alias with this slug points to, so the editor can warn before the
   * new slug takes it over. `parentId` as in the aliases table.
   */
  async slugCheck(kind: CatalogKind, parentId: string | null, slug: string) {
    const targetId = await resolveAlias(this.prisma, kind, parentId, slug);
    if (!targetId) return { alias: null };
    const select = { id: true, name: true } as const;
    const target =
      kind === 'UNIVERSITY'
        ? await this.prisma.university.findUnique({
            where: { id: targetId },
            select: { ...select, shortName: true },
          })
        : kind === 'FACULTY'
          ? await this.prisma.faculty.findUnique({
              where: { id: targetId },
              select: { ...select, shortName: true },
            })
          : kind === 'CAREER'
            ? await this.prisma.career.findUnique({
                where: { id: targetId },
                select: { ...select, code: true },
              })
            : await this.prisma.subject.findUnique({
                where: { id: targetId },
                select: { ...select, code: true },
              });
    return { alias: target && { kind, ...target } };
  }

  private async recordUpdate(
    tx: Tx,
    actorId: string,
    kind: CatalogKind,
    id: string,
    label: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    if (Object.keys(after).length === 0) return;
    await this.record(tx, actorId, 'CATALOG_UPDATED', {
      kind,
      id,
      label,
      before,
      after,
    });
  }

  async mustExist(
    kind: 'UNIVERSITY' | 'FACULTY',
    id: string,
    tx: Tx = this.prisma,
  ) {
    const found =
      kind === 'UNIVERSITY'
        ? await tx.university.findUnique({
            where: { id },
            select: { id: true },
          })
        : await tx.faculty.findUnique({ where: { id }, select: { id: true } });
    if (!found) {
      throw new NotFoundException(
        kind === 'UNIVERSITY'
          ? 'Universidad no encontrada'
          : 'Facultad no encontrada',
      );
    }
  }

  private async assertUniversityFree(
    tx: Tx,
    { name, shortName }: { name?: string; shortName?: string },
    exceptId?: string,
  ) {
    const not = exceptId ? { NOT: { id: exceptId } } : {};
    if (
      shortName &&
      (await tx.university.findFirst({
        where: {
          shortName: { equals: shortName, mode: 'insensitive' },
          ...not,
        },
      }))
    ) {
      throw duplicate(
        'shortName',
        'Ya hay una universidad con ese nombre corto.',
      );
    }
    if (
      name &&
      (await tx.university.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, ...not },
      }))
    ) {
      throw duplicate('name', 'Ya hay una universidad con ese nombre.');
    }
  }

  private async assertFacultyFree(
    tx: Tx,
    universityId: string,
    { name, shortName }: { name?: string; shortName?: string },
    exceptId?: string,
  ) {
    const not = exceptId ? { NOT: { id: exceptId } } : {};
    if (
      shortName &&
      (await tx.faculty.findFirst({
        where: {
          universityId,
          shortName: { equals: shortName, mode: 'insensitive' },
          ...not,
        },
      }))
    ) {
      throw duplicate(
        'shortName',
        'Ya hay una facultad con ese nombre corto en la universidad.',
      );
    }
    if (
      name &&
      (await tx.faculty.findFirst({
        where: {
          universityId,
          name: { equals: name, mode: 'insensitive' },
          ...not,
        },
      }))
    ) {
      throw duplicate(
        'name',
        'Ya hay una facultad con ese nombre en la universidad.',
      );
    }
  }

  private async assertCareerCodeFree(
    tx: Tx,
    facultyId: string,
    code: string,
    exceptId?: string,
  ) {
    const not = exceptId ? { NOT: { id: exceptId } } : {};
    if (
      await tx.career.findFirst({
        where: {
          facultyId,
          code: { equals: code, mode: 'insensitive' },
          ...not,
        },
      })
    ) {
      throw duplicate(
        'code',
        'Ya hay una carrera con ese código en la facultad.',
      );
    }
  }

  private async assertSubjectCodeFree(tx: Tx, code: string, exceptId?: string) {
    const not = exceptId ? { NOT: { id: exceptId } } : {};
    if (
      await tx.subject.findFirst({
        where: { code: { equals: code, mode: 'insensitive' }, ...not },
      })
    ) {
      throw duplicate('code', 'Ya hay una materia con ese código.');
    }
  }

  private async placementTarget(tx: Tx, careerId: string, subjectId: string) {
    const career = await tx.career.findUnique({
      where: { id: careerId },
      select: {
        name: true,
        facultyId: true,
        studyPlans: { select: { id: true } },
      },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    const subject = await tx.subject.findUnique({
      where: { id: subjectId },
      select: { facultyId: true },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    if (subject.facultyId !== career.facultyId) {
      throw new ConflictException({
        code: 'CATALOG_OTHER_FACULTY',
        message:
          'La materia es de otra facultad: una carrera solo incluye materias de su facultad.',
      });
    }
    const planId = career.studyPlans[0]?.id;
    if (!planId) throw new NotFoundException('La carrera no tiene plan');
    return { planId, career };
  }

  async refreshDuration(tx: Tx, planId: string) {
    const { _max } = await tx.studyPlanSubject.aggregate({
      where: { studyPlanId: planId },
      _max: { year: true },
    });
    await tx.studyPlan.update({
      where: { id: planId },
      data: { duration: _max.year ?? 0 },
    });
  }
}

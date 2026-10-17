import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { normalizeSearchKey } from '../../common/search/search-key';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { parseBulk, type Semester } from './bulk-parser';
import { CatalogService } from './catalog.service';
import { type BulkRowDto, placementValue } from './dto/catalog.dto';

type Tx = Prisma.TransactionClient;

/** Rows per carga masiva, as BulkApplyDto allows. */
export const BULK_MAX_ROWS = 200;

export type PreviewRow = {
  line: number;
  year: number | null;
  semester: Semester | null;
  name: string;
  credits: number | null;
  optativa: boolean;
  errors: string[];
  /** reuse a materia of the facultad, create a new one, or nothing (invalid). */
  action: 'reuse' | 'new' | 'invalid';
  subjectId: string | null;
  code: string | null;
  /** What happens to the carrera: add the materia, update its place, or nothing. */
  placement: 'add' | 'update' | 'unchanged' | null;
};

/**
 * Carga masiva (openspec academic-structure/catalog-editing): the preview
 * writes nothing; apply re-validates the reviewed rows and writes them all or
 * none. It never removes a materia from the carrera.
 */
@Injectable()
export class CatalogBulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async preview(careerId: string, text: string): Promise<PreviewRow[]> {
    const { facultyId, placements } = await this.careerContext(
      this.prisma,
      careerId,
    );
    const subjects = await this.prisma.subject.findMany({
      where: { facultyId },
      select: { id: true, name: true, code: true },
    });
    const byName = new Map(
      subjects.map((s) => [normalizeSearchKey(s.name), s]),
    );
    const seen = new Map<string, number>();
    const proposed = new Set<string>();
    const rows: PreviewRow[] = [];

    const parsedRows = parseBulk(text);
    if (parsedRows.length > BULK_MAX_ROWS) {
      throw new BadRequestException({
        code: 'BULK_TOO_LONG',
        message: `Pegá hasta ${BULK_MAX_ROWS} materias por vez.`,
      });
    }
    for (const parsed of parsedRows) {
      const row: PreviewRow = {
        ...parsed,
        action: 'invalid',
        subjectId: null,
        code: null,
        placement: null,
      };
      const key = normalizeSearchKey(parsed.name);
      if (parsed.name && seen.has(key)) {
        row.errors.push(`Repite la materia de la línea ${seen.get(key)}.`);
      }
      if (parsed.name) seen.set(key, parsed.line);
      if (row.errors.length === 0) {
        const existing = byName.get(key);
        if (existing) {
          row.action = 'reuse';
          row.subjectId = existing.id;
          row.code = existing.code;
          const current = placements.get(existing.id);
          row.placement = !current
            ? 'add'
            : current.year === parsed.year &&
                current.semester === parsed.semester &&
                current.credits === parsed.credits
              ? 'unchanged'
              : 'update';
        } else {
          row.action = 'new';
          row.code = await this.catalog.proposeCode(
            facultyId,
            parsed.name,
            this.prisma,
            proposed,
          );
          proposed.add(row.code);
          row.placement = 'add';
        }
      }
      rows.push(row);
    }
    return rows;
  }

  apply(actorId: string, careerId: string, rows: BulkRowDto[]) {
    return this.prisma.$transaction(
      async (tx) => {
        const { facultyId, planId, name, placements } =
          await this.careerContext(tx, careerId);
        await this.validate(tx, facultyId, rows);

        let created = 0;
        let added = 0;
        let updated = 0;
        const applied: Record<string, unknown>[] = [];
        for (const row of rows) {
          let subjectId = row.subjectId!;
          if (row.action === 'new') {
            const subject = await tx.subject.create({
              data: {
                facultyId,
                name: row.name!,
                code: row.code!,
                searchKey: normalizeSearchKey(row.name, row.code),
              },
              select: { id: true },
            });
            subjectId = subject.id;
            await this.catalog.afterRename(
              tx,
              'SUBJECT',
              subjectId,
              null,
              undefined,
              row.code,
            );
            created += 1;
          }
          const value = placementValue(row);
          if (placements.has(subjectId)) updated += 1;
          else added += 1;
          await tx.studyPlanSubject.upsert({
            where: {
              studyPlanId_subjectId: { studyPlanId: planId, subjectId },
            },
            create: { studyPlanId: planId, subjectId, ...value },
            update: value,
          });
          applied.push({ subjectId, action: row.action, ...value });
        }
        await this.catalog.refreshDuration(tx, planId);
        await this.catalog.record(tx, actorId, 'CATALOG_BULK_APPLIED', {
          kind: 'CAREER',
          id: careerId,
          label: name,
          before: null,
          after: { created, added, updated },
          rows: applied,
        });
        return { created, added, updated };
      },
      // A whole carrera (up to 200 rows) is written in one go.
      { timeout: 60_000, maxWait: 10_000 },
    );
  }

  /** Refuses the whole batch, listing each bad row by its position. */
  private async validate(tx: Tx, facultyId: string, rows: BulkRowDto[]) {
    const errors: { index: number; message: string }[] = [];
    const reused = rows.flatMap((row) =>
      row.action === 'reuse' ? [row.subjectId!] : [],
    );
    const own = new Set(
      (
        await tx.subject.findMany({
          where: { id: { in: reused }, facultyId },
          select: { id: true },
        })
      ).map((s) => s.id),
    );
    const newCodes = rows.flatMap((row) =>
      row.action === 'new' ? [row.code!] : [],
    );
    const taken = new Set(
      (
        await tx.subject.findMany({
          where: {
            OR: newCodes.map((code) => ({
              code: { equals: code, mode: 'insensitive' as const },
            })),
          },
          select: { code: true },
        })
      ).map((s) => s.code!.toLowerCase()),
    );

    const subjects = new Set<string>();
    const codes = new Set<string>();
    rows.forEach((row, index) => {
      if (row.action === 'reuse') {
        if (!own.has(row.subjectId!)) {
          errors.push({ index, message: 'La materia no es de esta facultad.' });
        } else if (subjects.has(row.subjectId!)) {
          errors.push({ index, message: 'La materia está repetida.' });
        }
        subjects.add(row.subjectId!);
      } else {
        const code = row.code!.toLowerCase();
        if (taken.has(code) || codes.has(code)) {
          errors.push({
            index,
            message: `El código ${row.code} ya está en uso.`,
          });
        }
        codes.add(code);
      }
    });
    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'BULK_INVALID',
        errors,
        message: 'Hay filas inválidas: no se guardó nada.',
      });
    }
  }

  private async careerContext(db: Tx, careerId: string) {
    const career = await db.career.findUnique({
      where: { id: careerId },
      select: {
        name: true,
        facultyId: true,
        studyPlans: {
          select: {
            id: true,
            subjects: {
              select: {
                subjectId: true,
                year: true,
                semester: true,
                credits: true,
              },
            },
          },
        },
      },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    const plan = career.studyPlans[0];
    if (!plan) throw new NotFoundException('La carrera no tiene plan');
    return {
      name: career.name,
      facultyId: career.facultyId,
      planId: plan.id,
      placements: new Map(plan.subjects.map((p) => [p.subjectId, p])),
    };
  }
}

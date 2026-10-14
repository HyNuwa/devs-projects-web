import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import type { DeclaredCareerDto } from './dto/replace-study-plans.dto';

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});
const byName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

/**
 * Universidad → facultad → carrera (openspec academic-structure/institutions,
 * ADR 0002 and 0003). Read-only: the catalog is loaded by migration or seed.
 */
@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The whole public tree, sorted by name at every level in Spanish order. */
  async catalog() {
    const universities = await this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        faculties: {
          select: {
            id: true,
            name: true,
            shortName: true,
            careers: {
              where: { status: 'PUBLISHED' },
              select: {
                id: true,
                name: true,
                code: true,
                planUrl: true,
                studyPlans: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });

    return universities.sort(byName).map((university) => ({
      ...university,
      faculties: university.faculties.sort(byName).map((faculty) => ({
        ...faculty,
        careers: faculty.careers.sort(byName).map((career) => ({
          ...career,
          studyPlans: career.studyPlans.sort(byName),
        })),
      })),
    }));
  }

  /**
   * The student's declared carreras with their path. Private: only the owner
   * reads them (never the public profile). Plans stay internal (ADR 0003).
   */
  async declaredPlans(userId: string) {
    const rows = await this.prisma.userStudyPlan.findMany({
      where: { userId },
      select: {
        status: true,
        createdAt: true,
        studyPlan: {
          select: {
            career: {
              select: {
                id: true,
                name: true,
                code: true,
                faculty: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                    university: {
                      select: { id: true, name: true, shortName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const careers = rows.map(({ status, createdAt, studyPlan: { career } }) => {
      const { faculty, ...careerFields } = career;
      const { university, ...facultyFields } = faculty;
      return {
        careerId: career.id,
        status,
        // The first carrera declared as cursando is the default ubicación.
        declaredAt: createdAt,
        career: careerFields,
        faculty: facultyFields,
        university,
      };
    });
    return careers.sort(
      (a, b) =>
        collator.compare(a.university.name, b.university.name) ||
        collator.compare(a.faculty.name, b.faculty.name) ||
        collator.compare(a.career.name, b.career.name),
    );
  }

  /**
   * Replaces the whole list; nothing changes when any entry is invalid. Each
   * carrera resolves to its single internal plan, so a carrera without one is
   * unknown to the student.
   */
  async replaceDeclaredCareers(userId: string, careers: DeclaredCareerDto[]) {
    const ids = careers.map((career) => career.careerId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_CAREER',
        message: 'Esa carrera ya está en tu lista.',
      });
    }
    // Only published carreras are declarable (catalog-editing).
    const plans = await this.prisma.studyPlan.findMany({
      where: { careerId: { in: ids }, career: { status: 'PUBLISHED' } },
      select: { id: true, careerId: true },
    });
    const planOf = new Map(plans.map((plan) => [plan.careerId, plan.id]));
    if (ids.some((id) => !planOf.has(id))) {
      throw new BadRequestException({
        code: 'UNKNOWN_CAREER',
        message: 'Alguna de las carreras no existe.',
      });
    }

    try {
      // Kept entries keep their row, so the order of declaration survives a
      // status change; new ones are stamped in the order they were sent.
      await this.prisma.$transaction(async (tx) => {
        // Waits for a concurrent unpublish of these carreras, then re-checks.
        const published = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "careers"
          WHERE "id" = ANY(${ids}::uuid[]) AND "status" = 'PUBLISHED'
          FOR SHARE`;
        if (published.length !== ids.length) {
          throw new BadRequestException({
            code: 'UNKNOWN_CAREER',
            message: 'Alguna de las carreras no existe.',
          });
        }
        const planIds = careers.map((career) => planOf.get(career.careerId)!);
        await tx.userStudyPlan.deleteMany({
          where: { userId, studyPlanId: { notIn: planIds } },
        });
        const kept = new Set(
          (
            await tx.userStudyPlan.findMany({
              where: { userId },
              select: { studyPlanId: true },
            })
          ).map((row) => row.studyPlanId),
        );
        const now = Date.now();
        for (const [index, career] of careers.entries()) {
          const studyPlanId = planOf.get(career.careerId)!;
          if (kept.has(studyPlanId)) {
            await tx.userStudyPlan.update({
              where: { userId_studyPlanId: { userId, studyPlanId } },
              data: { status: career.status },
            });
          } else {
            await tx.userStudyPlan.create({
              data: {
                userId,
                studyPlanId,
                status: career.status,
                createdAt: new Date(now + index),
              },
            });
          }
        }
      });
    } catch (error) {
      // A concurrent save of the same list (double click, two tabs: a duplicate
      // row, or a row the other save removed) or a carrera deleted after the
      // check above: answer 4xx instead of a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' || error.code === 'P2025') {
          throw new ConflictException({
            code: 'STUDY_PLANS_CHANGED',
            message:
              'Tus carreras cambiaron mientras guardabas. Probá de nuevo.',
          });
        }
        if (error.code === 'P2003') {
          throw new BadRequestException({
            code: 'UNKNOWN_CAREER',
            message: 'Alguna de las carreras no existe.',
          });
        }
      }
      throw error;
    }
    return this.declaredPlans(userId);
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import type { DeclaredStudyPlanDto } from './dto/replace-study-plans.dto';

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});
const byName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

/**
 * Universidad → facultad → carrera → plan (openspec academic-structure/institutions,
 * ADR 0002). Read-only: universidades and facultades are loaded by migration or seed.
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
              select: {
                id: true,
                name: true,
                code: true,
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
   * The student's declared plans with their full path. Private: only the owner
   * reads them (never the public profile).
   */
  async declaredPlans(userId: string) {
    const rows = await this.prisma.userStudyPlan.findMany({
      where: { userId },
      select: {
        status: true,
        studyPlan: {
          select: {
            id: true,
            name: true,
            code: true,
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

    const plans = rows.map(({ status, studyPlan }) => {
      const { career, ...plan } = studyPlan;
      const { faculty, ...careerFields } = career;
      const { university, ...facultyFields } = faculty;
      return {
        studyPlanId: plan.id,
        status,
        studyPlan: plan,
        career: careerFields,
        faculty: facultyFields,
        university,
      };
    });
    return plans.sort(
      (a, b) =>
        collator.compare(a.university.name, b.university.name) ||
        collator.compare(a.faculty.name, b.faculty.name) ||
        collator.compare(a.career.name, b.career.name) ||
        collator.compare(a.studyPlan.name, b.studyPlan.name),
    );
  }

  /** Replaces the whole list; nothing changes when any entry is invalid. */
  async replaceDeclaredPlans(userId: string, plans: DeclaredStudyPlanDto[]) {
    const ids = plans.map((plan) => plan.studyPlanId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_STUDY_PLAN',
        message: 'Ese plan ya está en tu lista.',
      });
    }
    const known = await this.prisma.studyPlan.count({
      where: { id: { in: ids } },
    });
    if (known !== ids.length) {
      throw new BadRequestException({
        code: 'UNKNOWN_STUDY_PLAN',
        message: 'Alguno de los planes no existe.',
      });
    }

    try {
      await this.prisma.$transaction([
        this.prisma.userStudyPlan.deleteMany({ where: { userId } }),
        this.prisma.userStudyPlan.createMany({
          data: plans.map((plan) => ({
            userId,
            studyPlanId: plan.studyPlanId,
            status: plan.status,
          })),
        }),
      ]);
    } catch (error) {
      // A concurrent save of the same list (double click, two tabs) or a plan
      // deleted after the check above: answer 4xx instead of a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException({
            code: 'STUDY_PLANS_CHANGED',
            message: 'Tus planes cambiaron mientras guardabas. Probá de nuevo.',
          });
        }
        if (error.code === 'P2003') {
          throw new BadRequestException({
            code: 'UNKNOWN_STUDY_PLAN',
            message: 'Alguno de los planes no existe.',
          });
        }
      }
      throw error;
    }
    return this.declaredPlans(userId);
  }
}

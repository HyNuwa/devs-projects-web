import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  publicVisibility,
  publicVisibilitySql,
} from '../moderation/visibility';

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});
const byName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

/** Browsing segments are the lowercase short names and codes. */
const slug = (value: string) => value.toLowerCase();

const notFound = () =>
  new NotFoundException({
    code: 'CATALOG_NOT_FOUND',
    message: 'No encontramos esa página del catálogo.',
  });

/**
 * One level of universidad → facultad → carrera → materias for the browsing
 * pages (openspec academic-structure/browsing). Counts come from loaded data
 * only: publicly visible materials, never students.
 */
@Injectable()
export class CatalogBrowseService {
  constructor(private readonly prisma: PrismaService) {}

  async universities() {
    const [universities, materialsByFaculty] = await Promise.all([
      this.prisma.university.findMany({
        select: {
          id: true,
          name: true,
          shortName: true,
          faculties: { select: { id: true } },
        },
      }),
      this.materialsByFaculty(),
    ]);
    return universities.sort(byName).map(({ faculties, ...university }) => ({
      ...university,
      slug: slug(university.shortName),
      facultyCount: faculties.length,
      materialCount: faculties.reduce(
        (sum, faculty) => sum + (materialsByFaculty.get(faculty.id) ?? 0),
        0,
      ),
    }));
  }

  async university(uni: string) {
    const university = await this.findUniversity(uni);
    const [faculties, materialsByFaculty] = await Promise.all([
      this.prisma.faculty.findMany({
        where: { universityId: university.id },
        select: {
          id: true,
          name: true,
          shortName: true,
          _count: { select: { careers: true } },
        },
      }),
      this.materialsByFaculty(),
    ]);
    const cards = faculties.map(({ _count, ...faculty }) => ({
      ...faculty,
      slug: slug(faculty.shortName),
      careerCount: _count.careers,
      materialCount: materialsByFaculty.get(faculty.id) ?? 0,
    }));
    // Facultades with carreras first, then by name.
    cards.sort(
      (a, b) =>
        Number(b.careerCount > 0) - Number(a.careerCount > 0) || byName(a, b),
    );
    return { university: this.level(university), faculties: cards };
  }

  async faculty(uni: string, fac: string) {
    const university = await this.findUniversity(uni);
    const faculty = await this.findFaculty(university.id, fac);
    const careers = await this.prisma.career.findMany({
      where: { facultyId: faculty.id },
      select: {
        id: true,
        name: true,
        code: true,
        studyPlans: { select: { subjects: { select: { subjectId: true } } } },
      },
    });
    const materials = await this.materialsBySubject(
      careers.flatMap((career) =>
        career.studyPlans.flatMap((plan) =>
          plan.subjects.map((s) => s.subjectId),
        ),
      ),
    );
    return {
      university: this.level(university),
      faculty: this.level(faculty),
      careers: careers.sort(byName).map(({ studyPlans, ...career }) => {
        const subjectIds = studyPlans.flatMap((plan) =>
          plan.subjects.map((s) => s.subjectId),
        );
        return {
          ...career,
          slug: slug(career.code),
          subjectCount: subjectIds.length,
          materialCount: subjectIds.reduce(
            (sum, id) => sum + (materials.get(id) ?? 0),
            0,
          ),
        };
      }),
    };
  }

  async career(uni: string, fac: string, code: string) {
    const university = await this.findUniversity(uni);
    const faculty = await this.findFaculty(university.id, fac);
    const career = await this.prisma.career.findFirst({
      where: {
        facultyId: faculty.id,
        code: { equals: code, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        code: true,
        planUrl: true,
        // A single internal plan per carrera (ADR 0003).
        studyPlans: {
          select: {
            duration: true,
            subjects: {
              select: {
                year: true,
                semester: true,
                credits: true,
                subject: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!career) throw notFound();

    const { studyPlans, ...fields } = career;
    const plan = studyPlans[0];
    const placements = plan?.subjects ?? [];
    const materials = await this.materialsBySubject(
      placements.map((p) => p.subject.id),
    );
    const subjects = placements
      .map(({ subject, year, semester, credits }) => ({
        ...subject,
        year,
        semester,
        credits,
        materialCount: materials.get(subject.id) ?? 0,
      }))
      .sort(
        (a, b) => a.year - b.year || a.semester - b.semester || byName(a, b),
      );
    return {
      university: this.level(university),
      faculty: this.level(faculty),
      career: {
        ...fields,
        slug: slug(fields.code),
        years: plan?.duration ?? null,
        credits: placements.reduce((sum, p) => sum + (p.credits ?? 0), 0),
        subjectCount: subjects.length,
      },
      subjects,
    };
  }

  private level<T extends { shortName: string }>(row: T) {
    return { ...row, slug: slug(row.shortName) };
  }

  private async findUniversity(uni: string) {
    const university = await this.prisma.university.findFirst({
      where: { shortName: { equals: uni, mode: 'insensitive' } },
      select: { id: true, name: true, shortName: true },
    });
    if (!university) throw notFound();
    return university;
  }

  private async findFaculty(universityId: string, fac: string) {
    const faculty = await this.prisma.faculty.findFirst({
      where: { universityId, shortName: { equals: fac, mode: 'insensitive' } },
      select: { id: true, name: true, shortName: true },
    });
    if (!faculty) throw notFound();
    return faculty;
  }

  private async materialsByFaculty() {
    const rows = await this.prisma.$queryRaw<
      { faculty_id: string; count: bigint }[]
    >`SELECT s."faculty_id", count(*) AS "count"
      FROM "materials" m JOIN "subjects" s ON s."id" = m."subject_id"
      WHERE ${publicVisibilitySql(new Date())} AND m."is_deleted" = false
      GROUP BY s."faculty_id"`;
    return new Map(rows.map((row) => [row.faculty_id, Number(row.count)]));
  }

  private async materialsBySubject(subjectIds: string[]) {
    if (subjectIds.length === 0) return new Map<string, number>();
    const rows = await this.prisma.material.groupBy({
      by: ['subjectId'],
      // Counted as the materia page lists them (openspec moderation visibility).
      where: {
        ...publicVisibility(new Date()),
        isDeleted: false,
        subjectId: { in: [...new Set(subjectIds)] },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.subjectId, row._count._all]));
  }
}

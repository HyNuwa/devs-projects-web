import type { Prisma } from '../../generated/prisma';

/** A facultad with its universidad, shown wherever a carrera or materia is (ADR 0002). */
export const facultySelect = {
  id: true,
  name: true,
  shortName: true,
  university: { select: { id: true, name: true, shortName: true } },
} satisfies Prisma.FacultySelect;

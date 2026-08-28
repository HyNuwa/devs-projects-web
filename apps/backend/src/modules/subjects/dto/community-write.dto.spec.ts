import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  Shift,
} from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import { CreateCourseReviewDto } from './create-course-review.dto';
import { CreateExamExperienceDto } from './create-exam-experience.dto';

const narrative =
  'La experiencia tuvo suficiente contexto sobre la cursada y la evaluación.';
const professorId = '30000000-0000-4000-8000-000000000001';

const validReview = {
  academicYear: 2026,
  condition: CourseCondition.REGULAR,
  attempt: CourseAttempt.PRIMERA_CURSADA,
  recommendation: 4,
  comment: narrative,
};

const validExam = {
  year: 2026,
  session: ExamSession.JULIO,
  format: ExamFormat.ORAL,
  comment: narrative,
};

async function reviewErrors(overrides: Record<string, unknown> = {}) {
  return validate(
    plainToInstance(CreateCourseReviewDto, { ...validReview, ...overrides }),
  );
}

async function examErrors(overrides: Record<string, unknown> = {}) {
  return validate(
    plainToInstance(CreateExamExperienceDto, { ...validExam, ...overrides }),
  );
}

function properties(errors: Awaited<ReturnType<typeof validate>>) {
  return errors.map(({ property }) => property);
}

describe('CreateCourseReviewDto', () => {
  it.each([
    CourseCondition.PROMO,
    CourseCondition.REGULAR,
    CourseCondition.LIBRE,
  ])('acepta la condición %s', async (condition) => {
    await expect(reviewErrors({ condition })).resolves.toHaveLength(0);
  });

  it.each(Object.values(CourseAttempt))(
    'acepta la situación %s',
    async (attempt) => {
      await expect(reviewErrors({ attempt })).resolves.toHaveLength(0);
    },
  );

  it.each(Object.values(Shift))('acepta la franja %s', async (shift) => {
    await expect(reviewErrors({ shift })).resolves.toHaveLength(0);
  });

  it.each(Object.values(CommunityDifficulty))(
    'acepta la dificultad %s',
    async (difficulty) => {
      await expect(reviewErrors({ difficulty })).resolves.toHaveLength(0);
    },
  );

  it('acepta profesor registrado o fallback manual por separado', async () => {
    await expect(reviewErrors({ professorId })).resolves.toHaveLength(0);
    await expect(
      reviewErrors({ professorName: 'Ing. Laura Quiroga' }),
    ).resolves.toHaveLength(0);
  });

  it('rechaza campos obligatorios ausentes y la condición legacy', async () => {
    const missing = await reviewErrors({
      academicYear: undefined,
      condition: undefined,
      attempt: undefined,
      recommendation: undefined,
      comment: undefined,
    });
    expect(properties(missing)).toEqual(
      expect.arrayContaining([
        'academicYear',
        'condition',
        'attempt',
        'recommendation',
        'comment',
      ]),
    );

    expect(
      properties(
        await reviewErrors({
          condition: CourseCondition.PREFIERO_NO_RESPONDER,
        }),
      ),
    ).toContain('condition');
  });

  it('rechaza límites inválidos de año, estrellas y narrativa', async () => {
    for (const [field, value] of [
      ['academicYear', MIN_ACADEMIC_YEAR - 1],
      ['academicYear', MAX_ACADEMIC_YEAR + 1],
      ['recommendation', 0],
      ['recommendation', 6],
      ['comment', 'x'.repeat(29)],
      ['comment', 'x'.repeat(4001)],
    ] as const) {
      expect(properties(await reviewErrors({ [field]: value }))).toContain(
        field,
      );
    }
  });

  it('rechaza enums, referencias y fallback manual inválidos', async () => {
    expect(properties(await reviewErrors({ attempt: 'TERCERA' }))).toContain(
      'attempt',
    );
    expect(properties(await reviewErrors({ shift: 'MEDIODIA' }))).toContain(
      'shift',
    );
    expect(
      properties(await reviewErrors({ difficulty: 'IMPOSIBLE' })),
    ).toContain('difficulty');
    expect(properties(await reviewErrors({ professorId: 'prof-1' }))).toContain(
      'professorId',
    );
    expect(properties(await reviewErrors({ professorName: 'A' }))).toContain(
      'professorName',
    );
    expect(
      properties(
        await reviewErrors({
          professorId,
          professorName: 'Ing. Laura Quiroga',
        }),
      ),
    ).toContain('professorId');
  });
});

describe('CreateExamExperienceDto', () => {
  it.each(Object.values(ExamSession))('acepta la mesa %s', async (session) => {
    await expect(examErrors({ session })).resolves.toHaveLength(0);
  });

  it.each(Object.values(ExamFormat))('acepta el formato %s', async (format) => {
    await expect(examErrors({ format })).resolves.toHaveLength(0);
  });

  it.each(Object.values(Shift))('acepta la franja %s', async (shift) => {
    await expect(examErrors({ shift })).resolves.toHaveLength(0);
  });

  it.each(Object.values(CommunityDifficulty))(
    'acepta la dificultad %s',
    async (difficulty) => {
      await expect(examErrors({ difficulty })).resolves.toHaveLength(0);
    },
  );

  it.each(Object.values(ExamOutcome))(
    'acepta el resultado %s sin nota',
    async (outcome) => {
      await expect(examErrors({ outcome })).resolves.toHaveLength(0);
    },
  );

  it('acepta fechas, anonimato y notas límite con resultado explícito', async () => {
    await expect(
      examErrors({
        examDate: '2026-07-15',
        isAnonymous: true,
        outcome: ExamOutcome.DESAPROBADO,
        grade: 0,
      }),
    ).resolves.toHaveLength(0);
    await expect(
      examErrors({ outcome: ExamOutcome.APROBADO, grade: 10 }),
    ).resolves.toHaveLength(0);
  });

  it('acepta profesor registrado o fallback manual por separado', async () => {
    await expect(examErrors({ professorId })).resolves.toHaveLength(0);
    await expect(
      examErrors({ examinerName: 'Ing. Laura Quiroga' }),
    ).resolves.toHaveLength(0);
  });

  it('rechaza obligatorios ausentes, límites y enums inválidos', async () => {
    const missing = await examErrors({
      year: undefined,
      session: undefined,
      format: undefined,
      comment: undefined,
    });
    expect(properties(missing)).toEqual(
      expect.arrayContaining(['year', 'session', 'format', 'comment']),
    );

    for (const [field, value] of [
      ['year', MIN_ACADEMIC_YEAR - 1],
      ['year', MAX_ACADEMIC_YEAR + 1],
      ['comment', 'x'.repeat(29)],
      ['comment', 'x'.repeat(4001)],
      ['session', 'AGOSTO'],
      ['format', 'PRACTICO'],
      ['shift', 'MEDIODIA'],
      ['difficulty', 'IMPOSIBLE'],
      ['outcome', 'AUSENTE'],
    ] as const) {
      expect(properties(await examErrors({ [field]: value }))).toContain(field);
    }
  });

  it('rechaza notas fuera de rango o sin resultado publicable', async () => {
    expect(properties(await examErrors({ grade: -1 }))).toContain('grade');
    expect(properties(await examErrors({ grade: 11 }))).toContain('grade');
    expect(properties(await examErrors({ grade: 7 }))).toContain('grade');
    expect(
      properties(
        await examErrors({
          outcome: ExamOutcome.PREFIERO_NO_DECIR,
          grade: 7,
        }),
      ),
    ).toContain('grade');
  });

  it('rechaza fecha, referencia o fallback manual inválidos', async () => {
    expect(properties(await examErrors({ examDate: 'no-es-fecha' }))).toContain(
      'examDate',
    );
    expect(properties(await examErrors({ professorId: 'prof-1' }))).toContain(
      'professorId',
    );
    expect(properties(await examErrors({ examinerName: 'A' }))).toContain(
      'examinerName',
    );
    expect(
      properties(
        await examErrors({
          professorId,
          examinerName: 'Ing. Laura Quiroga',
        }),
      ),
    ).toContain('professorId');
  });
});

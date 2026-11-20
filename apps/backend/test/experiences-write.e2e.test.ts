import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const COMMENT =
  'La mesa tomó integrales dobles y pidió justificar cada paso del desarrollo.';

const validExam = {
  year: 2025,
  session: 'DICIEMBRE',
  format: 'ESCRITO',
  outcome: 'APROBADO',
  grade: 7,
  comment: COMMENT,
};

/**
 * The write contract of experiencias de final and reseñas de cursada
 * (openspec academic-community/discovery, change experiencias-formularios).
 */
describe('experiencia write API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let code: string;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    code = `E2E${randomUUID().slice(0, 6)}`;
    ({ id: subjectId } = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia ${code}`, code },
      select: { id: true },
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  // Community writes are rate limited per account, so each probe uses its own author.
  function postExam(body: Record<string, unknown>) {
    return {
      expect: async (status: number) => {
        const author = await createUser(prisma);
        return request(app.getHttpServer())
          .post(`/api/v1/subjects/${code}/exams`)
          .set('Authorization', bearer(app, author))
          .send(body)
          .expect(status);
      },
    };
  }

  async function legacyExam(author: E2eUser) {
    return prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId,
        year: 2023,
        session: 'JULIO',
        format: 'ORAL',
        examDate: new Date('2023-07-12'),
        shift: 'TARDE',
        difficulty: 'ALTA',
        comment: COMMENT,
      },
      select: { id: true },
    });
  }

  function putExam(author: E2eUser, id: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .put(`/api/v1/subjects/exams/${id}`)
      .set('Authorization', bearer(app, author))
      .send(body);
  }

  describe('experiencia de final', () => {
    it('rejects a new final without an outcome', async () => {
      const { outcome: _omit, grade: _grade, ...withoutOutcome } = validExam;

      const { body } = await postExam(withoutOutcome).expect(400);

      expect(JSON.stringify(body)).toContain('outcome');
    });

    it.each(['APROBADO', 'DESAPROBADO'])(
      'rejects %s without a grade',
      async (outcome) => {
        await postExam({ ...validExam, outcome, grade: undefined }).expect(400);
      },
    );

    it('rejects a grade with Prefiero no decir', async () => {
      await postExam({
        ...validExam,
        outcome: 'PREFIERO_NO_DECIR',
        grade: 7,
      }).expect(400);
    });

    it('accepts Prefiero no decir without a grade and explicit grades 0 and 10', async () => {
      const silent = await postExam({
        ...validExam,
        outcome: 'PREFIERO_NO_DECIR',
        grade: undefined,
      }).expect(201);
      const failed = await postExam({
        ...validExam,
        outcome: 'DESAPROBADO',
        grade: 0,
      }).expect(201);
      const passed = await postExam({ ...validExam, grade: 10 }).expect(201);

      expect(silent.body.exam).toMatchObject({
        outcome: 'PREFIERO_NO_DECIR',
        grade: null,
      });
      expect(failed.body.exam).toMatchObject({
        outcome: 'DESAPROBADO',
        grade: 0,
      });
      expect(passed.body.exam).toMatchObject({
        outcome: 'APROBADO',
        grade: 10,
      });
    });

    it.each([
      ['difficultyTheory', 1, 5, [0, 6]],
      ['difficultyPractice', 1, 5, [0, 6]],
      ['boardSize', 1, 10, [0, 11]],
      ['durationMinutes', 10, 480, [9, 481]],
      ['prepLeadDays', 1, 365, [0, 366]],
      ['prepDailyMinutes', 30, 960, [0, 990, 45]],
    ] as const)(
      'stores %s at its limits %i and %i and refuses the values outside',
      async (field, min, max, outside) => {
        const atMin = await postExam({ ...validExam, [field]: min }).expect(
          201,
        );
        const atMax = await postExam({ ...validExam, [field]: max }).expect(
          201,
        );
        expect(atMin.body.exam[field]).toBe(min);
        expect(atMax.body.exam[field]).toBe(max);

        for (const value of [...outside, 2.5]) {
          const { body } = await postExam({
            ...validExam,
            [field]: value,
          }).expect(400);
          expect(JSON.stringify(body)).toContain(field);
        }
      },
    );

    it('stores the new facts and leaves undeclared ones empty', async () => {
      const declared = await postExam({
        ...validExam,
        difficultyTheory: 4,
        difficultyPractice: 3,
        boardSize: 3,
        durationMinutes: 180,
        prepLeadDays: 21,
        prepDailyMinutes: 60,
      }).expect(201);
      const bare = await postExam(validExam).expect(201);

      expect(declared.body.exam).toMatchObject({
        difficultyTheory: 4,
        difficultyPractice: 3,
        boardSize: 3,
        durationMinutes: 180,
        prepLeadDays: 21,
        prepDailyMinutes: 60,
        topics: [],
      });
      expect(bare.body.exam).toMatchObject({
        difficultyTheory: null,
        difficultyPractice: null,
        boardSize: null,
        durationMinutes: null,
        prepLeadDays: null,
        prepDailyMinutes: null,
        topics: [],
      });
    });

    it('trims, collapses and dedupes topics case-insensitively keeping the first spelling', async () => {
      const { body } = await postExam({
        ...validExam,
        topics: [
          '  Integrales   dobles ',
          'integrales dobles',
          'Teorema de Green',
          'INTEGRALES\tDOBLES',
        ],
      }).expect(201);

      expect(body.exam.topics).toEqual([
        'Integrales dobles',
        'Teorema de Green',
      ]);
    });

    it('accepts ten topics, also when eleven entries dedupe to ten', async () => {
      const ten = Array.from({ length: 10 }, (_, i) => `Tema ${i + 1}`);

      await postExam({ ...validExam, topics: ten }).expect(201);
      const { body } = await postExam({
        ...validExam,
        topics: [...ten, 'tema 1'],
      }).expect(201);

      expect(body.exam.topics).toEqual(ten);
    });

    it('accepts topics of 2 and 60 characters', async () => {
      const { body } = await postExam({
        ...validExam,
        topics: ['TP', 'x'.repeat(60)],
      }).expect(201);

      expect(body.exam.topics).toEqual(['TP', 'x'.repeat(60)]);
    });

    it.each([
      ['eleven topics', Array.from({ length: 11 }, (_, i) => `Tema ${i + 1}`)],
      ['a one-character topic', ['Integrales dobles', ' a ']],
      ['a blank topic', ['Integrales dobles', '   ']],
      ['a topic over 60 characters', ['x'.repeat(61)]],
      ['a topic that is not text', ['Integrales dobles', 5]],
      ['topics that are not a list', 'Integrales dobles'],
    ])('rejects %s', async (_case, topics) => {
      const { body } = await postExam({ ...validExam, topics }).expect(400);

      expect(JSON.stringify(body)).toContain('topics');
    });

    it.each([
      ['examDate', '2025-12-10'],
      ['shift', 'TARDE'],
      ['difficulty', 'MEDIA'],
    ])('rejects the legacy field %s', async (field, value) => {
      const { body } = await postExam({
        ...validExam,
        [field]: value,
      }).expect(400);

      expect(JSON.stringify(body)).toContain(field);
    });

    it('applies the same contract when editing', async () => {
      const author = await createUser(prisma);
      const { id } = await legacyExam(author);
      const { outcome: _omit, grade: _grade, ...withoutOutcome } = validExam;

      await putExam(author, id, withoutOutcome).expect(400);
      await putExam(author, id, { ...validExam, grade: undefined }).expect(400);
      await putExam(author, id, { ...validExam, shift: 'TARDE' }).expect(400);
      await putExam(author, id, {
        ...validExam,
        topics: Array.from({ length: 11 }, (_, i) => `Tema ${i + 1}`),
      }).expect(400);
    });

    it('keeps the date, franja and verbal difficulty of a legacy final on update', async () => {
      const author = await createUser(prisma);
      const { id } = await legacyExam(author);

      const { body } = await putExam(author, id, {
        ...validExam,
        difficultyTheory: 4,
        boardSize: 3,
        topics: ['Series de Fourier'],
      }).expect(200);

      expect(body).toMatchObject({
        examDate: '2023-07-12T00:00:00.000Z',
        shift: 'TARDE',
        difficulty: 'ALTA',
        outcome: 'APROBADO',
        grade: 7,
        difficultyTheory: 4,
        boardSize: 3,
        topics: ['Series de Fourier'],
      });
    });

    it('clears the grade and the facts an edit no longer declares', async () => {
      const author = await createUser(prisma);
      const { id } = await legacyExam(author);
      await putExam(author, id, {
        ...validExam,
        boardSize: 3,
        prepLeadDays: 21,
        topics: ['Series de Fourier'],
      }).expect(200);

      const { body } = await putExam(author, id, {
        ...validExam,
        outcome: 'PREFIERO_NO_DECIR',
        grade: undefined,
      }).expect(200);

      expect(body).toMatchObject({
        outcome: 'PREFIERO_NO_DECIR',
        grade: null,
        boardSize: null,
        prepLeadDays: null,
        topics: [],
        examDate: '2023-07-12T00:00:00.000Z',
      });
    });
  });

  describe('reseña de cursada', () => {
    const validReview = {
      academicYear: 2025,
      condition: 'PROMO',
      attempt: 'PRIMERA_CURSADA',
      recommendation: 4,
      comment: COMMENT,
    };

    function postReview(author: E2eUser, body: Record<string, unknown>) {
      return request(app.getHttpServer())
        .post(`/api/v1/subjects/${code}/reviews`)
        .set('Authorization', bearer(app, author))
        .send({ ...validReview, ...body });
    }

    function putReview(
      author: E2eUser,
      id: string,
      body: Record<string, unknown>,
    ) {
      return request(app.getHttpServer())
        .put(`/api/v1/subjects/reviews/${id}`)
        .set('Authorization', bearer(app, author))
        .send({ ...validReview, ...body });
    }

    it.each([1, 10])(
      'stores a nota de promoción of %i with Promoción',
      async (promotionGrade) => {
        const author = await createUser(prisma);

        const { body } = await postReview(author, { promotionGrade }).expect(
          201,
        );

        expect(body.review).toMatchObject({
          condition: 'PROMO',
          promotionGrade,
        });
      },
    );

    it('leaves the nota de promoción empty when it is not declared', async () => {
      const author = await createUser(prisma);

      const { body } = await postReview(author, {}).expect(201);

      expect(body.review.promotionGrade).toBeNull();
    });

    it.each([
      ['REGULAR', 8],
      ['LIBRE', 8],
      ['PROMO', 0],
      ['PROMO', 11],
      ['PROMO', 7.5],
    ])(
      'rejects the resultado %s with a nota de promoción of %d',
      async (condition, promotionGrade) => {
        const author = await createUser(prisma);

        const { body } = await postReview(author, {
          condition,
          promotionGrade,
        }).expect(400);

        expect(JSON.stringify(body)).toMatch(/promotionGrade|promoción/);
      },
    );

    it('rejects a nota de promoción when an edit leaves Promoción', async () => {
      const author = await createUser(prisma);
      const { body } = await postReview(author, { promotionGrade: 8 }).expect(
        201,
      );

      await putReview(author, body.review.id, {
        condition: 'REGULAR',
        promotionGrade: 8,
      }).expect(400);
    });

    it('lets an update change and clear the nota de promoción', async () => {
      const author = await createUser(prisma);
      const { body: created } = await postReview(author, {
        promotionGrade: 8,
      }).expect(201);
      const id = created.review.id;

      const changed = await putReview(author, id, { promotionGrade: 9 }).expect(
        200,
      );
      const cleared = await putReview(author, id, {}).expect(200);
      await putReview(author, id, { promotionGrade: 6 }).expect(200);
      const regular = await putReview(author, id, {
        condition: 'REGULAR',
      }).expect(200);

      expect(changed.body.promotionGrade).toBe(9);
      expect(cleared.body.promotionGrade).toBeNull();
      expect(regular.body).toMatchObject({
        condition: 'REGULAR',
        promotionGrade: null,
      });
    });
  });
});

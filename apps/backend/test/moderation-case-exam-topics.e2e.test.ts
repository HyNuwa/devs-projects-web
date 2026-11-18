import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/**
 * A moderator judging a caso about an experiencia de final reads all of its
 * public free text, the temas que tomaron included (openspec moderation/cases),
 * and so does one answering an appeal of its retiro (moderation/appeals).
 */
describe('caso and appeal detail of an experiencia de final (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  async function examCase(topics: string[], author?: E2eUser) {
    author ??= await createUser(prisma);
    const exam = await prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId,
        year: 2025,
        session: 'DICIEMBRE',
        format: 'ESCRITO',
        outcome: 'APROBADO',
        grade: 7,
        topics,
        comment: 'Final e2e con temas para moderar.',
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'EXAM_EXPERIENCE',
        examExperienceId: exam.id,
        targetAuthorId: author.id,
      },
    });
  }

  const detail = (caseId: string) =>
    request(app.getHttpServer())
      .get(`/api/v1/moderation/cases/${caseId}`)
      .set('Authorization', bearer(app, moderator))
      .expect(200);

  it('carries the temas of the final beside its comment', async () => {
    const caso = await examCase(['Series de Fourier', 'Truco del profe']);

    const { body } = await detail(caso.id);

    expect(body.target).toMatchObject({
      type: 'EXAM_EXPERIENCE',
      comment: 'Final e2e con temas para moderar.',
      topics: ['Series de Fourier', 'Truco del profe'],
    });
  });

  it('carries an empty list for a final without temas', async () => {
    const caso = await examCase([]);

    const { body } = await detail(caso.id);

    expect(body.target.topics).toEqual([]);
  });

  it('carries the temas of a retired final in its appeal', async () => {
    const author = await createUser(prisma);
    const decider = await createUser(prisma, 'MODERATOR');
    const caso = await examCase(['Series de Fourier'], author);
    const appeal = await prisma.appeal.create({
      data: {
        appellantId: author.id,
        kind: 'RETIRO',
        caseId: caso.id,
        decidedById: decider.id,
        explanation: 'El tema no nombra a nadie.',
      },
    });

    const { body } = await request(app.getHttpServer())
      .get(`/api/v1/moderation/appeals/${appeal.id}`)
      .set('Authorization', bearer(app, moderator))
      .expect(200);

    expect(body.content).toMatchObject({
      caseId: caso.id,
      comment: 'Final e2e con temas para moderar.',
      topics: ['Series de Fourier'],
    });
  });
});

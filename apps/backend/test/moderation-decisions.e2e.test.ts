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

describe('POST /moderation/cases/:id/decision with «Advertir también» (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let author: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    author = await createUser(prisma);
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  /** A published material by `author` with an open reports caso. */
  async function reportedMaterial() {
    const material = await prisma.material.create({
      data: {
        title: 'Resumen e2e',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
      },
    });
    const moderationCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
      },
    });
    return { material, moderationCase };
  }

  it('retires the material and warns its author, linked to the caso', async () => {
    const { material, moderationCase } = await reportedMaterial();

    await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${moderationCase.id}/decision`)
      .set('Authorization', bearer(app, moderator))
      .send({
        decision: 'REMOVE',
        reason: 'Copia de otro material.',
        warn: true,
      })
      .expect(201);

    const retired = await prisma.material.findUniqueOrThrow({
      where: { id: material.id },
    });
    expect(retired.publicationStatus).toBe('REMOVED');
    const warnings = await prisma.sanction.findMany({
      where: { userId: author.id, caseId: moderationCase.id },
    });
    expect(warnings).toEqual([
      expect.objectContaining({
        type: 'WARNING',
        reason: 'Copia de otro material.',
        appliedById: moderator.id,
      }),
    ]);
    const events = await prisma.moderationEvent.findMany({
      where: { caseId: moderationCase.id },
      select: { action: true },
    });
    expect(events.map((event) => event.action).sort()).toEqual([
      'REMOVED',
      'WARNED',
    ]);
  });

  it('retires without warning when «Advertir también» is unchecked', async () => {
    const { moderationCase } = await reportedMaterial();

    await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${moderationCase.id}/decision`)
      .set('Authorization', bearer(app, moderator))
      .send({ decision: 'REMOVE', reason: 'Fuera de tema.', warn: false })
      .expect(201);

    expect(
      await prisma.sanction.count({ where: { caseId: moderationCase.id } }),
    ).toBe(0);
  });
});

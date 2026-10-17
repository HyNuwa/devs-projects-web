import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { MaterialResourceType } from '../src/generated/prisma';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** The first material of a type in a materia earns a bonus (openspec reputation/points). */
describe('pioneer bonus (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  async function material(
    author: E2eUser,
    subjectId: string,
    resourceType: MaterialResourceType = 'FINAL',
  ) {
    return prisma.material.create({
      data: {
        title: `Final ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType,
      },
      select: { id: true },
    });
  }

  const mark = (giver: E2eUser, materialId: string) =>
    request(app.getHttpServer())
      .put(`/api/v1/materials/${materialId}/helpfulness`)
      .set('Authorization', bearer(app, giver))
      .send({ isHelpful: true })
      .expect(200);

  async function markThrice(materialId: string) {
    for (let i = 0; i < 3; i += 1)
      await mark(await createUser(prisma), materialId);
  }

  async function bonus(author: E2eUser) {
    const rows = await prisma.pointTransaction.findMany({
      where: { userId: author.id, reason: 'MATERIAL_PIONEER' },
      select: { amount: true, referenceId: true },
    });
    return {
      net: rows.reduce((sum, row) => sum + row.amount, 0),
      references: rows.map((row) => row.referenceId),
    };
  }

  it('awards 5 once when the first final of a materia gets its third valid «Me sirvió»', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id } = await material(author, subjectId);

    await mark(await createUser(prisma), id);
    await mark(await createUser(prisma), id);
    expect((await bonus(author)).net).toBe(0);

    await mark(await createUser(prisma), id);
    await mark(await createUser(prisma), id);
    expect(await bonus(author)).toEqual({
      net: 5,
      references: [`${subjectId}:FINAL:${id}`],
    });
  });

  it('does not count marks that are not valid', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id } = await material(author, subjectId);
    await mark(await createUser(prisma), id);
    await mark(await createUser(prisma), id);
    await mark(await createUser(prisma, 'USER', { emailVerified: false }), id);

    expect((await bonus(author)).net).toBe(0);
  });

  it('gives nothing to a later material of the same type, nor to type OTRO', async () => {
    const pioneer = await createUser(prisma);
    const later = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await material(pioneer, subjectId);
    const second = await material(later, subjectId);
    const other = await material(later, subjectId, 'OTRO');

    await markThrice(second.id);
    await markThrice(other.id);

    expect((await bonus(later)).net).toBe(0);
  });

  it('reverts the bonus when the pioneer is retired, without passing it on', async () => {
    const pioneer = await createUser(prisma);
    const later = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const first = await material(pioneer, subjectId);
    const second = await material(later, subjectId);
    await markThrice(first.id);
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: first.id,
        targetAuthorId: pioneer.id,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${caso.id}/decision`)
      .set('Authorization', bearer(app, admin))
      .send({ decision: 'REMOVE', reason: 'Datos personales de un docente.' })
      .expect(201);
    await markThrice(second.id);

    expect((await bonus(pioneer)).net).toBe(0);
    expect((await bonus(later)).net).toBe(0);
  });

  it('evaluates the bonus again when the materia of a published material changes', async () => {
    const author = await createUser(prisma);
    const { id: firstSubject } = await createSubject(prisma);
    const { id: secondSubject } = await createSubject(prisma);
    const { id } = await material(author, firstSubject);
    await markThrice(id);

    await request(app.getHttpServer())
      .patch(`/api/v1/materials/${id}`)
      .set('Authorization', bearer(app, author))
      .send({ subjectId: secondSubject })
      .expect(200);

    expect(await bonus(author)).toEqual({
      net: 5,
      references: [
        `${firstSubject}:FINAL:${id}`,
        `${firstSubject}:FINAL:${id}`,
        `${secondSubject}:FINAL:${id}`,
      ],
    });
  });

  it('keeps the bonus with the material that earned it when an older one is approved later', async () => {
    const early = await createUser(prisma);
    const holder = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    // Uploaded first, but waiting in revisión previa.
    const older = await prisma.material.create({
      data: {
        title: 'Final en revisión previa',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: early.id,
        subjectId,
        resourceType: 'FINAL',
        publicationStatus: 'PENDING_REVIEW',
        createdAt: new Date(Date.now() - 86_400_000),
      },
    });
    const pioneer = await material(holder, subjectId);
    await markThrice(pioneer.id);
    expect((await bonus(holder)).net).toBe(5);

    await prisma.material.update({
      where: { id: older.id },
      data: { publicationStatus: 'PUBLISHED' },
    });
    await markThrice(older.id);
    expect((await bonus(early)).net).toBe(0);

    // Retiring the older one leaves the holder's bonus alone…
    await request(app.getHttpServer())
      .delete(`/api/v1/materials/${older.id}`)
      .set('Authorization', bearer(app, early))
      .expect(200);
    expect((await bonus(holder)).net).toBe(5);

    // …and retiring the holder's material takes it away.
    await request(app.getHttpServer())
      .delete(`/api/v1/materials/${pioneer.id}`)
      .set('Authorization', bearer(app, holder))
      .expect(200);
    expect((await bonus(holder)).net).toBe(0);
  });
});

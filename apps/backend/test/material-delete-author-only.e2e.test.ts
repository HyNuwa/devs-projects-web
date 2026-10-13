import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Role } from '../src/generated/prisma';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/**
 * Only the author deletes a material directly. Staff take content down with a
 * retiro, which follows the alcance de moderación and stays in the history
 * (openspec moderation/scope).
 */
describe('DELETE /materials/:id is for the author only (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  let subjectId: string;
  let author: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: subjectId } = await createSubject(prisma));
    author = await createUser(prisma);
  });

  afterAll(async () => {
    await prisma.material.deleteMany({ where: { subjectId } });
    await prisma.subject.delete({ where: { id: subjectId } });
    await app.close();
  });

  const material = async () =>
    (
      await prisma.material.create({
        data: {
          title: 'Parcial para borrar',
          fileUrl: 'https://drive.example.com/delete',
          fileType: 'pdf',
          fileSize: 10,
          authorId: author.id,
          subjectId,
          resourceType: 'PARCIAL',
        },
        select: { id: true },
      })
    ).id;
  const isDeleted = async (id: string) =>
    (
      await prisma.material.findUniqueOrThrow({
        where: { id },
        select: { isDeleted: true },
      })
    ).isDeleted;

  it.each<Role>(['MODERATOR', 'ADMIN', 'SUPERADMIN'])(
    'refuses a %s deleting someone else’s material',
    async (role) => {
      const id = await material();
      const staff = await createUser(prisma, role);
      await http()
        .delete(`/api/v1/materials/${id}`)
        .set('Authorization', bearer(app, staff))
        .expect(403);
      expect(await isDeleted(id)).toBe(false);
    },
  );

  it('lets the author delete their own material', async () => {
    const id = await material();
    await http()
      .delete(`/api/v1/materials/${id}`)
      .set('Authorization', bearer(app, author))
      .expect(200);
    expect(await isDeleted(id)).toBe(true);
  });
});

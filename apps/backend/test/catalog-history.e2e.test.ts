import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

type Item = {
  action: string;
  actor: { username: string | null };
  catalog: { kind: string; id: string; before: unknown; after: unknown } | null;
};

/** Catálogo history (openspec academic-structure/catalog-editing). */
describe('Catálogo: history (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let moderator: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  let facultyId: string;

  const history = async (user: E2eUser, query: Record<string, string> = {}) =>
    (
      await http()
        .get('/api/v1/moderation/history')
        .query(query)
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body.items as Item[];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    moderator = await createUser(prisma, 'MODERATOR');
    const auth = { Authorization: bearer(app, admin) };
    const university = await http()
      .post('/api/v1/admin/catalog/universities')
      .set(auth)
      .send({ name: `Historial ${tag}`, shortName: `uh${tag}` })
      .expect(201);
    facultyId = (
      await http()
        .post('/api/v1/admin/catalog/faculties')
        .set(auth)
        .send({
          universityId: university.body.id,
          name: 'Exactas',
          shortName: 'FCEx',
        })
        .expect(201)
    ).body.id;
    await http()
      .patch(`/api/v1/admin/catalog/faculties/${facultyId}`)
      .set(auth)
      .send({ shortName: 'FCE' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('shows catálogo events to admins with before and after', async () => {
    const items = await history(admin, {
      action: 'CATALOG_UPDATED',
      actorId: admin.id,
    });
    expect(items[0]).toMatchObject({
      action: 'CATALOG_UPDATED',
      catalog: {
        kind: 'FACULTY',
        id: facultyId,
        before: { shortName: 'FCEx' },
        after: { shortName: 'FCE' },
      },
    });
    expect(items[0].actor.username).toBeTruthy();
  });

  it('never shows them to a moderator', async () => {
    expect(await history(moderator, { action: 'CATALOG_UPDATED' })).toEqual([]);
    const all = await history(moderator, { actorId: admin.id });
    expect(all.filter((item) => item.catalog !== null)).toEqual([]);
    expect(all.filter((item) => item.action.startsWith('CATALOG_'))).toEqual(
      [],
    );
  });
});

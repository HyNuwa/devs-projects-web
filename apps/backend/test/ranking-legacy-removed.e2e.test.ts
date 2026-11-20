import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createE2eApp, createUser } from './support/e2e-app';

/** The global and weekly rankings by total points no longer exist (openspec reputation/rankings). */
describe('legacy ranking routes (e2e)', () => {
  let app: NestExpressApplication;
  let auth: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const created = await createE2eApp();
    app = created.app;
    auth = bearer(app, await createUser(created.prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    '/api/v1/ranking',
    '/api/v1/ranking?period=weekly',
    '/api/v1/ranking?period=global',
    '/api/v1/ranking/top',
    '/api/v1/ranking/me',
  ])('%s answers 404', async (path) => {
    await http().get(path).set('Authorization', auth).expect(404);
  });

  it('keeps the levels table', async () => {
    const { body } = await http().get('/api/v1/ranking/levels').expect(200);
    expect(body).toHaveLength(10);
    expect(body[0]).toEqual({
      level: 1,
      name: expect.any(String),
      points: 0,
    });
  });
});

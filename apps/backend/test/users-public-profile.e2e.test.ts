import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const PUBLIC_FIELDS = [
  'avatarUrl',
  'bio',
  'createdAt',
  'displayName',
  'id',
  'level',
  'points',
  'username',
];

// Another account's profile shows only what is public: no email, no sanción
// state, no activity timestamps.
describe('public profile of another account (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let viewer: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    viewer = await createUser(prisma, 'MODERATOR');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns only the public fields of another account', async () => {
    const other = await createUser(prisma, 'USER', {
      isMuted: true,
      mutedUntil: new Date(Date.now() + 3 * 24 * 3_600_000),
      lastLogin: new Date(),
    });

    const { body } = await request(app.getHttpServer())
      .get(`/api/v1/users/${other.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    expect(Object.keys(body as object).sort()).toEqual(PUBLIC_FIELDS);
    expect(JSON.stringify(body)).not.toContain(other.email);
  });

  it('still returns the whole own account on /users/me', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    expect(body).toEqual(expect.objectContaining({ email: viewer.email }));
    expect(body).not.toHaveProperty('passwordHash');
  });
});

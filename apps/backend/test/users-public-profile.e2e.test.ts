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

const PUBLIC_FIELDS = [
  'avatarCat',
  'avatarUrl',
  'badges',
  'bio',
  'customization',
  'displayName',
  'featured',
  'id',
  'level',
  'memberSince',
  'pinned',
  'title',
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

  it('lists the earned insignias without dates and never Ojo atento', async () => {
    const other = await createUser(prisma);
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await prisma.material.create({
      data: {
        title: 'Resumen público',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: other.id,
        subjectId,
        resourceType: 'OTRO',
      },
    });
    // Ten confirmed reportes: Ojo atento, which only its owner sees.
    for (let i = 0; i < 10; i += 1) {
      const review = await prisma.courseReview.create({
        data: {
          userId: author.id,
          subjectId,
          recommendation: 1,
          publicationStatus: 'REMOVED',
        },
      });
      const caso = await prisma.moderationCase.create({
        data: {
          kind: 'REPORTS',
          targetType: 'COURSE_REVIEW',
          courseReviewId: review.id,
          targetAuthorId: author.id,
          status: 'CLOSED',
          decision: 'REMOVE',
          closedAt: new Date(),
        },
      });
      await prisma.report.create({
        data: {
          caseId: caso.id,
          reporterId: other.id,
          reason: 'INSULTOS_O_ACOSO',
          targetType: 'COURSE_REVIEW',
          courseReviewId: review.id,
          status: 'CONFIRMED',
        },
      });
    }

    const { body } = await request(app.getHttpServer())
      .get(`/api/v1/users/${other.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    expect(body.badges).toContainEqual({
      slug: 'primer-aporte',
      name: 'Primer aporte',
      rarity: 'COMUN',
      tier: null,
      edition: 0,
    });
    expect(
      (body.badges as { slug: string }[]).some((b) => b.slug === 'ojo-atento'),
    ).toBe(false);
    expect(JSON.stringify(body.badges)).not.toMatch(/earned|seen|At"/);
  });

  it('lists only insignias of the catalog', async () => {
    const other = await createUser(prisma);
    const extra = await prisma.badge.upsert({
      where: { slug: 'fuera-del-catalogo' },
      create: {
        slug: 'fuera-del-catalogo',
        name: 'Fuera del catálogo',
        description: 'Una insignia sin criterio.',
        imageUrl: '/x.svg',
      },
      update: {},
    });
    await prisma.userBadge.create({
      data: { userId: other.id, badgeId: extra.id },
    });

    const { body } = await request(app.getHttpServer())
      .get(`/api/v1/users/${other.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    expect(
      (body.badges as { slug: string }[]).some(
        (b) => b.slug === 'fuera-del-catalogo',
      ),
    ).toBe(false);
  });
});

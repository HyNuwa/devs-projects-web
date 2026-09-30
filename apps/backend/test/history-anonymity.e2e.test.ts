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

type HistoryItem = {
  id: string;
  action: string;
  caseId: string | null;
  reason: string | null;
  targetUser: { username: string | null } | null;
};

/**
 * The history must not let a moderator match a sanción to the account's file
 * when it came from a caso about anonymous content (openspec moderation/cases).
 */
describe('history of sanctions from anonymous casos (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let otherModerator: E2eUser;
  let admin: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    otherModerator = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  async function reviewCase(author: E2eUser, isAnonymous: boolean) {
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous,
        comment: 'Reseña e2e',
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
      },
    });
  }

  const warn = (author: E2eUser, caseId: string, reason: string) =>
    request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${author.id}/warn`)
      .set('Authorization', bearer(app, moderator))
      .send({ reason, caseId })
      .expect(201);

  async function history(viewer: E2eUser, caseId: string) {
    const response = await request(app.getHttpServer())
      .get('/api/v1/moderation/history')
      .query({ action: 'WARNED' })
      .set('Authorization', bearer(app, viewer))
      .expect(200);
    const items = response.body.items as HistoryItem[];
    const item = items.find((entry) => entry.caseId === caseId);
    expect(item).toBeDefined();
    return item!;
  }

  it('hides the account and the reason from moderators, not from admins', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    await warn(author, caso.id, 'Advertencia por un insulto anónimo.');

    const seenByModerator = await history(otherModerator, caso.id);
    expect(seenByModerator.reason).toBeNull();
    expect(seenByModerator.targetUser).toBeNull();

    const seenByAdmin = await history(admin, caso.id);
    expect(seenByAdmin.reason).toBe('Advertencia por un insulto anónimo.');
    expect(seenByAdmin.targetUser).not.toBeNull();
  });

  it('resolves anonymity through the caso when the event has no content', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    // History rows are append-only, so the event is written that way directly.
    await prisma.moderationEvent.create({
      data: {
        actorId: moderator.id,
        action: 'WARNED',
        caseId: caso.id,
        targetUserId: author.id,
        reason: 'Advertencia sin contenido en el evento.',
      },
    });

    const seen = await history(otherModerator, caso.id);
    expect(seen.reason).toBeNull();
    expect(seen.targetUser).toBeNull();
  });

  it('keeps the reason of a sanción from a caso about signed content', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, false);
    await warn(author, caso.id, 'Advertencia por una reseña firmada.');

    const seen = await history(otherModerator, caso.id);
    expect(seen.reason).toBe('Advertencia por una reseña firmada.');
    expect(seen.targetUser).not.toBeNull();
  });

  it('keeps the reason of a retiro of anonymous content', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    const event = await prisma.moderationEvent.create({
      data: {
        actorId: moderator.id,
        action: 'REMOVED',
        caseId: caso.id,
        targetType: 'COURSE_REVIEW',
        courseReviewId: caso.courseReviewId,
        targetUserId: author.id,
        reason: 'Insultos',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/moderation/history')
      .query({ action: 'REMOVED' })
      .set('Authorization', bearer(app, otherModerator))
      .expect(200);
    const item = (response.body.items as HistoryItem[]).find(
      (entry) => entry.id === event.id,
    );
    expect(item?.reason).toBe('Insultos');
  });
});

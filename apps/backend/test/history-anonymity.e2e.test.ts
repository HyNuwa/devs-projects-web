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
  target: { id: string | null } | null;
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

  async function list(viewer: E2eUser, query: Record<string, string>) {
    const response = await request(app.getHttpServer())
      .get('/api/v1/moderation/history')
      .query(query)
      .set('Authorization', bearer(app, viewer))
      .expect(200);
    return response.body.items as HistoryItem[];
  }

  /** The history row of the `action` event about `caseId`, as `viewer` sees it. */
  async function history(viewer: E2eUser, caseId: string, action = 'WARNED') {
    const event = await prisma.moderationEvent.findFirstOrThrow({
      where: { caseId, action: action as 'WARNED' },
      orderBy: { createdAt: 'desc' },
    });
    const item = (await list(viewer, { action })).find(
      (entry) => entry.id === event.id,
    );
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

  it('does not link a sanción to the anonymous caso or its content for moderators', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    await warn(author, caso.id, 'Advertencia por otro insulto anónimo.');

    const seenByModerator = await history(otherModerator, caso.id);
    expect(seenByModerator.caseId).toBeNull();
    expect(seenByModerator.target).toBeNull();
    const byContent = await list(otherModerator, {
      contentId: caso.courseReviewId!,
    });
    expect(byContent.some((entry) => entry.id === seenByModerator.id)).toBe(
      false,
    );

    const seenByAdmin = await history(admin, caso.id);
    expect(seenByAdmin.caseId).toBe(caso.id);
    expect(
      (await list(admin, { contentId: caso.courseReviewId! })).some(
        (entry) => entry.id === seenByAdmin.id,
      ),
    ).toBe(true);
  });

  it('hides what the appellant wrote about a sanción from an anonymous caso', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    await warn(author, caso.id, 'Advertencia apelada.');
    const sanction = await prisma.sanction.findFirstOrThrow({
      where: { userId: author.id },
    });
    await request(app.getHttpServer())
      .post('/api/v1/me/appeals')
      .set('Authorization', bearer(app, author))
      .send({
        kind: 'SANCTION',
        sanctionId: sanction.id,
        explanation: 'Texto único de la apelación e2e.',
      })
      .expect(201);

    const seenByModerator = await history(
      otherModerator,
      caso.id,
      'APPEAL_FILED',
    );
    expect(seenByModerator.reason).toBeNull();
    expect(seenByModerator.caseId).toBeNull();
    expect(seenByModerator.target).toBeNull();
    expect(seenByModerator.targetUser).toBeNull();

    const seenByAdmin = await history(admin, caso.id, 'APPEAL_FILED');
    expect(seenByAdmin.reason).toBe('Texto único de la apelación e2e.');
  });

  it('hides the explanation of an appeal about anonymous content, as the read-only appeal does', async () => {
    const author = await createUser(prisma);
    const caso = await reviewCase(author, true);
    await prisma.moderationEvent.create({
      data: {
        actorId: author.id,
        action: 'APPEAL_FILED',
        caseId: caso.id,
        targetType: 'COURSE_REVIEW',
        courseReviewId: caso.courseReviewId,
        targetUserId: author.id,
        reason: 'No insulté a nadie.',
        metadata: { kind: 'RETIRO' },
      },
    });

    const seen = await history(otherModerator, caso.id, 'APPEAL_FILED');
    expect(seen.reason).toBeNull();
    expect(seen.caseId).toBe(caso.id);
    expect(seen.targetUser).toBeNull();
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

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

type AppealItem = {
  id: string;
  kind: string;
  appellant: { hidden: boolean; username: string | null };
  decidedBy: { username: string | null };
};

/** An appeal as the viewer sees it, without its id and timestamps. */
function withoutTimes(item: {
  id: string;
  createdAt: string;
  decision: { decidedAt: string };
}) {
  const { id: _id, createdAt: _createdAt, decision, ...rest } = item;
  const { decidedAt: _decidedAt, ...decisionRest } = decision;
  return { ...rest, decision: decisionRest };
}

describe('reviewing appeals (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let decider: E2eUser;
  let reviewer: E2eUser;
  let admin: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    decider = await createUser(prisma, 'MODERATOR');
    reviewer = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (user: E2eUser) => ({
    get: (path: string) =>
      request(app.getHttpServer())
        .get(`/api/v1${path}`)
        .set('Authorization', bearer(app, user)),
    post: (path: string, body: object) =>
      request(app.getHttpServer())
        .post(`/api/v1${path}`)
        .set('Authorization', bearer(app, user))
        .send(body),
  });

  /** A reseña by `author`, anonymous unless `signed`, retired by `decider` and appealed. */
  async function appealedRetiro(author: E2eUser, { signed = false } = {}) {
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: !signed,
        comment: 'Reseña e2e',
        publicationStatus: 'REMOVED',
        authorFacingReason: 'Insultos',
      },
    });
    const moderationCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
        status: 'CLOSED',
        closedAt: new Date(),
        decision: 'REMOVE',
        decidedById: decider.id,
        decisionReason: 'Insultos',
      },
    });
    await as(author)
      .post('/me/appeals', {
        kind: 'RETIRO',
        caseId: moderationCase.id,
        explanation: 'No insulté a nadie.',
      })
      .expect(201);
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { caseId: moderationCase.id },
    });
    return { review, appeal };
  }

  it('hides anonymous appellants and never lists the viewer’s own decisions', async () => {
    const author = await createUser(prisma);
    const { appeal } = await appealedRetiro(author);

    const forReviewer = await as(reviewer)
      .get('/moderation/appeals')
      .expect(200);
    const item = (forReviewer.body as AppealItem[]).find(
      (entry) => entry.id === appeal.id,
    );
    expect(item).toBeDefined();
    expect(item!.appellant).toEqual({ hidden: true, username: null });
    expect(JSON.stringify(forReviewer.body)).not.toContain(author.id);

    const forDecider = await as(decider).get('/moderation/appeals').expect(200);
    expect(
      (forDecider.body as AppealItem[]).some((entry) => entry.id === appeal.id),
    ).toBe(false);
  });

  it('shows the appealed decision, the explanation and the content in the detail', async () => {
    const author = await createUser(prisma);
    const { appeal } = await appealedRetiro(author);

    const { body } = await as(admin)
      .get(`/moderation/appeals/${appeal.id}`)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        id: appeal.id,
        explanation: 'No insulté a nadie.',
        canAnswer: true,
        appellant: { hidden: true, username: null },
        decision: expect.objectContaining({
          kind: 'RETIRO',
          reason: 'Insultos',
        }),
      }),
    );
    expect(JSON.stringify(body)).not.toContain(author.id);
  });

  it('sends every appeal about anonymous content to admins, whoever appeals', async () => {
    const student = await createUser(prisma);
    const staff = await createUser(prisma, 'MODERATOR');
    const fromStudent = (await appealedRetiro(student)).appeal;
    const fromStaff = (await appealedRetiro(staff)).appeal;

    type ListItem = AppealItem & {
      canAnswer: boolean;
      createdAt: string;
      decision: { decidedAt: string };
    };
    const list = await as(reviewer).get('/moderation/appeals').expect(200);
    const items = list.body as ListItem[];
    const shape = (id: string) => {
      const item = items.find((entry) => entry.id === id);
      expect(item).toBeDefined();
      return withoutTimes(item!);
    };
    expect(shape(fromStudent.id)).toEqual(
      expect.objectContaining({
        canAnswer: false,
        appellant: { hidden: true, username: null },
      }),
    );
    expect(shape(fromStaff.id)).toEqual(shape(fromStudent.id));
    expect(JSON.stringify(list.body)).not.toContain(student.id);
    expect(JSON.stringify(list.body)).not.toContain(staff.id);

    // The pending count is the same list, read-only items included.
    const summary = await as(reviewer).get('/moderation/summary').expect(200);
    expect(summary.body.pendingAppeals).toBe(items.length);

    const details: Record<string, unknown>[] = [];
    for (const appeal of [fromStudent, fromStaff]) {
      const { body } = await as(reviewer)
        .get(`/moderation/appeals/${appeal.id}`)
        .expect(200);
      expect(body.canAnswer).toBe(false);
      expect(body).not.toHaveProperty('explanation');
      expect(body.content ?? null).toBeNull();
      details.push(withoutTimes(body));

      const refused = await as(reviewer)
        .post(`/moderation/appeals/${appeal.id}/answer`, {
          accept: true,
          answer: 'Se restituye la reseña.',
        })
        .expect(403);
      expect(refused.body.message).toBe('No podés resolver esta apelación');
    }
    expect(details[1]).toEqual(details[0]);

    const forAdmin = await as(admin).get('/moderation/appeals').expect(200);
    for (const appeal of [fromStudent, fromStaff]) {
      expect(
        (forAdmin.body as ListItem[]).find((entry) => entry.id === appeal.id)
          ?.canAnswer,
      ).toBe(true);
      await as(admin)
        .post(`/moderation/appeals/${appeal.id}/answer`, {
          accept: true,
          answer: 'Se restituye la reseña.',
        })
        .expect(201);
    }
  });

  it('lists a staff appellant’s appeal of signed content read-only for other moderators', async () => {
    const staffAuthor = await createUser(prisma, 'MODERATOR');
    const { appeal } = await appealedRetiro(staffAuthor, { signed: true });

    const list = await as(reviewer).get('/moderation/appeals').expect(200);
    expect(
      (list.body as Array<{ id: string; canAnswer: boolean }>).find(
        (entry) => entry.id === appeal.id,
      )?.canAnswer,
    ).toBe(false);
    await as(reviewer)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: true,
        answer: 'Se restituye la reseña.',
      })
      .expect(403);
  });

  it('marks the appeals a moderator may answer', async () => {
    const author = await createUser(prisma);
    const { appeal } = await appealedRetiro(author, { signed: true });
    const list = await as(reviewer).get('/moderation/appeals').expect(200);
    expect(
      (list.body as Array<{ id: string; canAnswer: boolean }>).find(
        (entry) => entry.id === appeal.id,
      )?.canAnswer,
    ).toBe(true);
  });

  it('keeps appeals of suspensiones for admins', async () => {
    const student = await createUser(prisma);
    await as(admin)
      .post(`/moderation/users/${student.id}/suspend`, {
        reason: 'Spam.',
        duration: '7_DAYS',
      })
      .expect(201);
    const sanction = await prisma.sanction.findFirstOrThrow({
      where: { userId: student.id },
    });
    const appeal = await prisma.appeal.create({
      data: {
        appellantId: student.id,
        kind: 'SANCTION',
        sanctionId: sanction.id,
        explanation: 'No fui yo.',
        decidedById: admin.id,
      },
    });

    const forReviewer = await as(reviewer)
      .get('/moderation/appeals')
      .expect(200);
    expect(
      (forReviewer.body as AppealItem[]).some(
        (entry) => entry.id === appeal.id,
      ),
    ).toBe(false);
    await as(reviewer).get(`/moderation/appeals/${appeal.id}`).expect(403);

    const otherAdmin = await createUser(prisma, 'ADMIN');
    const forAdmin = await as(otherAdmin)
      .get('/moderation/appeals')
      .expect(200);
    expect(
      (forAdmin.body as AppealItem[]).some((entry) => entry.id === appeal.id),
    ).toBe(true);
  });

  it('answers an appeal: accepting restores the retired reseña', async () => {
    const author = await createUser(prisma);
    const { review, appeal } = await appealedRetiro(author, { signed: true });

    await as(reviewer)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: true,
        answer: 'Criticaba la cursada, no a una persona.',
      })
      .expect(201);

    const restored = await prisma.courseReview.findUniqueOrThrow({
      where: { id: review.id },
    });
    expect(restored.publicationStatus).toBe('PUBLISHED');
    await as(reviewer)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: false,
        answer: 'x',
      })
      .expect(409);
  });

  it('tells the author the appeal status and answer, never who reviewed it', async () => {
    const author = await createUser(prisma);
    const { review, appeal } = await appealedRetiro(author);
    await as(admin)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: false,
        answer: 'Hay insultos a la docente.',
      })
      .expect(201);

    const { body } = await as(author).get('/me/submissions').expect(200);
    const entry = (body as Array<{ id: string; retiro: unknown }>).find(
      (submission) => submission.id === review.id,
    );
    expect(entry?.retiro).toEqual(
      expect.objectContaining({
        appealable: false,
        appeal: expect.objectContaining({
          status: 'REJECTED',
          answer: 'Hay insultos a la docente.',
        }),
      }),
    );
    expect(JSON.stringify(body)).not.toContain(admin.id);
  });

  it('lists the account’s own sanciones without who applied them', async () => {
    const student = await createUser(prisma);
    await as(reviewer)
      .post(`/moderation/users/${student.id}/mute`, { reason: 'Spam.' })
      .expect(201);

    const { body } = await as(student).get('/me/sanctions').expect(200);

    expect(body).toEqual([
      expect.objectContaining({
        type: 'MUTE',
        reason: 'Spam.',
        appealable: true,
        appealStatus: null,
        appealAnswer: null,
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain(reviewer.id);
  });
});

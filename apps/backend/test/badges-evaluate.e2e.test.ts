import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { MaterialResourceType } from '../src/generated/prisma';
import { BadgeService } from '../src/modules/ranking/badges/badge.service';
import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Insignias evaluated from real rows (openspec reputation/badges). */
describe('BadgeService.evaluate (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let badges: BadgeService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    badges = app.get(BadgeService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function material(
    author: E2eUser,
    subjectId: string,
    extra: { resourceType?: MaterialResourceType; createdAt?: Date } = {},
  ) {
    return prisma.material.create({
      data: {
        title: `Material ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: extra.resourceType ?? 'APUNTE',
        ...(extra.createdAt ? { createdAt: extra.createdAt } : {}),
      },
      select: { id: true },
    });
  }

  async function held(user: E2eUser) {
    const rows = await prisma.userBadge.findMany({
      where: { userId: user.id },
      select: {
        tier: true,
        edition: true,
        seenAt: true,
        badge: { select: { slug: true } },
      },
    });
    return new Map(rows.map((row) => [row.badge.slug, row]));
  }

  it('inserts a newly met insignia unseen, without a grado', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await material(author, subjectId);

    await badges.evaluate(author.id);

    expect((await held(author)).get('primer-aporte')).toEqual({
      tier: null,
      edition: 0,
      seenAt: null,
      badge: { slug: 'primer-aporte' },
    });
  });

  it('raises the grado and shows it again as unseen', async () => {
    const author = await createUser(prisma);
    for (let i = 0; i < 5; i += 1) {
      await material(author, (await createSubject(prisma)).id);
    }
    await badges.evaluate(author.id);
    expect((await held(author)).get('trotamaterias')?.tier).toBe('BRONCE');
    await prisma.userBadge.updateMany({
      where: { userId: author.id },
      data: { seenAt: new Date() },
    });

    for (let i = 0; i < 5; i += 1) {
      await material(author, (await createSubject(prisma)).id);
    }
    await badges.evaluate(author.id);

    const trotter = (await held(author)).get('trotamaterias');
    expect(trotter?.tier).toBe('PLATA');
    expect(trotter?.seenAt).toBeNull();
  });

  it('removes an insignia when its material is retired, and gives it back when restored', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id } = await material(author, subjectId);
    await badges.evaluate(author.id);

    await prisma.material.update({
      where: { id },
      data: { publicationStatus: 'REMOVED' },
    });
    await badges.evaluate(author.id);
    expect((await held(author)).has('primer-aporte')).toBe(false);

    await prisma.material.update({
      where: { id },
      data: { publicationStatus: 'PUBLISHED' },
    });
    await badges.evaluate(author.id);
    expect((await held(author)).has('primer-aporte')).toBe(true);
  });

  it('gives Primera luz only to the first material ever published in a materia', async () => {
    const first = await createUser(prisma);
    const second = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await material(first, subjectId, {
      createdAt: new Date(Date.now() - 86_400_000),
    });
    await material(second, subjectId);

    await badges.evaluate(first.id);
    await badges.evaluate(second.id);

    expect((await held(first)).has('primera-luz')).toBe(true);
    expect((await held(second)).has('primera-luz')).toBe(false);
  });

  it('counts only valid «Me sirvió», and Puente by the givers’ active carreras', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id } = await material(author, subjectId);
    for (const status of ['ACTIVE', 'ACTIVE', 'ACTIVE'] as const) {
      const giver = await createUser(prisma);
      const career = await prisma.career.create({
        data: {
          facultyId: FI_UNJU_FACULTY_ID,
          name: `Carrera ${randomUUID().slice(0, 6)}`,
          code: `C${randomUUID().slice(0, 8)}`,
        },
      });
      const plan = await prisma.studyPlan.create({
        data: { careerId: career.id, name: 'Plan', code: 'P1', duration: 5 },
      });
      await prisma.userStudyPlan.create({
        data: { userId: giver.id, studyPlanId: plan.id, status },
      });
      await prisma.materialHelpfulness.create({
        data: { userId: giver.id, materialId: id },
      });
    }
    // An unverified giver and the author's own mark do not count.
    const unverified = await createUser(prisma, 'USER', {
      emailVerified: false,
    });
    await prisma.materialHelpfulness.createMany({
      data: [
        { userId: unverified.id, materialId: id },
        { userId: author.id, materialId: id },
      ],
    });

    await badges.evaluate(author.id);

    const insignias = await held(author);
    expect(insignias.has('primer-me-sirvio')).toBe(true);
    expect(insignias.has('puente')).toBe(true);
  });

  it('never counts anonymous reseñas', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await prisma.courseReview.createMany({
      data: Array.from({ length: 5 }, () => ({
        userId: author.id,
        subjectId,
        recommendation: 4,
        isAnonymous: true,
      })),
    });

    await badges.evaluate(author.id);

    expect((await held(author)).has('voz-de-la-cursada')).toBe(false);
  });

  it('counts confirmed reportes whose retiro stands for Ojo atento', async () => {
    const reporter = await createUser(prisma);
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
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
          // One retiro undone: 9 confirmed reportes stand.
          revertedAt: i === 0 ? new Date() : null,
        },
      });
      await prisma.report.create({
        data: {
          caseId: caso.id,
          reporterId: reporter.id,
          reason: 'INSULTOS_O_ACOSO',
          targetType: 'COURSE_REVIEW',
          courseReviewId: review.id,
          status: 'CONFIRMED',
        },
      });
    }

    await badges.evaluate(reporter.id);
    expect((await held(reporter)).has('ojo-atento')).toBe(false);

    await prisma.moderationCase.updateMany({
      where: { targetAuthorId: author.id },
      data: { revertedAt: null },
    });
    await badges.evaluate(reporter.id);
    expect((await held(reporter)).has('ojo-atento')).toBe(true);
  });

  it('leaves no duplicates when evaluated concurrently', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await material(author, subjectId);

    await Promise.all(
      Array.from({ length: 5 }, () => badges.evaluate(author.id)),
    );

    expect(
      await prisma.userBadge.count({
        where: { userId: author.id, badge: { slug: 'primer-aporte' } },
      }),
    ).toBe(1);
  });

  it('lowers a grado without showing it as new nor changing its date', async () => {
    const author = await createUser(prisma);
    const ids: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      ids.push((await material(author, (await createSubject(prisma)).id)).id);
    }
    await badges.evaluate(author.id);
    await prisma.userBadge.updateMany({
      where: { userId: author.id },
      data: { seenAt: new Date() },
    });
    const before = await prisma.userBadge.findFirstOrThrow({
      where: { userId: author.id, badge: { slug: 'trotamaterias' } },
    });

    await prisma.material.updateMany({
      where: { id: { in: ids.slice(0, 5) } },
      data: { publicationStatus: 'REMOVED' },
    });
    await badges.evaluate(author.id);

    const after = await prisma.userBadge.findFirstOrThrow({
      where: { userId: author.id, badge: { slug: 'trotamaterias' } },
    });
    expect(after.tier).toBe('BRONCE');
    expect(after.seenAt).not.toBeNull();
    expect(after.tierUpdatedAt).toEqual(before.tierUpdatedAt);
  });

  it('counts content hidden while moderation reviews it, as points do', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id } = await material(author, subjectId);
    await badges.evaluate(author.id);

    await prisma.material.update({
      where: { id },
      data: { publicationStatus: 'HIDDEN', hiddenAt: new Date() },
    });
    await badges.evaluate(author.id);

    expect((await held(author)).has('primer-aporte')).toBe(true);
  });
});

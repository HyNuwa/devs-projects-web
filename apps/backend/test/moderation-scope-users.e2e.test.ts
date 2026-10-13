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

/** Usuarios and sanciones follow the alcance de moderación (openspec moderation/scope). */
describe('Accounts a moderator can see (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  let universityId: string;
  const faculties: Record<'A' | 'B', string> = { A: '', B: '' };
  const subjects: Record<'A' | 'B', string> = { A: '', B: '' };

  let modA: E2eUser;
  let student: E2eUser; // carrera in A
  let signedAuthor: E2eUser; // signed caso in A, no carrera
  let anonymousAuthor: E2eUser; // only an anonymous reseña with a caso in A
  let outsider: E2eUser; // nothing in A
  const usernames = new Map<string, string>();

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad cuentas ${tag}`, shortName: `UC${tag}` },
      select: { id: true },
    }));
    for (const key of ['A', 'B'] as const) {
      const faculty = await prisma.faculty.create({
        data: {
          universityId,
          name: `Facultad ${key} ${tag}`,
          shortName: `F${key}`,
        },
        select: { id: true },
      });
      faculties[key] = faculty.id;
      subjects[key] = (
        await prisma.subject.create({
          data: { facultyId: faculty.id, name: `Materia ${key} ${tag}` },
          select: { id: true },
        })
      ).id;
    }
    const career = await prisma.career.create({
      data: {
        facultyId: faculties.A,
        name: `Carrera ${tag}`,
        code: 'CA',
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { studyPlans: { select: { id: true } } },
    });

    modA = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    student = await createUser(prisma);
    signedAuthor = await createUser(prisma);
    anonymousAuthor = await createUser(prisma);
    outsider = await createUser(prisma);
    for (const user of [student, signedAuthor, anonymousAuthor, outsider]) {
      const { username } = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { username: true },
      });
      usernames.set(user.id, username);
    }
    await prisma.userStudyPlan.create({
      data: { userId: student.id, studyPlanId: career.studyPlans[0].id },
    });

    const material = await prisma.material.create({
      data: {
        title: 'Firmado',
        fileUrl: 'https://drive.example.com/users-scope',
        fileType: 'pdf',
        fileSize: 10,
        authorId: signedAuthor.id,
        subjectId: subjects.A,
        resourceType: 'PARCIAL',
      },
      select: { id: true },
    });
    await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: signedAuthor.id,
      },
    });
    const review = await prisma.courseReview.create({
      data: {
        userId: anonymousAuthor.id,
        subjectId: subjects.A,
        recommendation: 3,
        isAnonymous: true,
      },
      select: { id: true },
    });
    await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: anonymousAuthor.id,
      },
    });

    // The student was silenced from a signed caso of facultad B.
    const other = await prisma.material.create({
      data: {
        title: 'Otra facultad',
        fileUrl: 'https://drive.example.com/users-scope-b',
        fileType: 'pdf',
        fileSize: 10,
        authorId: student.id,
        subjectId: subjects.B,
        resourceType: 'PARCIAL',
        publicationStatus: 'REMOVED',
      },
      select: { id: true },
    });
    const caseB = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: other.id,
        targetAuthorId: student.id,
        status: 'CLOSED',
        decision: 'REMOVE',
        closedAt: new Date(),
      },
      select: { id: true },
    });
    await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'WARNING',
        reason: `Advertencia en otra facultad ${tag}`,
        appliedById: modA.id,
        caseId: caseB.id,
      },
    });
  });

  afterAll(async () => {
    const subjectIds = Object.values(subjects);
    await prisma.sanction.deleteMany({ where: { userId: student.id } });
    await prisma.moderationCase.deleteMany({
      where: {
        OR: [
          { material: { subjectId: { in: subjectIds } } },
          { courseReview: { subjectId: { in: subjectIds } } },
        ],
      },
    });
    await prisma.material.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.courseReview.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.userStudyPlan.deleteMany({ where: { userId: student.id } });
    await prisma.career.deleteMany({ where: { facultyId: faculties.A } });
    await prisma.moderatorScope.deleteMany({
      where: { facultyId: { in: Object.values(faculties) } },
    });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  const search = async (user: E2eUser, q: string) =>
    (
      (
        await http()
          .get('/api/v1/moderation/users')
          .query({ q })
          .set('Authorization', bearer(app, user))
          .expect(200)
      ).body.users as { id: string }[]
    ).map((row) => row.id);
  const file = (user: E2eUser, id: string) =>
    http()
      .get(`/api/v1/moderation/users/${id}`)
      .set('Authorization', bearer(app, user));
  const act = (user: E2eUser, id: string, action: string, body: object) =>
    http()
      .post(`/api/v1/moderation/users/${id}/${action}`)
      .set('Authorization', bearer(app, user))
      .send(body);

  it('lists and opens an account with a carrera in the facultad', async () => {
    expect(await search(modA, usernames.get(student.id)!)).toEqual([
      student.id,
    ]);
    await file(modA, student.id).expect(200);
  });

  it('finds a visible account even when many accounts outside the facultad match first', async () => {
    const prefix = `sc_${tag.toLowerCase()}`;
    await prisma.user.createMany({
      data: Array.from({ length: 55 }, (_, i) => ({
        username: `${prefix}_a${String(i).padStart(2, '0')}`,
        email: `${prefix}_a${i}@devsproject.test`,
        passwordHash: 'x',
      })),
    });
    await prisma.user.update({
      where: { id: student.id },
      data: { username: `${prefix}_z` },
    });
    expect(await search(modA, prefix)).toEqual([student.id]);
    await prisma.user.update({
      where: { id: student.id },
      data: { username: usernames.get(student.id)! },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: `${prefix}_a` } },
    });
  });

  it('lists the signed author of a caso in the facultad', async () => {
    expect(await search(modA, usernames.get(signedAuthor.id)!)).toEqual([
      signedAuthor.id,
    ]);
  });

  it('never surfaces the author of only an anonymous reseña', async () => {
    expect(await search(modA, usernames.get(anonymousAuthor.id)!)).toEqual([]);
    const missing = await file(modA, randomUUID()).expect(404);
    const hidden = await file(modA, anonymousAuthor.id).expect(404);
    expect(hidden.body.message).toBe(missing.body.message);
  });

  it('refuses sanctions on accounts the moderator cannot see, recording nothing', async () => {
    const reason = { reason: 'Insultos reiterados.' };
    const missing = await act(modA, randomUUID(), 'warn', reason).expect(404);
    for (const [action, body] of [
      ['warn', reason],
      ['mute', reason],
      ['suspension-proposals', { ...reason, duration: '7_DAYS' }],
      ['unmute', reason],
      ['lift-suspension', reason],
    ] as const) {
      const res = await act(modA, outsider.id, action, body).expect(404);
      expect(res.body.message).toBe(missing.body.message);
    }
    expect(
      await prisma.sanction.count({ where: { userId: outsider.id } }),
    ).toBe(0);
    expect(
      await prisma.suspensionProposal.count({ where: { userId: outsider.id } }),
    ).toBe(0);
  });

  it('shows a visible account its sanción from another facultad', async () => {
    const res = await file(modA, student.id).expect(200);
    expect(JSON.stringify(res.body)).toContain(
      `Advertencia en otra facultad ${tag}`,
    );
  });
});

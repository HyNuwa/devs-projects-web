import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser, type E2eUser } from './support/e2e-app';
import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';

const MIN = 60_000;

type RelatedResponse = {
  sharedContext: unknown;
  items: { id: string; author?: { username: string } }[];
};

/** «Con el mismo contexto» (openspec academic-community/experiences). */
describe('Experiencias: mismo contexto (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let author: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();

  let subjectId: string;
  let otherSubjectId: string;
  let professorId: string;
  let gomezProfessorId: string;
  let targetReviewId: string;
  let manualNameReviewId: string;
  let bareReviewId: string;
  let noRecuerdoExamId: string;
  let julioOralExamId: string;
  let removedReviewId: string;
  const relatedReviewIds: string[] = [];
  const matchingExamIds: string[] = [];
  const reviewIds: string[] = [];
  const examIds: string[] = [];
  const professorIds: string[] = [];

  const ago = (minutes: number) => new Date(Date.now() - minutes * MIN);

  const review = async (data: Record<string, unknown>) => {
    const row = await prisma.courseReview.create({
      data: { userId: author.id, subjectId, recommendation: 4, ...data },
      select: { id: true },
    });
    reviewIds.push(row.id);
    return row.id;
  };

  const exam = async (data: Record<string, unknown>) => {
    const row = await prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId,
        year: 2025,
        format: 'ESCRITO',
        ...data,
      },
      select: { id: true },
    });
    examIds.push(row.id);
    return row.id;
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    author = await createUser(prisma, 'USER');
    ({ id: subjectId } = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia contexto ${tag}` },
      select: { id: true },
    }));
    ({ id: otherSubjectId } = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Otra contexto ${tag}` },
      select: { id: true },
    }));
    ({ id: professorId } = await prisma.professor.create({
      data: { name: `Laura Quiroga ${tag}` },
      select: { id: true },
    }));
    ({ id: gomezProfessorId } = await prisma.professor.create({
      data: { name: `A. Gómez ${tag}` },
      select: { id: true },
    }));
    professorIds.push(professorId, gomezProfessorId);

    // The target reseña declares Prof. Quiroga and franja Tarde: only reseñas
    // matching BOTH count, from any ciclo, most recent first (max 3).
    targetReviewId = await review({
      professorId,
      shift: 'TARDE',
      academicYear: 2025,
      createdAt: ago(60),
    });
    relatedReviewIds.push(
      await review({
        professorId,
        shift: 'TARDE',
        academicYear: 2024,
        createdAt: ago(10),
      }),
      await review({
        professorId,
        shift: 'TARDE',
        academicYear: 2023,
        createdAt: ago(20),
        isAnonymous: true,
      }),
      await review({ professorId, shift: 'TARDE', createdAt: ago(30) }),
      // Fourth candidate: past the limit of three.
      await review({ professorId, shift: 'TARDE', createdAt: ago(40) }),
      // Same professor, different franja: not the same context.
      await review({ professorId, shift: 'MANANA', createdAt: ago(5) }),
      // Same franja, another professor.
      await review({
        professorId: gomezProfessorId,
        shift: 'TARDE',
        createdAt: ago(6),
      }),
      // A manual name that happens to match is not the catalog professor.
      await review({
        professorName: `Laura Quiroga ${tag}`,
        shift: 'TARDE',
        createdAt: ago(7),
      }),
      // Out of public view.
      await review({
        professorId,
        shift: 'TARDE',
        publicationStatus: 'REMOVED',
        createdAt: ago(8),
      }),
    );
    // Same context but another materia: never related.
    await review({
      subjectId: otherSubjectId,
      professorId,
      shift: 'TARDE',
      createdAt: ago(9),
    });

    // A reseña that only declares a manual professor name.
    manualNameReviewId = await review({
      professorName: `A. Gómez ${tag}`,
      shift: 'NO_INDICO',
      createdAt: ago(50),
    });
    await review({
      professorName: `a. gómez ${tag.toLowerCase()}`,
      shift: 'NOCHE',
      createdAt: ago(11),
    });
    await review({
      professorName: `A. GÓMEZ ${tag}`,
      shift: 'MANANA',
      createdAt: ago(12),
    });
    // A catalog professor of the same name is a different declared fact.
    await review({ professorId: gomezProfessorId, createdAt: ago(13) });
    await review({ professorName: `Otro nombre ${tag}`, createdAt: ago(14) });

    // A reseña without professor nor franja has no context.
    bareReviewId = await review({ shift: 'NO_INDICO', createdAt: ago(70) });

    // Finales: the target that does not remember the mesa matches by formato.
    noRecuerdoExamId = await exam({
      session: 'NO_RECUERDO',
      format: 'ESCRITO',
      createdAt: ago(60),
    });
    matchingExamIds.push(
      await exam({ format: 'ESCRITO', session: 'JULIO', createdAt: ago(10) }),
      await exam({
        format: 'ESCRITO',
        session: 'NO_RECUERDO',
        isAnonymous: true,
        createdAt: ago(20),
      }),
      await exam({
        format: 'ESCRITO',
        session: 'DICIEMBRE',
        createdAt: ago(30),
      }),
      // Past the limit of three.
      await exam({ format: 'ESCRITO', session: 'MARZO', createdAt: ago(40) }),
      // Wrong formato (and not the JULIO mesa used below).
      await exam({ format: 'ORAL', session: 'MARZO', createdAt: ago(5) }),
      // Out of public view.
      await exam({
        format: 'ESCRITO',
        session: 'JULIO',
        publicationStatus: 'HIDDEN',
        hiddenAt: new Date(),
        createdAt: ago(6),
      }),
    );

    // A final that remembers the mesa matches período AND formato.
    julioOralExamId = await exam({
      session: 'JULIO',
      format: 'ORAL',
      createdAt: ago(50),
    });
    await exam({ session: 'JULIO', format: 'ORAL', createdAt: ago(15) });
    await exam({ session: 'JULIO', format: 'ORAL', createdAt: ago(25) });
    await exam({ session: 'MARZO', format: 'ORAL', createdAt: ago(16) });
    // Same mesa, another formato.
    await exam({ session: 'JULIO', format: 'MIXTO', createdAt: ago(17) });

    removedReviewId = await review({ publicationStatus: 'REMOVED' });
  });

  afterAll(async () => {
    await prisma.courseReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.examExperience.deleteMany({ where: { id: { in: examIds } } });
    await prisma.subject.deleteMany({
      where: { id: { in: [subjectId, otherSubjectId] } },
    });
    await prisma.professor.deleteMany({ where: { id: { in: professorIds } } });
    await prisma.user.delete({ where: { id: author.id } });
    await app.close();
  });

  it('lists up to 3 public reseñas sharing professor and franja, newest first', async () => {
    const res = await http()
      .get(`/api/v1/discovery/course-reviews/${targetReviewId}/related`)
      .expect(200);
    const body = res.body as RelatedResponse;

    expect(body.sharedContext).toEqual({
      professor: { id: professorId, name: `Laura Quiroga ${tag}` },
      shift: 'TARDE',
    });
    expect(body.items.map((item) => item.id)).toEqual(
      relatedReviewIds.slice(0, 3),
    );
    for (const item of body.items) {
      expect(item).not.toHaveProperty('comment');
    }
    expect(body.items[1].author).toEqual({ username: 'Anónimo' });
  });

  it('matches a manual professor name case-insensitively', async () => {
    const res = await http()
      .get(`/api/v1/discovery/course-reviews/${manualNameReviewId}/related`)
      .expect(200);
    const body = res.body as RelatedResponse;

    expect(body.sharedContext).toEqual({
      professor: { name: `A. Gómez ${tag}` },
    });
    expect(body.items).toHaveLength(2);
  });

  it('returns an empty context for a reseña that declared neither fact', async () => {
    const res = await http()
      .get(`/api/v1/discovery/course-reviews/${bareReviewId}/related`)
      .expect(200);
    const body = res.body as RelatedResponse;

    expect(body.sharedContext).toBeNull();
    expect(body.items).toEqual([]);
  });

  it('matches a NO_RECUERDO final by formato only', async () => {
    const res = await http()
      .get(`/api/v1/discovery/exam-experiences/${noRecuerdoExamId}/related`)
      .expect(200);
    const body = res.body as RelatedResponse;

    expect(body.sharedContext).toEqual({ format: 'ESCRITO' });
    expect(body.items.map((item) => item.id)).toEqual(
      matchingExamIds.slice(0, 3),
    );
    expect(body.items[1].author).toEqual({ username: 'Anónimo' });
  });

  it('matches a final that remembers the mesa by período and formato', async () => {
    const res = await http()
      .get(`/api/v1/discovery/exam-experiences/${julioOralExamId}/related`)
      .expect(200);
    const body = res.body as RelatedResponse;

    expect(body.sharedContext).toEqual({ session: 'JULIO', format: 'ORAL' });
    expect(body.items).toHaveLength(2);
  });

  it('answers 404 for entries that are not public', async () => {
    await http()
      .get(`/api/v1/discovery/course-reviews/${removedReviewId}/related`)
      .expect(404);
    await http()
      .get(`/api/v1/discovery/course-reviews/${randomUUID()}/related`)
      .expect(404);
    await http()
      .get(`/api/v1/discovery/exam-experiences/${randomUUID()}/related`)
      .expect(404);
  });
});

import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { correctionFixtures } from './support/corrections-fixtures';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
} from './support/e2e-app';

/** Suggesting a correction (openspec academic-resources/corrections). */
describe('POST /materials/:id/corrections (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let f: ReturnType<typeof correctionFixtures>;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    f = correctionFixtures(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an open suggestion and leaves the material unchanged', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);

    const { body } = await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
        comment: 'Es el primer parcial de 2024.',
      })
      .expect(201);

    expect(body).toMatchObject({ field: 'RESOURCE_TYPE', status: 'OPEN' });
    const stored = await prisma.correctionSuggestion.findUniqueOrThrow({
      where: { id: (body as { id: string }).id },
    });
    expect(stored).toMatchObject({
      currentValue: 'FINAL',
      proposedValue: 'PARCIAL',
      suggesterId: student.id,
    });
    expect(
      (await prisma.material.findUniqueOrThrow({ where: { id: material.id } }))
        .resourceType,
    ).toBe('FINAL');
  });

  it('accepts every correctable field with a valid value', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const professor = await f.professorOf(material.subjectId);
    const sibling = await createSubject(prisma);

    await f
      .suggest(student, material.id, {
        field: 'ACADEMIC_YEAR',
        proposedValue: '2023',
      })
      .expect(201);
    await f
      .suggest(student, material.id, {
        field: 'PROFESSOR',
        proposedValue: professor.id,
      })
      .expect(201);
    await f
      .suggest(student, material.id, {
        field: 'SUBJECT',
        proposedValue: sibling.id,
      })
      .expect(201);
  });

  it('refuses a student without the privilege', async () => {
    const author = await createUser(prisma);
    const student = await createUser(prisma, 'USER', { maxLevel: 2 });
    const material = await f.material(author.id);

    await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(403);
  });

  it('refuses a student who is not in good standing', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged({
      isMuted: true,
      mutedUntil: new Date(Date.now() + 86_400_000),
    });
    const moderator = await createUser(prisma, 'MODERATOR');
    await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'MUTE',
        reason: 'Insultos',
        endsAt: new Date(Date.now() + 86_400_000),
        appliedById: moderator.id,
      },
    });
    const material = await f.material(author.id);

    await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(403);
  });

  it.each([
    ['its own material', 'own'],
    ['an unpublished material', 'unpublished'],
    ['a deleted material', 'deleted'],
  ])('refuses %s', async (_, kind) => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(kind === 'own' ? student.id : author.id, {
      ...(kind === 'unpublished' ? { publicationStatus: 'HIDDEN' } : {}),
      ...(kind === 'deleted' ? { isDeleted: true } : {}),
    });

    const response = await f.suggest(student, material.id, {
      field: 'RESOURCE_TYPE',
      proposedValue: 'PARCIAL',
    });

    expect([403, 404]).toContain(response.status);
  });

  it.each<[string, { field: string; proposedValue: string | null }]>([
    ['the current value', { field: 'RESOURCE_TYPE', proposedValue: 'FINAL' }],
    ['an unknown tipo', { field: 'RESOURCE_TYPE', proposedValue: 'TESIS' }],
    [
      'an inherited object key as tipo',
      { field: 'RESOURCE_TYPE', proposedValue: 'toString' },
    ],
    ['a year out of range', { field: 'ACADEMIC_YEAR', proposedValue: '1850' }],
    [
      'a materia that does not exist',
      { field: 'SUBJECT', proposedValue: randomUUID() },
    ],
    [
      'a professor not linked to the materia',
      { field: 'PROFESSOR', proposedValue: randomUUID() },
    ],
    ['no tipo', { field: 'RESOURCE_TYPE', proposedValue: null }],
  ])('rejects %s', async (_, body) => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);

    const response = await f.suggest(student, material.id, body);

    expect([400, 404]).toContain(response.status);
  });

  it('rejects a materia of another facultad', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const university = await prisma.university.create({
      data: {
        name: `Universidad ${randomUUID().slice(0, 6)}`,
        shortName: `U${randomUUID().slice(0, 5)}`,
      },
    });
    const faculty = await prisma.faculty.create({
      data: {
        universityId: university.id,
        name: 'Facultad de Ciencias',
        shortName: 'FC',
      },
    });
    const foreign = await prisma.subject.create({
      data: { facultyId: faculty.id, name: 'Álgebra' },
    });

    await f
      .suggest(student, material.id, {
        field: 'SUBJECT',
        proposedValue: foreign.id,
      })
      .expect(400);
  });

  it('allows one open suggestion per field and material', async () => {
    const author = await createUser(prisma);
    const [first, second] = [await f.privileged(), await f.privileged()];
    const material = await f.material(author.id);

    await f
      .suggest(first, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(201);
    await f
      .suggest(second, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'APUNTE',
      })
      .expect(409);
    await f
      .suggest(second, material.id, {
        field: 'ACADEMIC_YEAR',
        proposedValue: '2022',
      })
      .expect(201);
  });

  it('stops a student at 10 open suggestions', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    for (let i = 0; i < 10; i += 1) {
      const material = await f.material(author.id);
      await f
        .suggest(student, material.id, {
          field: 'RESOURCE_TYPE',
          proposedValue: 'PARCIAL',
        })
        .expect(201);
    }
    const eleventh = await f.material(author.id);

    await f
      .suggest(student, eleventh.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(409);
  });

  it('offers the options for a correction form, with labels', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const professor = await f.professorOf(material.subjectId, 'Lic. Mamaní');

    const { body } = await f
      .http()
      .get(`/api/v1/materials/${material.id}/correction-options`)
      .set('Authorization', bearer(app, student))
      .expect(200);
    const options = body as {
      subjects: { id: string; name: string }[];
      professors: { id: string; name: string }[];
      resourceTypes: { value: string; label: string }[];
      current: Record<string, string | null>;
    };

    expect(
      options.subjects.some((subject) => subject.id === material.subjectId),
    ).toBe(true);
    expect(options.professors).toEqual([
      { id: professor.id, name: professor.name },
    ]);
    expect(options.resourceTypes).toContainEqual({
      value: 'PARCIAL',
      label: 'Parcial',
    });
    expect(options.current).toEqual({
      SUBJECT: material.subjectId,
      RESOURCE_TYPE: 'FINAL',
      ACADEMIC_YEAR: '2024',
      PROFESSOR: null,
    });
  });

  it('limits the comment to 500 characters', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);

    await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
        comment: 'x'.repeat(501),
      })
      .expect(400);
  });
});

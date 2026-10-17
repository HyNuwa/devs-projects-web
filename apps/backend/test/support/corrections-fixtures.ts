import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import type { PrismaService } from '../../src/prisma/prisma.service';
import { bearer, createSubject, createUser, type E2eUser } from './e2e-app';

/** Fixtures for correction suggestions (openspec academic-resources/corrections). */
export function correctionFixtures(
  app: NestExpressApplication,
  prisma: PrismaService,
) {
  const http = () => request(app.getHttpServer());

  /** Nivel máximo alcanzado 3 and no sanciones: holds Sugerir correcciones. */
  const privileged = (extra: Record<string, unknown> = {}) =>
    createUser(prisma, 'USER', { maxLevel: 3, level: 3, ...extra });

  async function material(
    authorId: string,
    extra: Record<string, unknown> = {},
  ) {
    const subjectId =
      (extra.subjectId as string | undefined) ??
      (await createSubject(prisma)).id;
    return prisma.material.create({
      data: {
        title: `Final ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        resourceType: 'FINAL',
        academicYear: 2024,
        ...extra,
        subjectId,
      },
    });
  }

  async function professorOf(subjectId: string, name = 'Ing. Quiroga') {
    const professor = await prisma.professor.create({
      data: { name: `${name} ${randomUUID().slice(0, 4)}` },
    });
    await prisma.subjectProfessor.create({
      data: { subjectId, professorId: professor.id },
    });
    return professor;
  }

  const suggest = (
    user: E2eUser,
    materialId: string,
    body: { field: string; proposedValue: string | null; comment?: string },
  ) =>
    http()
      .post(`/api/v1/materials/${materialId}/corrections`)
      .set('Authorization', bearer(app, user))
      .send(body);

  /** Moves a suggestion back in time, e.g. past the author's 7 days. */
  const age = (id: string, days: number) =>
    prisma.correctionSuggestion.update({
      where: { id },
      data: { createdAt: new Date(Date.now() - days * 86_400_000) },
    });

  return { http, privileged, material, professorOf, suggest, age };
}

import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { ServiceUnavailableException } from '@nestjs/common';
import { Server } from 'node:http';
import { Readable } from 'node:stream';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { DriveService } from '../src/modules/drive/drive.service';
import { CourseFilesService } from '../src/modules/courses/course-files.service';
import { Role } from '../src/generated/prisma';

describe('Learning API against PostgreSQL and simulated Drive', () => {
  let app: NestExpressApplication;
  let db: PrismaService;
  let server: Server;
  let jwt: JwtService;
  let adminId: number;
  let studentId: number;
  let admin: string;
  let student: string;
  const pdf = Buffer.from('%PDF-1.7\nprivate course document\n');
  const remote = new Map<string, Buffer>();
  const operations = new Map<string, string>();
  const drive = {
    isConfigured: true,
    ready: jest.fn(async () => {
      if (!drive.isConfigured)
        throw new ServiceUnavailableException('Drive no configurado');
    }),
    metadata: jest.fn(async (id: string) => {
      const bytes = remote.get(id);
      if (!bytes) throw new Error('missing mock file');
      return {
        id,
        name: 'notes.pdf',
        mimeType: 'application/pdf',
        size: bytes.length,
      };
    }),
    upload: jest.fn(
      async (openBody: () => Readable, metadata: { operationId: string }) => {
        const body = openBody();
        const chunks: Buffer[] = [];
        for await (const chunk of body)
          chunks.push(Buffer.from(chunk as Uint8Array));
        const id = `file_${operations.size + 1}`;
        remote.set(id, Buffer.concat(chunks));
        operations.set(metadata.operationId, id);
        return id;
      },
    ),
    findOperation: jest.fn(async (id: string) => operations.get(id) ?? null),
    removeOwned: jest.fn(async (id: string) => {
      remote.delete(id);
    }),
    media: jest.fn(async (id: string, range?: string) => {
      const data = remote.get(id)!;
      if (!range) return Readable.from(data);
      const match = /^bytes=(\d+)-(\d+)$/.exec(range)!;
      return Readable.from(
        data.subarray(Number(match[1]), Number(match[2]) + 1),
      );
    }),
    browse: jest.fn(async () => ({ files: [], nextPageToken: null })),
  };
  beforeAll(async () => {
    if (
      !process.env.DATABASE_URL ||
      new URL(process.env.DATABASE_URL).pathname !== '/codex_courses_test'
    )
      throw new Error('Use only the disposable codex_courses_test database');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DriveService)
      .useValue(drive)
      .compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
    db = app.get(PrismaService);
    jwt = app.get(JwtService);
    // This suite owns the disposable database checked above, including repeat runs.
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "User", careers, subjects RESTART IDENTITY CASCADE',
    );
    const stamp = Date.now();
    const a = await db.user.create({
      data: {
        username: `admin${stamp}`,
        email: `admin${stamp}@example.test`,
        passwordHash: 'unused',
        role: 'ADMIN',
      },
    });
    const s = await db.user.create({
      data: {
        username: `student${stamp}`,
        email: `student${stamp}@example.test`,
        passwordHash: 'unused',
        role: 'USER',
      },
    });
    adminId = a.id;
    studentId = s.id;
    admin = token(a.id, a.role);
    student = token(s.id, s.role);
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  function token(id: number, role: Role) {
    return `Bearer ${jwt.sign({ sub: id, role, email: 'token@example.test' })}`;
  }
  async function draft() {
    const result = await request(server)
      .post('/api/v1/courses')
      .set('Authorization', admin)
      .send({ title: 'Test course', description: 'Course description' })
      .expect(201);
    return result.body.id as string;
  }
  async function structure(id: string) {
    const section = await request(server)
      .post(`/api/v1/courses/${id}/sections`)
      .set('Authorization', admin)
      .send({ title: 'First section', position: 0 })
      .expect(201);
    const lesson = await request(server)
      .post(`/api/v1/courses/${id}/sections/${section.body.id}/lessons`)
      .set('Authorization', admin)
      .send({ title: 'First lesson', position: 0, body: 'Private lesson body' })
      .expect(201);
    return {
      sectionId: section.body.id as string,
      lessonId: lesson.body.id as string,
    };
  }
  it('creates academic context and links a course; validates DTOs and permissions', async () => {
    await request(server)
      .post('/api/v1/admin/subjects')
      .send({ name: 'Math' })
      .expect(401);
    await request(server)
      .post('/api/v1/admin/subjects')
      .set('Authorization', student)
      .send({ name: 'Math' })
      .expect(403);
    for (const payload of [
      { name: null },
      { name: '  ' },
      { name: 'Math', role: 'ADMIN' },
      { name: 123 },
    ])
      await request(server)
        .post('/api/v1/admin/subjects')
        .set('Authorization', admin)
        .send(payload)
        .expect(400);
    const subject = await request(server)
      .post('/api/v1/admin/subjects')
      .set('Authorization', admin)
      .send({ name: 'Álgebra', code: 'ALG' })
      .expect(201);
    expect(subject.body.searchKey).toBe('algebra');
    const career = await request(server)
      .post('/api/v1/admin/careers')
      .set('Authorization', admin)
      .send({ name: 'Engineering', code: `ENG${Date.now()}` })
      .expect(201);
    const plan = await request(server)
      .post('/api/v1/admin/study-plans')
      .set('Authorization', admin)
      .send({ careerId: career.body.id, name: '2026', code: '2026' })
      .expect(201);
    const association = { studyPlanId: plan.body.id, year: 1, semester: 1 };
    await request(server)
      .post(`/api/v1/admin/subjects/${subject.body.id}/study-plans`)
      .set('Authorization', admin)
      .send(association)
      .expect(201);
    await request(server)
      .post(`/api/v1/admin/subjects/${subject.body.id}/study-plans`)
      .set('Authorization', admin)
      .send(association)
      .expect(409);
    const course = await request(server)
      .post('/api/v1/courses')
      .set('Authorization', admin)
      .send({
        title: 'Algebra course',
        description: 'Math',
        subjectId: subject.body.id,
      })
      .expect(201);
    expect(course.body.subjectId).toBe(subject.body.id);
    await request(server).get('/api/v1/courses?limit=101').expect(400);
  });
  it('enforces course lifecycle, ordered structure, scope and public projections', async () => {
    const id = await draft();
    await request(server).get(`/api/v1/courses/${id}`).expect(404);
    await request(server)
      .post(`/api/v1/courses/${id}/publish`)
      .set('Authorization', admin)
      .expect(400);
    const { sectionId, lessonId } = await structure(id);
    await request(server)
      .post(`/api/v1/courses/${id}/sections`)
      .set('Authorization', admin)
      .send({ title: 'Duplicate', position: 0 })
      .expect(409);
    const another = await draft();
    await request(server)
      .patch(`/api/v1/courses/${another}/lessons/${lessonId}`)
      .set('Authorization', admin)
      .send({ title: 'Wrong parent' })
      .expect(404);
    await request(server)
      .post(`/api/v1/courses/${id}/publish`)
      .set('Authorization', admin)
      .expect(200);
    const summary = await request(server)
      .get(`/api/v1/courses/${id}`)
      .expect(200);
    expect(JSON.stringify(summary.body)).not.toContain('Private lesson body');
    expect(summary.body.sections[0].lessons[0]).not.toHaveProperty('files');
    await request(server)
      .delete(`/api/v1/courses/${id}/sections/${sectionId}`)
      .set('Authorization', admin)
      .expect(400);
    expect(await db.courseSection.count({ where: { id: sectionId } })).toBe(1);
  });
  it('requires active enrollment and blocks forged role claims immediately', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    await request(server)
      .post(`/api/v1/courses/${id}/publish`)
      .set('Authorization', admin)
      .expect(200);
    await request(server)
      .get(`/api/v1/courses/${id}/lessons/${lessonId}`)
      .set('Authorization', student)
      .expect(404);
    const enrollments = await Promise.all(
      [1, 2].map(() =>
        request(server)
          .put(`/api/v1/courses/${id}/enrollment`)
          .set('Authorization', student)
          .expect(200),
      ),
    );
    expect(enrollments[0].body.id).toBe(enrollments[1].body.id);
    await request(server)
      .get(`/api/v1/courses/${id}/lessons/${lessonId}`)
      .set('Authorization', student)
      .expect(200);
    await request(server)
      .patch(`/api/v1/courses/${id}/enrollments/${studentId}`)
      .set('Authorization', admin)
      .send({ active: false })
      .expect(200);
    await request(server)
      .get(`/api/v1/courses/${id}/lessons/${lessonId}`)
      .set('Authorization', student)
      .expect(404);
    await request(server)
      .post('/api/v1/courses')
      .set('Authorization', token(studentId, 'SUPERADMIN'))
      .send({ title: 'Escalation', description: 'Forbidden' })
      .expect(403);
  });
  it('serves private Drive content and ranges only through enrolled course access', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    const file = await request(server)
      .post(`/api/v1/courses/${id}/lessons/${lessonId}/files`)
      .set('Authorization', admin)
      .attach('file', pdf, 'notes.pdf')
      .expect(201);
    expect(file.body.state).toBe('READY');
    expect(file.body).not.toHaveProperty('driveFileId');
    await request(server)
      .post(`/api/v1/courses/${id}/publish`)
      .set('Authorization', admin)
      .expect(200);
    const url = `/api/v1/courses/${id}/lessons/${lessonId}/files/${file.body.id}/content`;
    const previous = drive.media.mock.calls.length;
    await request(server).get(url).set('Authorization', student).expect(404);
    expect(drive.media.mock.calls.length).toBe(previous);
    await request(server)
      .put(`/api/v1/courses/${id}/enrollment`)
      .set('Authorization', student)
      .expect(200);
    const partial = await request(server)
      .get(url)
      .set('Authorization', student)
      .set('Range', 'bytes=0-4')
      .expect(206);
    expect(partial.headers['content-range']).toBe(`bytes 0-4/${pdf.length}`);
    expect(partial.headers['cache-control']).toBe('private, no-store');
    expect(partial.body).toEqual(Buffer.from('%PDF-'));
    await request(server)
      .get(url)
      .set('Authorization', student)
      .set('Range', 'bytes=1000-')
      .expect(416);
    await db.courseFile.update({
      where: { id: file.body.id as string },
      data: { allowDownload: false },
    });
    await request(server)
      .get(`${url}?download=true`)
      .set('Authorization', student)
      .expect(403);
    await request(server)
      .get(`${url}?download=false`)
      .set('Authorization', student)
      .expect(200);
    await request(server)
      .delete(`/api/v1/courses/${id}/enrollment`)
      .set('Authorization', student)
      .expect(200);
    await request(server).get(url).set('Authorization', student).expect(404);
  });
  it('refuses invalid files and missing Drive without creating attachments', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    const url = `/api/v1/courses/${id}/lessons/${lessonId}/files`;
    await request(server)
      .post(url)
      .set('Authorization', admin)
      .attach('file', Buffer.from('MZ fake'), 'fake.pdf')
      .expect(400);
    drive.isConfigured = false;
    await request(server)
      .post(url)
      .set('Authorization', admin)
      .attach('file', pdf, 'notes.pdf')
      .expect(503);
    expect(await db.courseFile.count({ where: { lessonId } })).toBe(0);
    drive.isConfigured = true;
  });
  it('imports only once and never deletes the source when detached', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    remote.set('import_document', pdf);
    const url = `/api/v1/courses/${id}/lessons/${lessonId}/files`;
    const payload = { driveFileId: 'import_document', allowDownload: false };
    const imported = await request(server)
      .post(`${url}/import`)
      .set('Authorization', admin)
      .send(payload)
      .expect(201);
    await request(server)
      .post(`${url}/import`)
      .set('Authorization', admin)
      .send(payload)
      .expect(409);
    await request(server)
      .delete(`${url}/${imported.body.id}`)
      .set('Authorization', admin)
      .expect(200);
    expect(remote.has('import_document')).toBe(true);
  });
  it('recovers an uploaded file after an interrupted database completion without duplication', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    const record = await db.courseFile.create({
      data: {
        lessonId,
        uploaderId: adminId,
        originalName: 'notes.pdf',
        mimeType: 'application/pdf',
        size: pdf.length,
        origin: 'UPLOAD',
        state: 'PENDING',
      },
    });
    remote.set('recovered_file', pdf);
    operations.set(record.operationId, 'recovered_file');
    const before = drive.upload.mock.calls.length;
    await app.get(CourseFilesService).reconcile();
    expect(
      (await db.courseFile.findUniqueOrThrow({ where: { id: record.id } }))
        .state,
    ).toBe('READY');
    expect(drive.upload.mock.calls.length).toBe(before);
  });
  it('validates role assignment and commits audit evidence atomically', async () => {
    await request(server)
      .patch(`/api/v1/admin/users/${studentId}/role`)
      .set('Authorization', admin)
      .send({ role: 'SUPERADMIN', reason: 'Unauthorized promotion' })
      .expect(403);
    await request(server)
      .patch(`/api/v1/admin/users/${studentId}/role`)
      .set('Authorization', admin)
      .send({ role: 'MODERATOR' })
      .expect(400);
    await request(server)
      .patch(`/api/v1/admin/users/${studentId}/role`)
      .set('Authorization', admin)
      .send({ role: 'MODERATOR', reason: 'Community moderation' })
      .expect(200);
    expect(
      await db.roleChangeAudit.count({
        where: { actorId: adminId, targetId: studentId },
      }),
    ).toBe(1);
    const permissions = await request(server)
      .get('/api/v1/auth/permissions')
      .set('Authorization', student)
      .expect(200);
    expect(permissions.body.role).toBe('MODERATOR');
    await db.user.update({
      where: { id: studentId },
      data: { role: 'USER', isBanned: true },
    });
    await request(server)
      .get('/api/v1/auth/permissions')
      .set('Authorization', student)
      .expect(401);
    await db.user.update({
      where: { id: studentId },
      data: { isBanned: false },
    });
  });
  it('serializes concurrent superadministrator changes', async () => {
    const stamp = Date.now();
    const a = await db.user.create({
      data: {
        username: `supera${stamp}`,
        email: `sa${stamp}@example.test`,
        passwordHash: 'unused',
        role: 'SUPERADMIN',
      },
    });
    const b = await db.user.create({
      data: {
        username: `superb${stamp}`,
        email: `sb${stamp}@example.test`,
        passwordHash: 'unused',
        role: 'SUPERADMIN',
      },
    });
    const responses = await Promise.all([
      request(server)
        .patch(`/api/v1/admin/users/${b.id}/role`)
        .set('Authorization', token(a.id, 'SUPERADMIN'))
        .send({ role: 'USER', reason: 'Administrative change' }),
      request(server)
        .patch(`/api/v1/admin/users/${a.id}/role`)
        .set('Authorization', token(b.id, 'SUPERADMIN'))
        .send({ role: 'USER', reason: 'Administrative change' }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 403]);
    expect(
      await db.user.count({
        where: { id: { in: [a.id, b.id] }, role: 'SUPERADMIN' },
      }),
    ).toBe(1);
  });
  it('blocks muted writes while retaining authenticated reading', async () => {
    await db.user.update({
      where: { id: adminId },
      data: { mutedUntil: new Date(Date.now() + 60000) },
    });
    try {
      await request(server)
        .post('/api/v1/admin/subjects')
        .set('Authorization', admin)
        .send({ name: 'Blocked' })
        .expect(403);
      await request(server)
        .get('/api/v1/admin/roles')
        .set('Authorization', admin)
        .expect(200);
      await request(server)
        .get('/api/v1/courses/management')
        .set('Authorization', admin)
        .expect(200);
      await request(server)
        .get('/api/v1/admin/drive/files')
        .set('Authorization', admin)
        .expect(200);
    } finally {
      await db.user.update({
        where: { id: adminId },
        data: { mutedUntil: null },
      });
    }
  });
  it('records missing staging as recoverable failure without terminating the process', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    const file = await db.courseFile.create({
      data: {
        lessonId,
        uploaderId: adminId,
        originalName: 'missing.pdf',
        mimeType: 'application/pdf',
        size: 20,
        origin: 'UPLOAD',
      },
    });
    await app.get(CourseFilesService).reconcile();
    expect(
      (await db.courseFile.findUniqueOrThrow({ where: { id: file.id } })).state,
    ).toBe('FAILED');
    await request(server)
      .get('/api/v1/auth/permissions')
      .set('Authorization', admin)
      .expect(200);
  });
  it('sanitizes asynchronous provider stream errors during import', async () => {
    const id = await draft();
    const { lessonId } = await structure(id);
    remote.set('broken_stream', pdf);
    drive.media.mockResolvedValueOnce(
      new Readable({
        read() {
          this.destroy(new Error('provider-secret-should-not-escape'));
        },
      }),
    );
    const response = await request(server)
      .post(`/api/v1/courses/${id}/lessons/${lessonId}/files/import`)
      .set('Authorization', admin)
      .send({ driveFileId: 'broken_stream' })
      .expect(503);
    expect(JSON.stringify(response.body)).not.toContain('provider-secret');
  });
  it('rolls back role updates if the audit insert fails', async () => {
    await db.$executeRawUnsafe(
      "CREATE FUNCTION fail_role_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit blocked for test'; END $$",
    );
    await db.$executeRawUnsafe(
      'CREATE TRIGGER fail_role_audit BEFORE INSERT ON role_change_audits FOR EACH ROW EXECUTE FUNCTION fail_role_audit()',
    );
    try {
      await request(server)
        .patch(`/api/v1/admin/users/${studentId}/role`)
        .set('Authorization', admin)
        .send({ role: 'MODERATOR', reason: 'Atomic rollback test' })
        .expect(500);
      expect(
        (await db.user.findUniqueOrThrow({ where: { id: studentId } })).role,
      ).toBe('USER');
    } finally {
      await db.$executeRawUnsafe(
        'DROP TRIGGER fail_role_audit ON role_change_audits',
      );
      await db.$executeRawUnsafe('DROP FUNCTION fail_role_audit()');
    }
  });
});

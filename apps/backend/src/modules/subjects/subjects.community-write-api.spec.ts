import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

const REVIEW_ID = '30000000-0000-4000-8000-000000000001';
const EXAM_ID = '30000000-0000-4000-8000-000000000002';
const validReview = {
  academicYear: 2026,
  condition: 'REGULAR',
  attempt: 'PRIMERA_CURSADA',
  recommendation: 4,
  comment: 'La cursada tuvo ejercicios y evaluaciones claramente explicadas.',
};
const validExam = {
  year: 2026,
  session: 'JULIO',
  format: 'ORAL',
  difficulty: 'MEDIA',
  outcome: 'APROBADO',
  grade: 8,
  comment:
    'La mesa evaluó conceptos centrales y permitió justificar cada decisión.',
  isAnonymous: true,
};

@Injectable()
class AuthenticatedUnverifiedAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().user = {
      id: '10000000-0000-4000-8000-000000000001',
      emailVerified: false,
    };
    return true;
  }
}

describe('Subjects community write API rate limit', () => {
  let app: INestApplication<App>;

  const subjectsService = {
    createReview: jest.fn().mockResolvedValue({ id: REVIEW_ID }),
    updateReview: jest.fn().mockResolvedValue({ id: REVIEW_ID }),
    createExam: jest.fn().mockResolvedValue({ id: EXAM_ID }),
    updateExam: jest.fn().mockResolvedValue({ id: EXAM_ID }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'communityWrite', ttl: 60_000, limit: 3 },
        ]),
      ],
      controllers: [SubjectsController],
      providers: [
        CommunityWriteThrottlerGuard,
        { provide: SubjectsService, useValue: subjectsService },
        {
          provide: APP_GUARD,
          useClass: AuthenticatedUnverifiedAccountGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('acepta una cuenta autenticada no verificada y limita creaciones repetidas', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app.getHttpServer())
        .post('/subjects/ED-01/reviews')
        .send(validReview)
        .expect(201);
    }
    await request(app.getHttpServer())
      .post('/subjects/ED-01/reviews')
      .send(validReview)
      .expect(429);

    expect(subjectsService.createReview).toHaveBeenCalledWith(
      'ED-01',
      '10000000-0000-4000-8000-000000000001',
      validReview,
    );
  });

  it('limita ediciones repetidas de forma independiente', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app.getHttpServer())
        .put(`/subjects/reviews/${REVIEW_ID}`)
        .send(validReview)
        .expect(200);
    }
    await request(app.getHttpServer())
      .put(`/subjects/reviews/${REVIEW_ID}`)
      .send(validReview)
      .expect(429);
  });

  it('valida resultado, nota y dificultad general antes de crear un final', async () => {
    await request(app.getHttpServer())
      .post('/subjects/ED-01/exams')
      .send({ ...validExam, outcome: undefined, grade: 7 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/subjects/ED-01/exams')
      .send({ ...validExam, difficultyTheory: 4 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/subjects/ED-01/exams')
      .send(validExam)
      .expect(201);
    await request(app.getHttpServer())
      .post('/subjects/ED-01/exams')
      .send(validExam)
      .expect(429);

    expect(subjectsService.createExam).toHaveBeenCalledTimes(1);
    expect(subjectsService.createExam).toHaveBeenCalledWith(
      'ED-01',
      '10000000-0000-4000-8000-000000000001',
      expect.objectContaining({
        difficulty: 'MEDIA',
        outcome: 'APROBADO',
        grade: 8,
        isAnonymous: true,
      }),
    );
  });

  it('aplica el mismo contrato y rate limit al editar un final', async () => {
    await request(app.getHttpServer())
      .put(`/subjects/exams/${EXAM_ID}`)
      .send({ ...validExam, outcome: 'PREFIERO_NO_DECIR', grade: 7 })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/subjects/exams/${EXAM_ID}`)
      .send(validExam)
      .expect(200);
    await request(app.getHttpServer())
      .put(`/subjects/exams/${EXAM_ID}`)
      .send({ ...validExam, outcome: 'DESAPROBADO', grade: 3 })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/subjects/exams/${EXAM_ID}`)
      .send(validExam)
      .expect(429);

    expect(subjectsService.updateExam).toHaveBeenCalledTimes(2);
  });
});

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
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CommunityModerationController } from './community-moderation.controller';
import { CommunityModerationService } from './community-moderation.service';

const REVIEW_ID = '30000000-0000-4000-8000-000000000001';
const EXAM_ID = '30000000-0000-4000-8000-000000000002';
const USER_ID = '10000000-0000-4000-8000-000000000001';
const MODERATOR_ID = '10000000-0000-4000-8000-000000000002';
const MODERATION_ROLES = [Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN];

@Injectable()
class HeaderAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const requestContext = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string; role: Role };
    }>();
    const role = (requestContext.headers['x-test-role'] as Role) ?? Role.USER;
    requestContext.user = {
      id: role === Role.MODERATOR ? MODERATOR_ID : USER_ID,
      role,
    };
    return true;
  }
}

describe('CommunityModerationController', () => {
  let app: INestApplication<App>;

  const communityModerationService = {
    reportReview: jest.fn().mockResolvedValue({ id: 'report-review' }),
    reportExam: jest.fn().mockResolvedValue({ id: 'report-exam' }),
    getReviewManagementView: jest
      .fn()
      .mockResolvedValue({ id: REVIEW_ID, moderation: { isRemoved: false } }),
    getExamManagementView: jest
      .fn()
      .mockResolvedValue({ id: EXAM_ID, moderation: { isRemoved: false } }),
    listReports: jest.fn().mockResolvedValue([]),
    removeReview: jest.fn().mockResolvedValue({ id: 'action-remove-review' }),
    restoreReview: jest.fn().mockResolvedValue({ id: 'action-restore-review' }),
    removeExam: jest.fn().mockResolvedValue({ id: 'action-remove-exam' }),
    restoreExam: jest.fn().mockResolvedValue({ id: 'action-restore-exam' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'communityWrite', ttl: 60_000, limit: 3 },
        ]),
      ],
      controllers: [CommunityModerationController],
      providers: [
        CommunityWriteThrottlerGuard,
        RolesGuard,
        {
          provide: CommunityModerationService,
          useValue: communityModerationService,
        },
        { provide: APP_GUARD, useClass: HeaderAccountGuard },
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    'listReports',
    'removeReview',
    'restoreReview',
    'removeExam',
    'restoreExam',
  ] as const)('declara roles de moderación sobre %s', (method) => {
    const handler = CommunityModerationController.prototype[method];
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(MODERATION_ROLES);
  });

  it('acepta todos los motivos, exige explicación para Otro y limita reportes', async () => {
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/reports`)
      .send({ reason: 'SPAM_O_REPETIDO' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/reports`)
      .send({ reason: 'DATOS_PERSONALES' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/reports`)
      .send({ reason: 'OTRO', explanation: 'El motivo requiere más contexto.' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/reports`)
      .send({ reason: 'NO_RELACIONADO' })
      .expect(429);

    expect(communityModerationService.reportReview).toHaveBeenCalledTimes(3);
    expect(communityModerationService.reportReview).toHaveBeenLastCalledWith(
      REVIEW_ID,
      USER_ID,
      {
        reason: 'OTRO',
        explanation: 'El motivo requiere más contexto.',
      },
    );
  });

  it('rechaza Otro sin explicación antes de invocar el servicio', async () => {
    await request(app.getHttpServer())
      .post(`/subjects/exams/${EXAM_ID}/reports`)
      .send({ reason: 'OTRO' })
      .expect(400);

    expect(communityModerationService.reportExam).not.toHaveBeenCalled();
  });

  it('permite al propietario consultar el estado privado de su entrada', async () => {
    await request(app.getHttpServer())
      .get(`/subjects/reviews/${REVIEW_ID}/management`)
      .expect(200);

    expect(
      communityModerationService.getReviewManagementView,
    ).toHaveBeenCalledWith(REVIEW_ID, { id: USER_ID, role: Role.USER });
  });

  it('impide moderar a usuarios comunes y permite al moderador', async () => {
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/moderation/remove`)
      .send({ reason: 'Expone datos personales' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/subjects/reviews/${REVIEW_ID}/moderation/remove`)
      .set('x-test-role', Role.MODERATOR)
      .send({ reason: 'Expone datos personales' })
      .expect(201);

    expect(communityModerationService.removeReview).toHaveBeenCalledTimes(1);
    expect(communityModerationService.removeReview).toHaveBeenCalledWith(
      REVIEW_ID,
      MODERATOR_ID,
      { reason: 'Expone datos personales' },
    );
  });

  it('protege la cola de reportes con el mismo límite de roles', async () => {
    await request(app.getHttpServer())
      .get('/subjects/community/reports')
      .expect(403);
    await request(app.getHttpServer())
      .get('/subjects/community/reports')
      .set('x-test-role', Role.MODERATOR)
      .expect(200);

    expect(communityModerationService.listReports).toHaveBeenCalledTimes(1);
  });
});

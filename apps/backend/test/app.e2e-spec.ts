import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Public and guarded API contracts (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/ranking/levels is public', () => {
    return request(app.getHttpServer())
      .get('/api/v1/ranking/levels')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(expect.any(Array));
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('GET /api/v1/auth/me rejects an anonymous caller', () => {
    return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });
});

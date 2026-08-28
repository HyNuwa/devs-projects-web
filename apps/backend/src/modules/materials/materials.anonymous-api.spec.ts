import { INestApplication, Injectable } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

const MATERIAL_ID = '30000000-0000-4000-8000-000000000001';
const UNAUTHORIZED_RESPONSE = { message: 'Unauthorized', statusCode: 401 };

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'anonymous-api-contract-secret',
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}

describe('Materials anonymous API contract', () => {
  let app: INestApplication<App>;

  const materialsService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    download: jest.fn(),
    getRatings: jest.fn(),
    rate: jest.fn(),
    setHelpfulness: jest.fn(),
    setSaved: jest.fn(),
  };

  beforeAll(async () => {
    materialsService.findAll.mockResolvedValue({ data: [], meta: {} });
    materialsService.findById.mockResolvedValue({
      id: MATERIAL_ID,
      preview: {
        capability: 'PDF',
        canPreview: true,
        url: '/preview/material.pdf',
        downloadUrl: '/download/material.pdf',
        fallback: {
          reason: 'PREVIEW_FAILED',
          downloadUrl: '/download/material.pdf',
        },
      },
    });
    materialsService.download.mockResolvedValue({
      driveDownloadUrl: '/download/material.pdf',
      fileUrl: '/materials/material.pdf',
    });
    materialsService.getRatings.mockResolvedValue({ data: [], meta: {} });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [MaterialsController],
      providers: [
        Reflector,
        RolesGuard,
        TestJwtStrategy,
        { provide: MaterialsService, useValue: materialsService },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['búsqueda', () => request(app.getHttpServer()).get('/materials')],
    [
      'lectura con metadatos de preview',
      () => request(app.getHttpServer()).get(`/materials/${MATERIAL_ID}`),
    ],
    [
      'lectura de comentarios',
      () =>
        request(app.getHttpServer()).get(`/materials/${MATERIAL_ID}/ratings`),
    ],
  ])('permite %s sin autenticación', async (_label, makeRequest) => {
    await makeRequest().expect(200);
  });

  it('permite iniciar una descarga sin autenticación', async () => {
    await request(app.getHttpServer())
      .get(`/materials/${MATERIAL_ID}/download`)
      .expect(302)
      .expect('Location', '/download/material.pdf');
  });

  it.each([
    [
      'calificar',
      () =>
        request(app.getHttpServer())
          .post(`/materials/${MATERIAL_ID}/rate`)
          .send({ rating: 5 }),
    ],
    [
      'comentar',
      () =>
        request(app.getHttpServer())
          .post(`/materials/${MATERIAL_ID}/rate`)
          .send({ rating: 5, comment: 'Muy útil' }),
    ],
    [
      'marcar Me sirvió',
      () =>
        request(app.getHttpServer())
          .put(`/materials/${MATERIAL_ID}/helpfulness`)
          .send({ isHelpful: true }),
    ],
    [
      'guardar',
      () =>
        request(app.getHttpServer())
          .put(`/materials/${MATERIAL_ID}/saved`)
          .send({ isSaved: true }),
    ],
  ])('rechaza %s sin autenticación', async (_label, makeRequest) => {
    await makeRequest().expect(401).expect(UNAUTHORIZED_RESPONSE);
  });
});

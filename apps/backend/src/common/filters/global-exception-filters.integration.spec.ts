import { Controller, Get, NotFoundException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { Public } from '../decorators/public.decorator';
import { configureGlobalExceptionFilters } from './configure-global-exception-filters';

@Controller('filter-contract')
class FilterContractController {
  @Public()
  @Get('not-found')
  notFound(): never {
    throw new NotFoundException('Recurso inexistente');
  }

  @Public()
  @Get('internal-error')
  internalError(): never {
    throw new Error('internal filter test secret');
  }
}

describe('global exception filter chain', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [FilterContractController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api/v1');
    configureGlobalExceptionFilters(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps anonymous auth failures as 401 responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'UNAUTHORIZED',
      path: '/api/v1/auth/me',
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('keeps public not-found errors as 404 responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/filter-contract/not-found')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'Recurso inexistente',
      error: 'Not Found',
      path: '/api/v1/filter-contract/not-found',
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('keeps real internal errors opaque', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/filter-contract/internal-error')
      .expect(500);

    expect(response.body).toMatchObject({
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'Internal Server Error',
      path: '/api/v1/filter-contract/internal-error',
    });
    expect(response.body).not.toHaveProperty('stack');
    expect(JSON.stringify(response.body)).not.toContain(
      'internal filter test secret',
    );
  });
});

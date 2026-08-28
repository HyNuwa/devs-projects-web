import { INestApplication, Injectable, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'discovery-anonymous-api-contract-secret',
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}

describe('Discovery anonymous API contract', () => {
  let app: INestApplication<App>;

  const discoveryService = { getSuggestions: jest.fn() };

  beforeAll(async () => {
    discoveryService.getSuggestions.mockResolvedValue({
      subjects: [],
      materials: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [DiscoveryController],
      providers: [
        Reflector,
        TestJwtStrategy,
        { provide: DiscoveryService, useValue: discoveryService },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite sugerencias sin autenticación y conserva los grupos vacíos', async () => {
    await request(app.getHttpServer())
      .get('/discovery/suggestions?q=%20%C3%81lgebra%20&limit=3')
      .expect(200)
      .expect({ subjects: [], materials: [] });

    expect(discoveryService.getSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'Álgebra', limit: 3 }),
    );
  });

  it.each([
    '/discovery/suggestions',
    '/discovery/suggestions?q=%20%20%20',
    '/discovery/suggestions?q=algebra&limit=11',
  ])('rechaza la consulta inválida %s', async (path) => {
    await request(app.getHttpServer()).get(path).expect(400);
  });
});

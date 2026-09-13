import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';

import { configureHttpMiddleware } from './http-security';

@Module({})
class StaticAssetsTestModule {}

describe('static upload security headers', () => {
  const frontendOrigin = 'http://localhost:3000';
  let app: NestExpressApplication;
  let publicDirectory: string;

  beforeEach(async () => {
    publicDirectory = await mkdtemp(
      join(tmpdir(), 'devsproject-static-assets-'),
    );
    const uploadsDirectory = join(publicDirectory, 'uploads');
    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(join(uploadsDirectory, 'preview.pdf'), 'preview fixture');

    app = await NestFactory.create<NestExpressApplication>(
      StaticAssetsTestModule,
      {
        logger: false,
      },
    );
    configureHttpMiddleware(app, {
      corsOrigin: frontendOrigin,
      publicDirectory,
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(publicDirectory, { force: true, recursive: true });
  });

  it('allows a configured frontend to load an uploaded preview without weakening other headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/uploads/preview.pdf')
      .set('Origin', frontendOrigin);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      frontendOrigin,
    );
    expect(response.headers['cross-origin-resource-policy']).toBe(
      'cross-origin',
    );
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

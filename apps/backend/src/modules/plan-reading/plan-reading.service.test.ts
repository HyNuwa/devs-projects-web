import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ModelOutput } from './plan-model';
import {
  PlanReadingService,
  startOfArgentinaDay,
} from './plan-reading.service';

describe('startOfArgentinaDay', () => {
  it('starts the day at 03:00 UTC', () => {
    expect(
      startOfArgentinaDay(new Date('2026-10-15T03:00:00Z')).toISOString(),
    ).toBe('2026-10-15T03:00:00.000Z');
    expect(
      startOfArgentinaDay(new Date('2026-10-15T23:59:00Z')).toISOString(),
    ).toBe('2026-10-15T03:00:00.000Z');
  });

  it('keeps the previous day before 03:00 UTC', () => {
    expect(
      startOfArgentinaDay(new Date('2026-10-15T02:59:59Z')).toISOString(),
    ).toBe('2026-10-14T03:00:00.000Z');
    expect(
      startOfArgentinaDay(new Date('2027-01-01T01:00:00Z')).toISOString(),
    ).toBe('2026-12-31T03:00:00.000Z');
  });
});

describe('PlanReadingService', () => {
  const planUrl = 'https://exactas.unsa.edu.ar/lf.pdf';
  const reader = (output: ModelOutput) => {
    const prisma = {
      career: {
        findUnique: vi.fn().mockResolvedValue({
          name: 'Licenciatura en Física',
          status: 'DRAFT',
          planUrl,
          faculty: { name: 'Exactas', university: { name: 'UNSa' } },
        }),
      },
      moderationEvent: { count: vi.fn().mockResolvedValue(0) },
    };
    const catalog = { record: vi.fn().mockResolvedValue(undefined) };
    const fetcher = {
      fetch: vi.fn().mockResolvedValue({
        url: planUrl,
        kind: 'pdf',
        body: Buffer.from('%PDF-1.7'),
      }),
    };
    const model = { name: 'fake', extract: vi.fn().mockResolvedValue(output) };
    const service = new PlanReadingService(
      prisma as never,
      catalog as never,
      fetcher,
      model,
      { daily: 100 },
    );
    return { service, record: catalog.record };
  };

  it('ends as PLAN_NOT_FOUND when no materia survives validation', async () => {
    const { service, record } = reader({
      materias: Array.from({ length: 30 }, (_, i) => ({
        year: null,
        cuatrimestre: null,
        optativa: false,
        nombre: `Materia ${i}`,
        creditos: null,
      })),
      notices: [],
      planLinkIndex: null,
    });

    const error: unknown = await service.read('u-admin', 'c-lf').then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(422);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: 'PLAN_NOT_FOUND',
    });
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.anything(),
      'u-admin',
      'CATALOG_PLAN_READ',
      expect.objectContaining({
        after: expect.objectContaining({
          lines: 0,
          notices: 0,
          error: 'PLAN_NOT_FOUND',
        }),
      }),
    );
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateReportDto } from './create-report.dto';

const base = {
  targetType: 'MATERIAL',
  targetId: '30000000-0000-4000-8000-000000000001',
};

async function errorsFor(body: Record<string, unknown>) {
  const errors = await validate(
    plainToInstance(CreateReportDto, { ...base, ...body }),
  );
  return errors.map((error) => error.property);
}

describe('CreateReportDto', () => {
  it('accepts a fixed reason without explanation', async () => {
    expect(await errorsFor({ reason: 'SPAM_O_REPETIDO' })).toEqual([]);
  });

  it('requires an explanation for «Otro»', async () => {
    expect(await errorsFor({ reason: 'OTRO' })).toEqual(['explanation']);
    expect(
      await errorsFor({ reason: 'OTRO', explanation: 'Es publicidad' }),
    ).toEqual([]);
  });

  it('limits the explanation to 1000 characters', async () => {
    expect(
      await errorsFor({ reason: 'OTRO', explanation: 'x'.repeat(1001) }),
    ).toEqual(['explanation']);
  });

  it('refuses an unknown reason or target type', async () => {
    expect(await errorsFor({ reason: 'ME_CAE_MAL' })).toEqual(['reason']);
    expect(
      await errorsFor({
        reason: 'OTRO',
        explanation: 'x',
        targetType: 'EVENT',
      }),
    ).toEqual(['targetType']);
  });
});

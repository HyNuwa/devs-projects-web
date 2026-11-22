import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsOptional, validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { StrictBoolean } from './strict-boolean';

class RequiredFlagDto {
  @StrictBoolean()
  flag: boolean;
}

class OptionalFlagDto {
  @IsOptional()
  @StrictBoolean()
  flag?: boolean;
}

async function errorsFor(
  cls: new () => object,
  plain: Record<string, unknown>,
) {
  const instance = plainToInstance(cls, plain, {
    enableImplicitConversion: true,
  });
  return validate(instance);
}

describe('StrictBoolean', () => {
  it.each([true, false])('accepts the JSON boolean %s', async (value) => {
    expect(await errorsFor(RequiredFlagDto, { flag: value })).toEqual([]);
  });

  it.each(['false', 'true', 1, 0, null])(
    'refuses %j instead of coercing it',
    async (value) => {
      const errors = await errorsFor(RequiredFlagDto, { flag: value });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('flag');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    },
  );

  it('keeps the raw value on the instance', () => {
    const instance = plainToInstance(
      RequiredFlagDto,
      { flag: 'false' },
      { enableImplicitConversion: true },
    );
    expect(instance.flag).toBe('false');
  });

  it('accepts an omitted field when it is optional', async () => {
    expect(await errorsFor(OptionalFlagDto, {})).toEqual([]);
  });

  it('still refuses a string on an optional field', async () => {
    const errors = await errorsFor(OptionalFlagDto, { flag: 'false' });
    expect(errors[0]?.constraints).toHaveProperty('isBoolean');
  });
});

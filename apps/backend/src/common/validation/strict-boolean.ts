import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/**
 * A body boolean that accepts only JSON `true` or `false`. Implicit conversion
 * would turn `"false"` or `1` into `true` before `@IsBoolean()` sees it, so the
 * raw value is restored first. Pair it with `@IsOptional()` when the field may
 * be omitted.
 */
export function StrictBoolean() {
  return applyDecorators(
    Transform(
      ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
    ),
    IsBoolean(),
  );
}

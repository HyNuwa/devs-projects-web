import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
  DiscoverySuggestionsQueryDto,
  MAX_DISCOVERY_SUGGESTION_LIMIT,
} from './discovery-suggestions-query.dto';

async function errorsFor(input: Record<string, unknown>) {
  return validate(plainToInstance(DiscoverySuggestionsQueryDto, input));
}

describe('DiscoverySuggestionsQueryDto', () => {
  it('normaliza el texto superficial y aplica el límite predeterminado', async () => {
    const dto = plainToInstance(DiscoverySuggestionsQueryDto, {
      q: '  Álgebra lineal  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.q).toBe('Álgebra lineal');
    expect(dto.limit).toBe(DEFAULT_DISCOVERY_SUGGESTION_LIMIT);
  });

  it('transforma un límite permitido a número', async () => {
    const dto = plainToInstance(DiscoverySuggestionsQueryDto, {
      q: 'algoritmos',
      limit: '4',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.limit).toBe(4);
  });

  it.each([
    {},
    { q: '   ' },
    { q: 'x'.repeat(121) },
    { q: 'algoritmos', limit: 0 },
    { q: 'algoritmos', limit: MAX_DISCOVERY_SUGGESTION_LIMIT + 1 },
    { q: 'algoritmos', limit: 1.5 },
  ])('rechaza una consulta fuera del contrato: %j', async (input) => {
    await expect(errorsFor(input)).resolves.not.toHaveLength(0);
  });
});

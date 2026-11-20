import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { UpdateProfileDto } from '../../modules/users/dto/update-profile.dto';
import { isReservedName } from './reserved-name';

/**
 * «Anónimo» is how anonymous entries are shown, so no account may use it as a
 * username or display name (openspec reputation/public-profile).
 */
describe('reserved names', () => {
  it.each(['Anónimo', 'anonimo', '  ANÓNIMA ', 'Anonymous', 'anónime'])(
    'reserves %s',
    (name) => {
      expect(isReservedName(name)).toBe(true);
    },
  );

  it.each(['anonimo_fi', 'vale', 'Anónimos del pasillo'])(
    'allows %s',
    (name) => {
      expect(isReservedName(name)).toBe(false);
    },
  );

  const errors = async <T extends object>(type: new () => T, data: object) =>
    (await validate(plainToInstance(type, data))).map(
      (error) => error.property,
    );

  it('rejects a reserved username at registration', async () => {
    const valid = { email: 'a@example.com', password: 'Clave123!x' };

    expect(
      await errors(RegisterDto, { ...valid, username: 'Anónimo' }),
    ).toEqual(['username']);
    expect(await errors(RegisterDto, { ...valid, username: 'vale' })).toEqual(
      [],
    );
  });

  it('rejects a reserved display name', async () => {
    expect(await errors(UpdateProfileDto, { displayName: 'anonimo' })).toEqual([
      'displayName',
    ]);
    expect(await errors(UpdateProfileDto, { displayName: 'Vale' })).toEqual([]);
  });
});

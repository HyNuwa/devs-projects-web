import { beforeEach, describe, expect, it, vi } from 'vitest';

const bcryptCalls = vi.hoisted(() => ({
  hash: [] as Array<[string, number]>,
  compare: [] as Array<[string, string]>,
}));

vi.mock('bcrypt', async () => {
  const real = await vi.importActual<typeof import('bcrypt')>('bcrypt');
  return {
    // Real hashing at a low cost keeps the test fast; the requested cost is recorded.
    hash: vi.fn((data: string, rounds: number) => {
      bcryptCalls.hash.push([data, rounds]);
      return real.hash(data, 4);
    }),
    compare: vi.fn((data: string, encrypted: string) => {
      bcryptCalls.compare.push([data, encrypted]);
      return real.compare(data, encrypted);
    }),
  };
});

import { PASSWORD_HASH_ROUNDS, PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  beforeEach(() => {
    bcryptCalls.hash.length = 0;
    bcryptCalls.compare.length = 0;
  });

  it('uses the cost of real passwords', () => {
    expect(PASSWORD_HASH_ROUNDS).toBe(12);
  });

  it('prepares the stand-in hash once, in onModuleInit, with the real cost', async () => {
    const hasher = new PasswordHasher();
    expect(bcryptCalls.hash).toHaveLength(0);

    await hasher.onModuleInit();
    expect(bcryptCalls.hash).toHaveLength(1);
    expect(bcryptCalls.hash[0][1]).toBe(PASSWORD_HASH_ROUNDS);

    await hasher.verify('una-clave', null);
    await hasher.verify('otra-clave', null);
    expect(bcryptCalls.hash).toHaveLength(1);
  });

  it('checks an unknown account against the stand-in hash and refuses it', async () => {
    const hasher = new PasswordHasher();
    await hasher.onModuleInit();

    // Even the stand-in's own random input is not accepted without an account.
    const standInInput = bcryptCalls.hash[0][0];
    await expect(hasher.verify(standInInput, null)).resolves.toBe(false);
    await expect(hasher.verify('una-clave', null)).resolves.toBe(false);

    expect(bcryptCalls.compare).toHaveLength(2);
    const [, standIn] = bcryptCalls.compare[1];
    expect(standIn).toMatch(/^\$2[aby]\$/);
    expect(bcryptCalls.compare[0][1]).toBe(standIn);
  });

  it('matches and refuses a real hash', async () => {
    const hasher = new PasswordHasher();
    await hasher.onModuleInit();
    const hash = await hasher.hash('ClaveCorrecta1!');
    expect(bcryptCalls.hash.at(-1)).toEqual([
      'ClaveCorrecta1!',
      PASSWORD_HASH_ROUNDS,
    ]);

    await expect(hasher.verify('ClaveCorrecta1!', hash)).resolves.toBe(true);
    await expect(hasher.verify('Incorrecta1!', hash)).resolves.toBe(false);
    expect(bcryptCalls.compare.at(-1)).toEqual(['Incorrecta1!', hash]);
  });

  it('refuses to check before the stand-in hash is ready', async () => {
    await expect(
      new PasswordHasher().verify('una-clave', null),
    ).rejects.toThrow();
  });
});

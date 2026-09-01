import { describe, expect, it } from 'vitest';

import { loginHrefForReturnPath, safeReturnPath } from './auth-return-path';

describe('auth return paths', () => {
  it('preserves a local material preview path through sign-in', () => {
    const returnPath =
      '/materiales/ingenieria-informatica/2/algoritmos?q=pilas&archivo=material-2#comentarios';

    expect(safeReturnPath(returnPath)).toBe(returnPath);
    expect(loginHrefForReturnPath(returnPath)).toBe(
      '/auth/login?redirect=%2Fmateriales%2Fingenieria-informatica%2F2%2Falgoritmos%3Fq%3Dpilas%26archivo%3Dmaterial-2%23comentarios',
    );
  });

  it.each(['https://untrusted.example/materiales', '//untrusted.example', '/\\untrusted'])(
    'rejects an external or malformed return path: %s',
    (candidate) => {
      expect(safeReturnPath(candidate)).toBe('/');
    },
  );
});

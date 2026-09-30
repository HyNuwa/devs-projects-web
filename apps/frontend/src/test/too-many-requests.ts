/** A 429 from the API as axios rejects it (openspec security/rate-limiting). */
export const TOO_MANY_REQUESTS_MESSAGE = 'Demasiados intentos. Probá de nuevo en 14 minutos';

export const tooManyRequests = () => ({
  response: {
    status: 429,
    headers: { 'retry-after': '840' },
    data: {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: TOO_MANY_REQUESTS_MESSAGE,
      retryAfter: 840,
    },
  },
});

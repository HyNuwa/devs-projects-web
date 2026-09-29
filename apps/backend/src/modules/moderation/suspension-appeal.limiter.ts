import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Attempts per client at «Apelar esta suspensión», which checks credentials the
 * same way sign-in does. In memory and per process: enough to slow down guessing.
 */
@Injectable()
export class SuspensionAppealLimiter {
  private readonly attempts = new Map<string, number[]>();

  hit(client: string, now = Date.now()) {
    const recent = (this.attempts.get(client) ?? []).filter(
      (at) => now - at < WINDOW_MS,
    );
    if (recent.length >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Demasiados intentos. Probá de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.attempts.set(client, recent);
  }
}

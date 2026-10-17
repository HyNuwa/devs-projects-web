import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

/** bcrypt cost of every stored password, and of the stand-in hash. */
export const PASSWORD_HASH_ROUNDS = 12;

/**
 * Every credential check goes through `verify`, so none can skip the hash
 * comparison for an email with no account (openspec security/authentication).
 */
@Injectable()
export class PasswordHasher implements OnModuleInit {
  private standInHash: string | null = null;

  /** Prepared before the app takes requests, so no request pays for it. */
  async onModuleInit() {
    // A random input nobody knows: no password can match it.
    this.standInHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      PASSWORD_HASH_ROUNDS,
    );
  }

  hash(password: string) {
    return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  }

  /** With no account (`null`), checks against the stand-in hash and refuses. */
  async verify(password: string, hash: string | null) {
    if (!this.standInHash) {
      throw new Error('PasswordHasher used before onModuleInit');
    }
    const matches = await bcrypt.compare(password, hash ?? this.standInHash);
    return hash !== null && matches;
  }
}

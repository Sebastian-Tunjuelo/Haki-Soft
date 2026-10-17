import { Injectable } from '@nestjs/common';

const TTL_MS = 24 * 60 * 60 * 1000;

interface IdempotencyEntry {
  response: unknown;
  statusCode: number;
  expiresAt: number;
}

/**
 * Deduplicación de POST con Idempotency-Key (SPEC-04 §7.2).
 * En memoria hasta que exista Redis/BullMQ en SPEC posteriores.
 */
@Injectable()
export class IdempotencyStore {
  private readonly entries = new Map<string, IdempotencyEntry>();

  get(scope: string, key: string): IdempotencyEntry | null {
    this.purgeExpired();
    const entry = this.entries.get(this.compose(scope, key));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(this.compose(scope, key));
      return null;
    }
    return entry;
  }

  set(scope: string, key: string, statusCode: number, response: unknown): void {
    this.entries.set(this.compose(scope, key), {
      statusCode,
      response,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  private compose(scope: string, key: string): string {
    return `${scope}:${key}`;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(id);
    }
  }
}

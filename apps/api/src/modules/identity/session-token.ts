import { createHmac, timingSafeEqual } from 'node:crypto';

const DEV_SESSION_SECRET = 'taskstream-local-session-dev-only';
const WEEK_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET || DEV_SESSION_SECRET;
}

export function signSession(userId: string, ttlSeconds = WEEK_SECONDS): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }),
  ).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSessionUserId(token: string): string | null {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: unknown; exp?: unknown };
    if (typeof data.sub !== 'string' || data.sub.length === 0) return null;
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

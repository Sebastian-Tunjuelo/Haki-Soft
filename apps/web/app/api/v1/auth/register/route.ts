import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/src/lib/identity-proxy';

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

const WEEK_SECONDS = 60 * 60 * 24 * 7;

async function forwardCredentials(path: string, body: string): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ code: 'API_UNREACHABLE' }, { status: 502 });
  }

  const text = await upstream.text();
  let payload: Record<string, unknown> | null = null;
  try {
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    payload = null;
  }

  const token = typeof payload?.token === 'string' ? payload.token : null;
  const clientBody = payload ? { ...payload } : {};
  delete clientBody.token;
  const response = NextResponse.json(clientBody, { status: upstream.status });
  if (upstream.ok && token) {
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: WEEK_SECONDS,
    });
  }
  return response;
}

export async function POST(request: Request): Promise<NextResponse> {
  return forwardCredentials('/api/v1/auth/register', await request.text());
}

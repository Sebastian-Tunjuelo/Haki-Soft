import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'taskstream_session';

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

export async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function proxyIdentity(path: string, init?: { method?: string; body?: string }): Promise<Response> {
  const token = await readSessionToken();
  if (!token) {
    return Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    return await fetch(`${apiBase()}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body,
      cache: 'no-store',
    });
  } catch {
    return Response.json({ code: 'API_UNREACHABLE' }, { status: 502 });
  }
}

export async function readMyJson(
  path: string,
  init?: { method?: string; body?: string },
): Promise<{ status: number; body: unknown }> {
  const upstream = await proxyIdentity(path, init);
  const text = await upstream.text();
  try {
    return { status: upstream.status, body: text ? JSON.parse(text) : null };
  } catch {
    return { status: upstream.status, body: null };
  }
}

export function passthrough(upstream: Response, text: string): Response {
  return new Response(text.length > 0 ? text : '{}', {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function hasLocalSession(): Promise<boolean> {
  const result = await readMyJson('/api/v1/auth/session');
  return result.status < 400;
}

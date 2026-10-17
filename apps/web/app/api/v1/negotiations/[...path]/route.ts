import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/src/lib/identity-proxy';

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

async function proxy(request: Request, pathParts: string[]): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const target = `${apiBase()}/api/v1/negotiations/${pathParts.join('/')}${new URL(request.url).search}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  try {
    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    const text = await upstream.text();
    return new Response(text.length > 0 ? text : '{}', {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return Response.json({ code: 'API_UNREACHABLE' }, { status: 502 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx): Promise<Response> {
  return proxy(request, (await ctx.params).path);
}

export async function POST(request: Request, ctx: Ctx): Promise<Response> {
  return proxy(request, (await ctx.params).path);
}

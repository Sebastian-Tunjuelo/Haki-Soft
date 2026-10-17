function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

/** Proxy público del webhook Rafiki (sin sesión de usuario). */
export async function POST(request: Request): Promise<Response> {
  const target = `${apiBase()}/api/v1/webhooks/rafiki`;
  try {
    const body = await request.text();
    const headers: Record<string, string> = { Accept: 'application/json' };
    const contentType = request.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    const authorization = request.headers.get('authorization');
    if (authorization) headers.Authorization = authorization;

    const upstream = await fetch(target, {
      method: 'POST',
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

import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/src/lib/identity-proxy';

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

/** Proxy SSE: notificaciones de solicitud de trabajo al Freelancer. */
export async function GET(): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${apiBase()}/api/v1/orders/activity/stream`, {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return new Response(text || JSON.stringify({ code: 'STREAM_UNAVAILABLE' }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return Response.json({ code: 'API_UNREACHABLE' }, { status: 502 });
  }
}

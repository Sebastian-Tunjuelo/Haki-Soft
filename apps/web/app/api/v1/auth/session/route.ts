import { passthrough, proxyIdentity } from '@/src/lib/identity-proxy';

export async function GET(): Promise<Response> {
  const upstream = await proxyIdentity('/api/v1/auth/session');
  return passthrough(upstream, await upstream.text());
}

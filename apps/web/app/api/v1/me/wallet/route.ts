import { passthrough, proxyIdentity } from '@/src/lib/identity-proxy';

export async function GET() {
  const upstream = await proxyIdentity('/api/v1/me/wallet');
  return passthrough(upstream, await upstream.text());
}

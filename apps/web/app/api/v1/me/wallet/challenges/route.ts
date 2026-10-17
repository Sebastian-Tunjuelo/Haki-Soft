import { passthrough, proxyIdentity } from '@/src/lib/identity-proxy';

export async function POST(request: Request) {
  const upstream = await proxyIdentity('/api/v1/me/wallet/challenges', {
    method: 'POST',
    body: await request.text(),
  });
  return passthrough(upstream, await upstream.text());
}

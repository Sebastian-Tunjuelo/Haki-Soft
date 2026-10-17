import { passthrough, proxyIdentity } from '@/src/lib/identity-proxy';

type Ctx = { params: Promise<{ taskId: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const upstream = await proxyIdentity(`/api/v1/me/delivery-notices/${taskId}`, {
    method: 'DELETE',
  });
  return passthrough(upstream, await upstream.text());
}

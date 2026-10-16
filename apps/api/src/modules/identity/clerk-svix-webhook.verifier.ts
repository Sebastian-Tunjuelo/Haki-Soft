import { Injectable } from '@nestjs/common';
import { verifyWebhook } from '@clerk/express/webhooks';
import { DomainError } from './domain-error';
import type { ClerkWebhookVerifier } from './identity.types';

@Injectable()
export class ClerkSvixWebhookVerifier implements ClerkWebhookVerifier {
  async verify(req: { rawBody?: Buffer; body?: unknown; headers: Record<string, unknown> }): Promise<{
    type: string;
    data: Record<string, unknown>;
  }> {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret || !req.rawBody) {
      throw new DomainError(401, 'CLERK_WEBHOOK_INVALID_SIGNATURE');
    }
    try {
      const event = await verifyWebhook(Object.assign(req, { body: req.rawBody }) as never, {
        signingSecret: secret,
      });
      const data = event.data;
      if (!data || typeof data !== 'object') {
        throw new DomainError(400, 'CLERK_USER_EMAIL_REQUIRED');
      }
      return { type: event.type, data: data as unknown as Record<string, unknown> };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError(401, 'CLERK_WEBHOOK_INVALID_SIGNATURE');
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { ActiveModeSwitchSchema } from '@taskstream/shared-schemas';
import { DomainError } from './domain-error';
import { IDENTITY_REPOSITORY } from './identity.tokens';
import type { ActiveMode, IdentityRepository, StoredUser } from './identity.types';

@Injectable()
export class IdentityService {
  constructor(@Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository) {}

  async syncClerkEvent(event: { type: string; data: Record<string, unknown> }): Promise<
    | { code: 'CLERK_EVENT_IGNORED' }
    | { code: 'CLERK_USER_SYNCED'; clerkId: string; activeMode: ActiveMode }
    | { code: 'CLERK_USER_ALREADY_SYNCED'; clerkId: string }
  > {
    if (event.type !== 'user.created' && event.type !== 'user.updated') {
      return { code: 'CLERK_EVENT_IGNORED' };
    }
    const parsed = readClerkUser(event.data);
    if (!parsed) {
      throw new DomainError(400, 'CLERK_USER_EMAIL_REQUIRED');
    }
    const result = await this.repository.upsertClerkUser(parsed);
    if (!result.created) {
      return { code: 'CLERK_USER_ALREADY_SYNCED', clerkId: result.user.clerkId };
    }
    return { code: 'CLERK_USER_SYNCED', clerkId: result.user.clerkId, activeMode: result.user.activeMode };
  }

  async switchMode(clerkUserId: string, body: unknown): Promise<{ activeMode: ActiveMode }> {
    const parsed = ActiveModeSwitchSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'ACTIVE_MODE_INVALID');
    }
    const user = await this.repository.setActiveMode(clerkUserId, parsed.data.activeMode);
    if (!user) {
      throw new DomainError(404, 'USER_NOT_SYNCED');
    }
    return { activeMode: user.activeMode };
  }

  async readMode(clerkUserId: string): Promise<{ activeMode: ActiveMode }> {
    const user = await this.requireUser(clerkUserId);
    return { activeMode: user.activeMode };
  }

  async requireUser(clerkUserId: string): Promise<StoredUser> {
    const user = await this.repository.findUserByClerkId(clerkUserId);
    if (!user) {
      throw new DomainError(404, 'USER_NOT_SYNCED');
    }
    return user;
  }
}

function readClerkUser(data: Record<string, unknown>): {
  clerkId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
} | null {
  const clerkId = typeof data.id === 'string' ? data.id : '';
  const email = primaryEmail(data);
  if (!clerkId || !email) return null;
  const firstName = typeof data.first_name === 'string' ? data.first_name.trim() : '';
  const lastName = typeof data.last_name === 'string' ? data.last_name.trim() : '';
  const combined = `${firstName} ${lastName}`.trim();
  const displayName = (combined || email.split('@')[0] || 'user').slice(0, 100);
  const avatarUrl = typeof data.image_url === 'string' ? data.image_url : null;
  return { clerkId, email, displayName, avatarUrl, countryCode: readCountry(data.public_metadata) };
}

function primaryEmail(data: Record<string, unknown>): string | null {
  const addresses = Array.isArray(data.email_addresses) ? data.email_addresses : [];
  const primaryId = typeof data.primary_email_address_id === 'string' ? data.primary_email_address_id : null;
  const rows = addresses.filter((item): item is { id?: string; email_address?: string } => !!item && typeof item === 'object');
  const primary = rows.find((item) => item.id === primaryId) ?? rows[0];
  return typeof primary?.email_address === 'string' && primary.email_address.includes('@') ? primary.email_address : null;
}

function readCountry(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as { countryCode?: unknown }).countryCode;
  if (typeof value !== 'string' || !/^[A-Za-z]{2}$/.test(value)) return null;
  return value.toUpperCase();
}

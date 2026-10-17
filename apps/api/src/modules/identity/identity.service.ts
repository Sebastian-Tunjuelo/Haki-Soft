import { Inject, Injectable } from '@nestjs/common';
import { ActiveModeSwitchSchema, LocalLoginSchema, LocalRegisterSchema } from '@taskstream/shared-schemas';
import { DomainError } from './domain-error';
import { IDENTITY_REPOSITORY } from './identity.tokens';
import type { ActiveMode, IdentityRepository, StoredUser } from './identity.types';
import { hashPassword, verifyPassword } from './password';
import { signSession } from './session-token';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  countryCode: string;
  activeMode: ActiveMode;
}

@Injectable()
export class IdentityService {
  constructor(@Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository) {}

  async register(body: unknown): Promise<{ token: string; user: PublicUser }> {
    const parsed = LocalRegisterSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'AUTH_INPUT_INVALID');
    }
    const user = await this.repository.createLocalUser({
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      displayName: parsed.data.displayName,
      countryCode: (parsed.data.countryCode ?? 'CO').toUpperCase(),
    });
    return { token: signSession(user.id), user: publicUser(user) };
  }

  async login(body: unknown): Promise<{ token: string; user: PublicUser }> {
    const parsed = LocalLoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'AUTH_INPUT_INVALID');
    }
    const found = await this.repository.findUserByEmail(parsed.data.email.toLowerCase());
    if (!found || !(await verifyPassword(parsed.data.password, found.passwordHash))) {
      throw new DomainError(401, 'INVALID_CREDENTIALS');
    }
    return { token: signSession(found.user.id), user: publicUser(found.user) };
  }

  async readSession(userId: string): Promise<{ user: PublicUser }> {
    const user = await this.requireUser(userId);
    return { user: publicUser(user) };
  }

  async switchMode(userId: string, body: unknown): Promise<{ activeMode: ActiveMode }> {
    const parsed = ActiveModeSwitchSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'ACTIVE_MODE_INVALID');
    }
    const user = await this.repository.setActiveMode(userId, parsed.data.activeMode);
    if (!user) {
      throw new DomainError(404, 'USER_NOT_SYNCED');
    }
    return { activeMode: user.activeMode };
  }

  async readMode(userId: string): Promise<{ activeMode: ActiveMode }> {
    const user = await this.requireUser(userId);
    return { activeMode: user.activeMode };
  }

  async requireUser(userId: string): Promise<StoredUser> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new DomainError(404, 'USER_NOT_SYNCED');
    }
    return user;
  }
}

function publicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    countryCode: user.countryCode,
    activeMode: user.activeMode,
  };
}

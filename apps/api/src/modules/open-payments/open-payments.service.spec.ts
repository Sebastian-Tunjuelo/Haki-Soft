import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpenPaymentsClientError, type AuthenticatedClient, type UnauthenticatedClient } from '@interledger/open-payments';
import { describe, expect, it } from 'vitest';
import { DomainError } from '../identity/domain-error';
import type { Clock } from '../identity/identity.types';
import {
  OpenPaymentsService,
  readPlatformPrivateKey,
  SdkOpenPaymentsClientFactory,
  SUBJECT_GRANT_TTL_MS,
  type OpenPaymentsClientFactory,
} from './open-payments.service';

const NOW = new Date('2026-10-16T12:00:00.000Z');
const WALLET = 'https://ilp.interledger-test.dev/ada';
const clock: Clock = { now: () => NOW };

function serviceWith(factory: OpenPaymentsClientFactory): OpenPaymentsService {
  return new OpenPaymentsService(factory, clock);
}

describe('OpenPaymentsService', () => {
  it('discovers a public wallet without the platform key', async () => {
    let authenticatedCalls = 0;
    const factory: OpenPaymentsClientFactory = {
      async unauthenticated() {
        return {
          walletAddress: {
            async get({ url }) {
              return {
                id: url,
                authServer: 'https://auth.example.test',
                resourceServer: 'https://ilp.example.test',
                assetCode: 'COP',
                assetScale: 2,
              };
            },
          },
        } as UnauthenticatedClient;
      },
      async authenticated() {
        authenticatedCalls += 1;
        throw new Error('discovery must stay unauthenticated');
      },
    };

    const discovered = await serviceWith(factory).discover(WALLET);

    expect(authenticatedCalls).toBe(0);
    expect(discovered).toEqual({
      walletAddress: WALLET,
      authServer: 'https://auth.example.test',
      resourceServer: 'https://ilp.example.test',
      assetCode: 'COP',
      assetScale: 2,
    });
  });

  it('maps a missing wallet to WALLET_ADDRESS_NOT_FOUND', async () => {
    const factory: OpenPaymentsClientFactory = {
      async unauthenticated() {
        return {
          walletAddress: {
            async get() {
              throw new OpenPaymentsClientError('missing wallet', { description: 'not found', status: 404 });
            },
          },
        } as unknown as UnauthenticatedClient;
      },
      async authenticated() {
        throw new Error('unused');
      },
    };

    await expect(serviceWith(factory).discover(WALLET)).rejects.toEqual(new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND'));
  });

  it('requests a subject grant and reads a string finish nonce', async () => {
    const captured: Array<{ url: string; body: unknown }> = [];
    const factory = grantFactory({
      async request({ url }, body) {
        captured.push({ url, body });
        return {
          interact: { redirect: 'https://wallet.example.test/interact', finish: 'finish-nonce-fixed' },
          continue: { uri: 'https://auth.example.test/continue', access_token: { value: 'continue-token' } },
        };
      },
    });

    const session = await serviceWith(factory).beginSubjectGrant({
      walletAddress: WALLET,
      authServer: 'https://auth.example.test',
      callbackUrl: 'https://api.example.test/api/v1/auth/wallet/callback?challengeId=abc',
    });

    expect(captured).toEqual([
      {
        url: 'https://auth.example.test',
        body: {
          subject: { sub_ids: [{ id: WALLET, format: 'uri' }] },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: 'https://api.example.test/api/v1/auth/wallet/callback?challengeId=abc',
              nonce: session.clientNonce,
            },
          },
        },
      },
    ]);
    expect(session.clientNonce.length).toBeGreaterThan(20);
    expect(session).toMatchObject({
      finishNonce: 'finish-nonce-fixed',
      continueUri: 'https://auth.example.test/continue',
      continueAccessToken: 'continue-token',
      interactRedirectUri: 'https://wallet.example.test/interact',
      expiresAt: new Date(NOW.getTime() + SUBJECT_GRANT_TTL_MS),
    });
    expect(JSON.stringify(captured[0]?.body)).not.toContain('access_token');
  });

  it('accepts an object finish nonce and rejects a grant that skipped interaction', async () => {
    const withObject = grantFactory({
      async request() {
        return {
          interact: { redirect: 'https://wallet.example.test/interact', finish: { nonce: 'from-object' } },
          continue: { uri: 'https://auth.example.test/continue', access_token: { value: 'continue-token' } },
        } as unknown as Awaited<ReturnType<AuthenticatedClient['grant']['request']>>;
      },
    });
    const session = await serviceWith(withObject).beginSubjectGrant({
      walletAddress: WALLET,
      authServer: 'https://auth.example.test',
      callbackUrl: 'https://api.example.test/callback',
    });
    expect(session.finishNonce).toBe('from-object');

    const immediate = grantFactory({
      async request() {
        return {
          access_token: {
            value: 'should-not-happen',
            manage: 'https://auth.example.test/token',
            expires_in: 60,
            access: [],
          },
          continue: { uri: 'https://auth.example.test/continue', access_token: { value: 'continue-token' } },
        };
      },
    });
    await expect(
      serviceWith(immediate).beginSubjectGrant({
        walletAddress: WALLET,
        authServer: 'https://auth.example.test',
        callbackUrl: 'https://api.example.test/callback',
      }),
    ).rejects.toEqual(new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_PENDING'));
  });

  it('returns the confirmed subject and fails when the grant has none', async () => {
    const confirmed = grantFactory({
      async request() {
        throw new Error('unused');
      },
      async continue(_args, body) {
        expect(body).toEqual({ interact_ref: 'interact-ref-ok' });
        return {
          continue: { uri: 'https://auth.example.test/continue', access_token: { value: 'rotated' } },
          subject: { sub_ids: [{ id: WALLET, format: 'uri' as const }] },
        };
      },
    });
    await expect(
      serviceWith(confirmed).continueSubjectGrant({
        continueUri: 'https://auth.example.test/continue',
        continueAccessToken: 'continue-token',
        interactRef: 'interact-ref-ok',
        walletAddress: WALLET,
      }),
    ).resolves.toEqual({ subjectWalletAddress: WALLET });

    const missing = grantFactory({
      async request() {
        throw new Error('unused');
      },
      async continue() {
        return { continue: { uri: 'https://auth.example.test/continue', access_token: { value: 'rotated' } } };
      },
    });
    await expect(
      serviceWith(missing).continueSubjectGrant({
        continueUri: 'https://auth.example.test/continue',
        continueAccessToken: 'continue-token',
        interactRef: 'interact-ref-ok',
        walletAddress: WALLET,
      }),
    ).rejects.toEqual(new DomainError(400, 'GNAP_SUBJECT_NOT_CONFIRMED'));
  });

  it('signs with the local key file and does not use an inline private key', () => {
    const directory = mkdtempSync(join(tmpdir(), 'taskstream-key-'));
    const filePath = join(directory, 'hack.key');
    writeFileSync(filePath, '-----BEGIN PRIVATE KEY-----\\nfrom-file\\n-----END PRIVATE KEY-----');
    try {
      const key = readPlatformPrivateKey({
        OPEN_PAYMENTS_PRIVATE_KEY: 'burned-inline-key',
        OPEN_PAYMENTS_PRIVATE_KEY_PATH: filePath,
      });
      expect(key).toContain('from-file');
      expect(key).not.toContain('burned-inline-key');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('refuses to sign a grant when the platform client is not configured', async () => {
    const previous = {
      wallet: process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS,
      keyId: process.env.OPEN_PAYMENTS_KEY_ID,
      privateKey: process.env.OPEN_PAYMENTS_PRIVATE_KEY,
      privateKeyPath: process.env.OPEN_PAYMENTS_PRIVATE_KEY_PATH,
    };
    delete process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS;
    delete process.env.OPEN_PAYMENTS_KEY_ID;
    delete process.env.OPEN_PAYMENTS_PRIVATE_KEY;
    delete process.env.OPEN_PAYMENTS_PRIVATE_KEY_PATH;
    try {
      await expect(new SdkOpenPaymentsClientFactory().authenticated()).rejects.toEqual(
        new DomainError(503, 'OPEN_PAYMENTS_CLIENT_NOT_CONFIGURED'),
      );
    } finally {
      restoreEnv('OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS', previous.wallet);
      restoreEnv('OPEN_PAYMENTS_KEY_ID', previous.keyId);
      restoreEnv('OPEN_PAYMENTS_PRIVATE_KEY', previous.privateKey);
      restoreEnv('OPEN_PAYMENTS_PRIVATE_KEY_PATH', previous.privateKeyPath);
    }
  });
});

function grantFactory(
  grant: Partial<AuthenticatedClient['grant']>,
): OpenPaymentsClientFactory {
  return {
    async unauthenticated() {
      throw new Error('unused');
    },
    async authenticated() {
      return { grant } as AuthenticatedClient;
    },
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

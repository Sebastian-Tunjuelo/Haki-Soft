import { randomUUID } from "node:crypto";
import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  type AuthenticatedClient,
} from "@interledger/open-payments";
import type { AppConfig } from "./config.js";
import type { CallbackServer } from "./callback-server.js";
import { sanitizeObject, sanitizeSession } from "./sanitize.js";
import { SessionStore } from "./session-store.js";
import type { Amount, GrantSession, JsonObject } from "./types.js";
import { assertHttpsUrl, findOutgoingDebitAmount, sanitizeError, validateAmount } from "./validation.js";

// Hardcoded credentials for local testing (do NOT use in production)
const HARDCODED_CLIENT_ADDRESS = "https://ilp.interledger-test.dev/wmtest";
const HARDCODED_KEY_ID = "a43b2479-0254-434b-9152-f216da2ccef3";
// Replace the string below with your test private key PEM. Keep this file strictly local.
const HARDCODED_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
REPLACE_WITH_YOUR_TEST_PRIVATE_KEY_CONTENT
-----END PRIVATE KEY-----`;

export class OpenPaymentsService {
  private client?: AuthenticatedClient;

  constructor(
    private readonly config: AppConfig,
    private readonly store: SessionStore,
    private readonly callbackServer: CallbackServer,
  ) {}

  async getWalletAddress(walletAddress: string): Promise<JsonObject> {
    assertHttpsUrl(walletAddress, "walletAddress");
    const wallet = await this.getClient().then((client) => client.walletAddress.get({ url: walletAddress }));
    return this.sanitizeWallet(wallet);
  }

  async executePeerToPeerPayment(input: {
    sendingWalletAddressUrl: string;
    receivingWalletAddressUrl: string;
    incomingAmount?: Amount;
    method?: string;
    timeoutMs?: number;
    dryRun?: boolean;
  }): Promise<JsonObject> {
    const { sendingWalletAddressUrl, receivingWalletAddressUrl, incomingAmount, method, timeoutMs, dryRun } = input;

    assertHttpsUrl(sendingWalletAddressUrl, "sendingWalletAddressUrl");
    assertHttpsUrl(receivingWalletAddressUrl, "receivingWalletAddressUrl");

    // Ensure the internal client is initialized from config (client/orchestrator identity).
    // Do not overwrite the client with a wallet address derived from the sending wallet.
    await this.getClient();

    // Step 1: Resolve wallets
    const sendingWallet = await this.getClient().then((c) => c.walletAddress.get({ url: sendingWalletAddressUrl }));
    const receivingWallet = await this.getClient().then((c) => c.walletAddress.get({ url: receivingWalletAddressUrl }));

    // Step 2: Incoming payment grant (non-interactive) and create incoming payment
    const incomingGrant = await this.requestGrant({
      authServer: receivingWallet.authServer,
      access: [{ type: "incoming-payment", actions: ["read", "complete", "create"] }],
    });

    if (incomingGrant.status !== "finalized") {
      throw new Error("Failed to obtain finalized incoming-payment grant");
    }

    const incomingGrantSessionId = incomingGrant.grantSessionId as string;
    const incomingResp = await this.createIncomingPayment({
      grantSessionId: incomingGrantSessionId,
      receiverWalletAddress: receivingWalletAddressUrl,
      incomingAmount,
    });

    // Step 3: Quote grant (non-interactive) and create quote
    const quoteGrant = await this.requestGrant({
      authServer: sendingWallet.authServer,
      access: [{ type: "quote", actions: ["create", "read"] }],
    });

    if (quoteGrant.status !== "finalized") {
      throw new Error("Failed to obtain finalized quote grant");
    }

    const quoteGrantSessionId = quoteGrant.grantSessionId as string;
    const quoteResp = await this.createQuote({
      grantSessionId: quoteGrantSessionId,
      senderWalletAddress: sendingWalletAddressUrl,
      receiver: (incomingResp.incomingPayment as any).id,
      method: method ?? "ilp",
    });

    const quote = quoteResp.quote as JsonObject;

    // Step 4: Outgoing payment grant (interactive)
    const outgoingAccess: unknown[] = [
      {
        type: "outgoing-payment",
        actions: ["read", "create"],
        limits: { debitAmount: (quote as any).debitAmount },
        identifier: sendingWallet.id,
      },
    ];

    const outgoingGrant = await this.requestGrant({
      authServer: sendingWallet.authServer,
      access: outgoingAccess,
    });

    if (outgoingGrant.status !== "awaiting_approval") {
      throw new Error("Outgoing grant did not enter awaiting_approval state");
    }

    const outgoingGrantSessionId = outgoingGrant.grantSessionId as string;

    // Return the redirect URL to the caller and block until approval
    const interactRedirectUrl = outgoingGrant.interactRedirectUrl as string;

    // Print the redirect URL so callers (and the helper script) can open it before we block waiting for approval
    // This uses stderr to ensure it appears even if stdout is buffered.
    console.error("Open this URL in a browser to approve the outgoing grant:", interactRedirectUrl);

    // Wait for interact_ref via callback server (blocks until timeout)
    const interactRef = await this.callbackServer.waitForInteractRef(outgoingGrantSessionId, timeoutMs ?? 300_000);

    // Continue the grant using the captured interact_ref
    const continued = await this.continueGrant({ grantSessionId: outgoingGrantSessionId, interactRef });
    if (continued.status !== "finalized") {
      throw new Error("Failed to finalize outgoing-payment grant after approval.");
    }

    // Create outgoing payment
    const outgoingResp = await this.createOutgoingPayment({
      grantSessionId: outgoingGrantSessionId,
      senderWalletAddress: sendingWalletAddressUrl,
      quoteId: (quote as any).id,
      description: "Peer-to-peer via executePeerToPeerPayment",
    });

    return {
      interactRedirectUrl,
      incomingPayment: incomingResp.incomingPayment,
      quote: quoteResp.quote,
      outgoingPayment: outgoingResp.outgoingPayment,
      sessionIds: {
        incomingGrantSessionId,
        quoteGrantSessionId,
        outgoingGrantSessionId,
      },
    } as JsonObject;
  }

  async requestGrant(input: { authServer: string; access: unknown[]; interact?: Record<string, unknown> }): Promise<JsonObject> {
    assertHttpsUrl(input.authServer, "authServer");
    this.enforceDebitLimit(input.access);

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const outgoingAccess = input.access.some(
      (item) => item && typeof item === "object" && (item as { type?: unknown }).type === "outgoing-payment",
    );
    const shouldInteract = Boolean(input.interact) || outgoingAccess;
    const clientNonce = shouldInteract ? randomUUID() : undefined;

    const requestBody: Record<string, unknown> = {
      access_token: {
        access: input.access,
      },
    };

    if (shouldInteract) {
      await this.callbackServer.start();
      requestBody.interact = {
        ...(input.interact ?? {}),
        start: ["redirect"],
        finish: {
          method: "redirect",
          uri: this.callbackServer.callbackUrl(id),
          nonce: clientNonce,
        },
      };
    }

    try {
      const grant = await this.getClient().then((client) => client.grant.request({ url: input.authServer }, requestBody as never));

      const baseSession: GrantSession = {
        id,
        status: "requested",
        authServer: input.authServer,
        access: input.access,
        createdAt,
        updatedAt: createdAt,
        clientNonce,
      };

      if (isPendingGrant(grant)) {
        const session = await this.store.save({
          ...baseSession,
          status: "awaiting_approval",
          continueUri: grant.continue.uri,
          continueAccessToken: grant.continue.access_token.value,
          interactRedirectUrl: grant.interact.redirect,
          interactNonce: (grant.interact.finish as any)?.nonce ?? grant.interact.finish,
        });

        return {
          grantSessionId: session.id,
          status: session.status,
          interactRedirectUrl: grant.interact.redirect,
          session: sanitizeSession(session),
        };
      }

      if (!isFinalizedGrantWithAccessToken(grant)) {
        throw new Error("Grant request did not return a usable grant.");
      }

      const session = await this.store.save({
        ...baseSession,
        status: "finalized",
        accessToken: grant.access_token.value,
      });

      return {
        grantSessionId: session.id,
        status: session.status,
        session: sanitizeSession(session),
      };
    } catch (error) {
      const session = await this.store.save({
        id,
        status: "failed",
        authServer: input.authServer,
        access: input.access,
        createdAt,
        updatedAt: createdAt,
        clientNonce,
        error: sanitizeError(error),
      });
      return {
        grantSessionId: session.id,
        status: session.status,
        error: session.error,
        session: sanitizeSession(session),
      };
    }
  }

  async continueGrant(input: { grantSessionId: string; interactRef?: string }): Promise<JsonObject> {
    const session = await this.store.getRequired(input.grantSessionId);
    const interactRef = input.interactRef ?? session.interactRef;

    if (!session.continueUri || !session.continueAccessToken) {
      throw new Error("Grant session does not have continuation details.");
    }

    if (!interactRef) {
      return {
        grantSessionId: session.id,
        status: "awaiting_approval",
        message: "No interact_ref has been captured yet. Approve in the wallet and try again.",
        session: sanitizeSession(session),
      };
    }

    const grant = await this.getClient().then((client) =>
      client.grant.continue(
        {
          url: session.continueUri as string,
          accessToken: session.continueAccessToken as string,
        },
        { interact_ref: interactRef },
      ),
    );

    if (!isFinalizedGrantWithAccessToken(grant)) {
      const updated = await this.store.save({
        ...session,
        status: "failed",
        error: "Grant continuation did not return a finalized access token.",
      });
      return {
        grantSessionId: updated.id,
        status: updated.status,
        error: updated.error,
        session: sanitizeSession(updated),
      };
    }

    const updated = await this.store.save({
      ...session,
      status: "finalized",
      interactRef,
      accessToken: grant.access_token.value,
      error: undefined,
    });

    return {
      grantSessionId: updated.id,
      status: updated.status,
      session: sanitizeSession(updated),
    };
  }

  async createIncomingPayment(input: {
    grantSessionId: string;
    receiverWalletAddress: string;
    incomingAmount?: Amount;
    description?: string;
    expiresAt?: string;
  }): Promise<JsonObject> {
    assertHttpsUrl(input.receiverWalletAddress, "receiverWalletAddress");
    if (input.incomingAmount) validateAmount(input.incomingAmount, "incomingAmount");

    const session = await this.store.getRequired(input.grantSessionId);
    const wallet = await this.getClient().then((client) => client.walletAddress.get({ url: input.receiverWalletAddress }));
    const payment = await this.getClient().then((client) =>
      client.incomingPayment.create(
        {
          url: wallet.resourceServer,
          accessToken: this.requireAccessToken(session),
        },
        {
          walletAddress: wallet.id,
          ...(input.incomingAmount ? { incomingAmount: input.incomingAmount } : {}),
          ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
          ...(input.description ? { metadata: { description: input.description } } : {}),
        } as never,
      ),
    );

    return { incomingPayment: sanitizeObject(payment) as JsonObject };
  }

  async getIncomingPayment(input: { grantSessionId: string; incomingPaymentUrl: string }): Promise<JsonObject> {
    assertHttpsUrl(input.incomingPaymentUrl, "incomingPaymentUrl");
    const session = await this.store.getRequired(input.grantSessionId);
    const payment = await this.getClient().then((client) =>
      client.incomingPayment.get({
        url: input.incomingPaymentUrl,
        accessToken: this.requireAccessToken(session),
      }),
    );
    return { incomingPayment: sanitizeObject(payment) as JsonObject };
  }

  async createQuote(input: {
    grantSessionId: string;
    senderWalletAddress: string;
    receiver: string;
    debitAmount?: Amount;
    receiveAmount?: Amount;
    method?: string;
  }): Promise<JsonObject> {
    assertHttpsUrl(input.senderWalletAddress, "senderWalletAddress");
    assertHttpsUrl(input.receiver, "receiver");
    if (input.debitAmount) validateAmount(input.debitAmount, "debitAmount");
    if (input.receiveAmount) validateAmount(input.receiveAmount, "receiveAmount");
    if (input.debitAmount && input.receiveAmount) {
      throw new Error("Only one of debitAmount or receiveAmount may be provided.");
    }

    const session = await this.store.getRequired(input.grantSessionId);
    const wallet = await this.getClient().then((client) => client.walletAddress.get({ url: input.senderWalletAddress }));
    const quote = await this.getClient().then((client) =>
      client.quote.create(
        {
          url: wallet.resourceServer,
          accessToken: this.requireAccessToken(session),
        },
        {
          walletAddress: wallet.id,
          receiver: input.receiver,
          method: input.method ?? "ilp",
          ...(input.debitAmount ? { debitAmount: input.debitAmount } : {}),
          ...(input.receiveAmount ? { receiveAmount: input.receiveAmount } : {}),
        } as never,
      ),
    );

    return { quote: sanitizeObject(quote) as JsonObject };
  }

  async getQuote(input: { grantSessionId: string; quoteUrl: string }): Promise<JsonObject> {
    assertHttpsUrl(input.quoteUrl, "quoteUrl");
    const session = await this.store.getRequired(input.grantSessionId);
    const quote = await this.getClient().then((client) =>
      client.quote.get({
        url: input.quoteUrl,
        accessToken: this.requireAccessToken(session),
      }),
    );
    return { quote: sanitizeObject(quote) as JsonObject };
  }

  async createOutgoingPayment(input: {
    grantSessionId: string;
    senderWalletAddress: string;
    quoteId: string;
    description?: string;
  }): Promise<JsonObject> {
    assertHttpsUrl(input.senderWalletAddress, "senderWalletAddress");
    assertHttpsUrl(input.quoteId, "quoteId");
    const session = await this.store.getRequired(input.grantSessionId);

    if (session.status === "payment_created" && session.outgoingPayment) {
      return {
        grantSessionId: session.id,
        status: session.status,
        outgoingPayment: sanitizeObject(session.outgoingPayment) as JsonObject,
        idempotent: true,
      };
    }

    if (session.status !== "finalized") {
      throw new Error("Outgoing payment grant must be finalized before creating payment.");
    }

    const wallet = await this.getClient().then((client) => client.walletAddress.get({ url: input.senderWalletAddress }));
    const outgoingPayment = await this.getClient().then((client) =>
      client.outgoingPayment.create(
        {
          url: wallet.resourceServer,
          accessToken: this.requireAccessToken(session),
        },
        {
          walletAddress: wallet.id,
          quoteId: input.quoteId,
          ...(input.description ? { metadata: { description: input.description } } : {}),
        },
      ),
    );

    const updated = await this.store.save({
      ...session,
      status: "payment_created",
      outgoingPayment,
    });

    return {
      grantSessionId: updated.id,
      status: updated.status,
      outgoingPayment: sanitizeObject(outgoingPayment) as JsonObject,
    };
  }

  async getOutgoingPayment(input: { grantSessionId: string; outgoingPaymentUrl: string }): Promise<JsonObject> {
    assertHttpsUrl(input.outgoingPaymentUrl, "outgoingPaymentUrl");
    const session = await this.store.getRequired(input.grantSessionId);
    const payment = await this.getClient().then((client) =>
      client.outgoingPayment.get({
        url: input.outgoingPaymentUrl,
        accessToken: this.requireAccessToken(session),
      }),
    );
    return { outgoingPayment: sanitizeObject(payment) as JsonObject };
  }

  private async getClient(): Promise<AuthenticatedClient> {
    if (!this.client) {
      this.client = await createAuthenticatedClient({
        walletAddressUrl: this.config.clientAddress,
        privateKey: this.config.privateKeyPath,
        keyId: this.config.keyId,
      });
    }
    return this.client;
  }

  private requireAccessToken(session: GrantSession): string {
    if (!session.accessToken) {
      throw new Error(`Grant session ${session.id} does not have a finalized access token.`);
    }
    return session.accessToken;
  }

  private enforceDebitLimit(access: unknown[]): void {
    const debitAmount = findOutgoingDebitAmount(access);
    if (!debitAmount || this.config.maxDebitAmount === undefined) return;

    if (BigInt(debitAmount.value) > this.config.maxDebitAmount) {
      throw new Error("Requested outgoing-payment debitAmount exceeds OPEN_PAYMENTS_MAX_DEBIT_AMOUNT.");
    }
  }

  private sanitizeWallet(wallet: unknown): JsonObject {
    const record = wallet as Record<string, unknown>;
    return {
      id: record.id,
      assetCode: record.assetCode,
      assetScale: record.assetScale,
      authServer: record.authServer,
      resourceServer: record.resourceServer,
    };
  }
}

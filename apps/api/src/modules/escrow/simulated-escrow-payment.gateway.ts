import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * Adaptador de desarrollo/pruebas para SPEC-06.
 * NO sustituye `open-payments/escrow-payment.service.ts` (🛡️ autoría manual BE-1).
 * Simula grant + incoming URL sin hablar con Rafiki.
 */
export interface EscrowPaymentGateway {
  beginEscrowLock(input: {
    taskId: string;
    totalAmountUSDInCents: number;
    buyerWalletAddressUrl: string;
  }): Promise<{ interactRedirectUri: string; incomingPaymentUrl: string }>;
}

@Injectable()
export class SimulatedEscrowPaymentGateway implements EscrowPaymentGateway {
  async beginEscrowLock(input: {
    taskId: string;
    totalAmountUSDInCents: number;
    buyerWalletAddressUrl: string;
  }): Promise<{ interactRedirectUri: string; incomingPaymentUrl: string }> {
    const incomingPaymentUrl = `https://ilp.interledger-test.dev/simulated/incoming/${input.taskId}/${randomUUID()}`;
    const webBase = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const interactRedirectUri = `${webBase}/orders/${input.taskId}/escrow?simulatedGrant=1&amount=${input.totalAmountUSDInCents}`;
    void input.buyerWalletAddressUrl;
    return { interactRedirectUri, incomingPaymentUrl };
  }
}

import { NextResponse } from 'next/server';
import { WalletLinkRequestSchema } from '@taskstream/shared-schemas';
import { discoverMockWallet, createMockChallenge } from '@/src/lib/wallet-mock-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = WalletLinkRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: 'WALLET_ADDRESS_INVALID', message: 'La dirección debe ser una URL HTTPS válida.' },
        { status: 400 },
      );
    }

    const discovery = discoverMockWallet(parsed.data.walletAddress);
    const challenge = createMockChallenge(discovery);

    return NextResponse.json(challenge);
  } catch (err) {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: (err as Error).message },
      { status: 500 },
    );
  }
}

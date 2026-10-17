import { NextResponse } from 'next/server';
import { getMockActiveWallet, completeMockVerification, discoverMockWallet } from '@/src/lib/wallet-mock-store';

export async function GET() {
  const data = getMockActiveWallet();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, hash } = body;

    if (!walletAddress || !hash) {
      return NextResponse.json(
        { code: 'INVALID_VERIFICATION_PAYLOAD', message: 'walletAddress y hash son requeridos.' },
        { status: 400 },
      );
    }

    const discovery = discoverMockWallet(walletAddress);
    const result = completeMockVerification(discovery, hash);

    if (!result.success) {
      return NextResponse.json(
        { code: result.code ?? 'VERIFICATION_FAILED' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
    });
  } catch (err) {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: (err as Error).message },
      { status: 500 },
    );
  }
}

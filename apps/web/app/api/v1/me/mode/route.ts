import { NextResponse } from 'next/server';
import { ActiveModeSwitchSchema } from '@taskstream/shared-schemas';
import { getMockUserMode, setMockUserMode } from '@/src/lib/wallet-mock-store';

export async function GET() {
  const activeMode = getMockUserMode();
  return NextResponse.json({ activeMode });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ActiveModeSwitchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: 'ACTIVE_MODE_INVALID', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updatedMode = setMockUserMode(parsed.data.activeMode);
    return NextResponse.json({ activeMode: updatedMode });
  } catch (err) {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: (err as Error).message },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 600;

export async function GET(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const home = searchParams.get('home');
    const away = searchParams.get('away');

    if (!home || !away) {
      return NextResponse.json({ error: 'Missing home or away team ID' }, { status: 400 });
    }

    const h2h = await matchRepository.getHeadToHead(home, away);

    return NextResponse.json({
      success: true,
      data: h2h,
    });
  } catch (error) {
    console.error('Error fetching h2h:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch head to head' }, { status: 500 });
  }
}

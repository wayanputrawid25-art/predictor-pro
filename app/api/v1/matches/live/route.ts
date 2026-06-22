import { NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  try {
    const { allowed } = await checkRateLimit(new Request(''));
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const matches = await matchRepository.findLive();

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch live matches' }, { status: 500 });
  }
}

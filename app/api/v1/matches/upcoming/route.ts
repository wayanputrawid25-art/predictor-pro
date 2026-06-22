import { NextRequest, NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 600; // ISR - revalidate every 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const matches = await matchRepository.findUpcoming(Math.min(days, 14));

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch matches' }, { status: 500 });
  }
}

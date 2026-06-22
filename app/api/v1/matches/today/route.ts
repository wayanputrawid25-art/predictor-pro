import { NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 300; // ISR - revalidate every 5 minutes

export async function GET() {
  try {
    const { allowed } = await checkRateLimit(new Request(''));
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const matches = await matchRepository.findByDate(new Date());

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Error fetching today matches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch matches' }, { status: 500 });
  }
}

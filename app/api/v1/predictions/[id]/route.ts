import { NextRequest, NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { allowed } = await checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const match = await matchRepository.findById(id);

    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: match.prediction,
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch prediction' }, { status: 500 });
  }
}

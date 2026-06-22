import { NextRequest, NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseISO } from 'date-fns';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);

    const result = await matchRepository.findAll({
      date: date ? parseISO(date) : undefined,
      leagueId: leagueId || undefined,
      status: status !== 'all' ? status : undefined,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.matches,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: (result.page * result.pageSize) < result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch matches' }, { status: 500 });
  }
}

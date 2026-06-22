import { NextRequest, NextResponse } from 'next/server';
import { cronService } from '@/services/cron-jobs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job } = body;

    let result;
    switch (job) {
      case 'sync_today_matches':
        result = await cronService.syncTodayMatches();
        break;
      case 'sync_upcoming_matches':
        result = await cronService.syncUpcomingMatches();
        break;
      case 'generate_predictions':
        result = await cronService.generatePredictions();
        break;
      case 'sync_odds':
        result = await cronService.syncOdds();
        break;
      case 'update_elo_ratings':
        result = await cronService.updateEloRatings();
        break;
      case 'all':
        const results = await cronService.runAll();
        return NextResponse.json({ success: true, data: results });
      default:
        return NextResponse.json({ error: 'Unknown job' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available_jobs: [
      'sync_today_matches',
      'sync_upcoming_matches',
      'generate_predictions',
      'sync_odds',
      'update_elo_ratings',
      'all',
    ],
  });
}

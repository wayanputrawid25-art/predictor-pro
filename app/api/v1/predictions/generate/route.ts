import { NextRequest, NextResponse } from 'next/server';
import { matchRepository } from '@/services/match-repository';
import { teamRepository } from '@/services/team-repository';
import { generatePrediction } from '@/services/prediction-engine';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { homeTeamId, awayTeamId } = body;

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json({ error: 'Missing team IDs' }, { status: 400 });
    }

    const [homeTeam, awayTeam] = await Promise.all([
      teamRepository.findById(homeTeamId),
      teamRepository.findById(awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const [homeForm, awayForm] = await Promise.all([
      teamRepository.getForm(homeTeamId),
      teamRepository.getForm(awayTeamId),
    ]);

    // Calculate form scores (scale to 0-1)
    const formHome = homeForm.length > 0
      ? homeForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / (homeForm.length * 2)
      : 0.5;
    const formAway = awayForm.length > 0
      ? awayForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / (awayForm.length * 2)
      : 0.5;

    const prediction = generatePrediction({
      eloHome: homeTeam.elo,
      eloAway: awayTeam.elo,
      formHome,
      formAway,
      homeAdvantage: 65,
    });

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error generating prediction:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate prediction' }, { status: 500 });
  }
}

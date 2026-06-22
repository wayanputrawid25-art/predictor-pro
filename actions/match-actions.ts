'use server';

import { revalidatePath } from 'next/cache';
import { matchRepository } from '@/services/match-repository';
import { teamRepository } from '@/services/team-repository';
import { generatePrediction } from '@/services/prediction-engine';
import { matchQuerySchema } from '@/types/schemas';
import { z } from 'zod';

export async function getMatchesAction(formData: FormData) {
  try {
    const date = formData.get('date') as string;
    const leagueId = formData.get('leagueId') as string;
    const status = formData.get('status') as string;
    const page = parseInt(formData.get('page') as string) || 1;

    const result = await matchRepository.findAll({
      date: date ? new Date(date) : undefined,
      leagueId: leagueId || undefined,
      status: status || undefined,
      page,
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch matches' };
  }
}

export async function getMatchByIdAction(id: string) {
  try {
    const match = await matchRepository.findById(id);
    if (!match) {
      return { success: false, error: 'Match not found' };
    }
    return { success: true, data: match };
  } catch (error) {
    return { success: false, error: 'Failed to fetch match' };
  }
}

export async function getLiveMatchesAction() {
  try {
    const matches = await matchRepository.findLive();
    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: 'Failed to fetch live matches' };
  }
}

export async function getTodayMatchesAction() {
  try {
    const matches = await matchRepository.findByDate(new Date());
    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: 'Failed to fetch today matches' };
  }
}

export async function getUpcomingMatchesAction(daysAhead: number = 7) {
  try {
    const matches = await matchRepository.findUpcoming(daysAhead);
    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: 'Failed to fetch upcoming matches' };
  }
}

export async function getHeadToHeadAction(homeTeamId: string, awayTeamId: string) {
  try {
    const h2h = await matchRepository.getHeadToHead(homeTeamId, awayTeamId);
    return { success: true, data: h2h };
  } catch (error) {
    return { success: false, error: 'Failed to fetch head to head' };
  }
}

export async function generatePredictionAction(homeTeamId: string, awayTeamId: string) {
  try {
    const [homeTeam, awayTeam] = await Promise.all([
      teamRepository.findById(homeTeamId),
      teamRepository.findById(awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      return { success: false, error: 'Team not found' };
    }

    const [homeForm, awayForm] = await Promise.all([
      teamRepository.getForm(homeTeamId),
      teamRepository.getForm(awayTeamId),
    ]);

    // Calculate form scores
    const formHome = homeForm.length > 0
      ? homeForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / homeForm.length
      : 1;
    const formAway = awayForm.length > 0
      ? awayForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / awayForm.length
      : 1;

    const prediction = generatePrediction({
      eloHome: homeTeam.elo,
      eloAway: awayTeam.elo,
      formHome: formHome * 0.5, // Scale to 0-1
      formAway: formAway * 0.5,
      homeAdvantage: 65,
    });

    return { success: true, data: prediction };
  } catch (error) {
    return { success: false, error: 'Failed to generate prediction' };
  }
}

export async function refreshMatchDataAction(matchId: string) {
  try {
    // Revalidate the specific match page
    revalidatePath(`/match/${matchId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to refresh data' };
  }
}

export async function refreshMatchesAction() {
  try {
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to refresh matches' };
  }
}

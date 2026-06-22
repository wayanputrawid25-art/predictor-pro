import { matchRepository } from '@/services/match-repository';

export async function getTodayMatches() {
  try {
    const matches = await matchRepository.findByDate(new Date());
    return { success: true, data: matches };
  } catch (error) {
    console.error('Error fetching today matches:', error);
    return { success: false, error: 'Failed to fetch matches' };
  }
}

export async function getLiveMatches() {
  try {
    const matches = await matchRepository.findLive();
    return { success: true, data: matches };
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return { success: false, error: 'Failed to fetch matches' };
  }
}

export async function getUpcomingMatches(daysAhead: number = 7) {
  try {
    const matches = await matchRepository.findUpcoming(daysAhead);
    return { success: true, data: matches };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { success: false, error: 'Failed to fetch matches' };
  }
}

export async function getMatchById(id: string) {
  try {
    const match = await matchRepository.findById(id);
    if (!match) {
      return { success: false, error: 'Match not found' };
    }
    return { success: true, data: match };
  } catch (error) {
    console.error('Error fetching match:', error);
    return { success: false, error: 'Failed to fetch match' };
  }
}

export async function getHeadToHead(homeTeamId: string, awayTeamId: string) {
  try {
    const h2h = await matchRepository.getHeadToHead(homeTeamId, awayTeamId);
    return { success: true, data: h2h };
  } catch (error) {
    console.error('Error fetching head to head:', error);
    return { success: false, error: 'Failed to fetch head to head' };
  }
}

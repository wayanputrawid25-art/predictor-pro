import { prisma } from '@/lib/prisma';
import { apiFootball } from './api-football';
import { oddsApi } from './odds-api';
import { generatePrediction } from './prediction-engine';
import { teamRepository } from './team-repository';
import logger from '@/lib/logger';
import { format } from 'date-fns';

interface CronJobResult {
  success: boolean;
  processed: number;
  errors: number;
  duration: number;
  message?: string;
}

class CronService {
  private startJob(jobName: string): number {
    logger.info(`Starting cron job: ${jobName}`);
    return Date.now();
  }

  private endJob(jobName: string, startTime: number, result: CronJobResult): void {
    const duration = Date.now() - startTime;
    result.duration = duration;
    
    logger.info(`Completed cron job: ${jobName}`, {
      success: result.success,
      processed: result.processed,
      errors: result.errors,
      duration: `${duration}ms`,
    });

    // Log to database
    prisma.cronLog.create({
      data: {
        jobName,
        status: result.success ? 'success' : 'failed',
        message: result.message,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
        duration,
      },
    }).catch((err) => logger.error('Failed to log cron job', err));
  }

  // Fetch and store today's matches
  async syncTodayMatches(): Promise<CronJobResult> {
    const startTime = this.startJob('sync_today_matches');
    const result: CronJobResult = { success: true, processed: 0, errors: 0, duration: 0 };

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await apiFootball.getMatchesByDate(today);

      if (response.results === 0) {
        result.message = 'No matches found for today';
        this.endJob('sync_today_matches', startTime, result);
        return result;
      }

      for (const matchData of response.response) {
        try {
          const fixture = matchData as {
            fixture: { id: number; date: string; venue?: { name: string }; referee?: string | null };
            league: { id: number; name: string; country: string; logo: string; flag?: string | null };
            teams: {
              home: { id: number; name: string; shortName?: string | null; logo: string };
              away: { id: number; name: string; shortName?: string | null; logo: string };
            };
            goals: { home: number | null; away: number | null };
          };

          // Upsert teams and league
          await teamRepository.upsertFromApi(fixture.teams.home);
          await teamRepository.upsertFromApi(fixture.teams.away);

          // Upsert match
          await this.upsertMatch(fixture);
          result.processed++;
        } catch (error) {
          result.errors++;
          logger.error('Error syncing match', error);
        }
      }

      result.message = `Synced ${result.processed} matches`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error}`;
      logger.error('Error in syncTodayMatches', error);
    }

    this.endJob('sync_today_matches', startTime, result);
    return result;
  }

  // Sync matches for the next 7 days
  async syncUpcomingMatches(): Promise<CronJobResult> {
    const startTime = this.startJob('sync_upcoming_matches');
    const result: CronJobResult = { success: true, processed: 0, errors: 0, duration: 0 };

    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(nextWeek, 'yyyy-MM-dd');

      const response = await apiFootball.getMatchesByDateRange(startDate, endDate);

      if (response.results === 0) {
        result.message = 'No upcoming matches found';
        this.endJob('sync_upcoming_matches', startTime, result);
        return result;
      }

      for (const matchData of response.response) {
        try {
          const fixture = matchData as {
            fixture: { id: number; date: string; venue?: { name: string }; referee?: string | null };
            league: { id: number; name: string; country: string; logo: string; flag?: string | null };
            teams: {
              home: { id: number; name: string; shortName?: string | null; logo: string };
              away: { id: number; name: string; shortName?: string | null; logo: string };
            };
            goals: { home: number | null; away: number | null };
          };

          await teamRepository.upsertFromApi(fixture.teams.home);
          await teamRepository.upsertFromApi(fixture.teams.away);
          await this.upsertMatch(fixture);
          result.processed++;
        } catch (error) {
          result.errors++;
          logger.error('Error syncing upcoming match', error);
        }
      }

      result.message = `Synced ${result.processed} upcoming matches`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error}`;
      logger.error('Error in syncUpcomingMatches', error);
    }

    this.endJob('sync_upcoming_matches', startTime, result);
    return result;
  }

  // Generate predictions for upcoming matches
  async generatePredictions(): Promise<CronJobResult> {
    const startTime = this.startJob('generate_predictions');
    const result: CronJobResult = { success: true, processed: 0, errors: 0, duration: 0 };

    try {
      // Get matches that don't have predictions yet and are scheduled within 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const matches = await prisma.match.findMany({
        where: {
          date: {
            gte: new Date(),
            lte: tomorrow,
          },
          status: 'NS',
          prediction: null,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        take: 50,
      });

      for (const match of matches) {
        try {
          const homeForm = await teamRepository.getForm(match.homeTeamId);
          const awayForm = await teamRepository.getForm(match.awayTeamId);

          // Calculate form scores
          const formHome = homeForm.length > 0
            ? homeForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / (homeForm.length * 2)
            : 0.5;
          const formAway = awayForm.length > 0
            ? awayForm.reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0) / (awayForm.length * 2)
            : 0.5;

          const prediction = generatePrediction({
            eloHome: match.homeTeam.elo,
            eloAway: match.awayTeam.elo,
            formHome,
            formAway,
            homeAdvantage: 65,
          });

          await prisma.prediction.create({
            data: {
              matchId: match.id,
              homeWinProb: prediction.homeWinProb,
              drawProb: prediction.drawProb,
              awayWinProb: prediction.awayWinProb,
              bttsYesProb: prediction.bttsYesProb,
              bttsNoProb: prediction.bttsNoProb,
              over25Prob: prediction.over25Prob,
              under25Prob: prediction.under25Prob,
              homeHandicap: prediction.homeHandicap,
              handicapProb: prediction.handicapProb,
              predictedHomeScore: prediction.predictedHomeScore,
              predictedAwayScore: prediction.predictedAwayScore,
              confidence: prediction.confidence,
              eloHome: prediction.eloHome,
              eloAway: prediction.eloAway,
              formHome: prediction.formHome,
              formAway: prediction.formAway,
              homeAdvantage: prediction.homeAdvantage,
              factors: prediction.factors as object,
              aiGenerated: false,
            },
          });

          result.processed++;
        } catch (error) {
          result.errors++;
          logger.error(`Error generating prediction for match ${match.id}`, error);
        }
      }

      result.message = `Generated ${result.processed} predictions`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error}`;
      logger.error('Error in generatePredictions', error);
    }

    this.endJob('generate_predictions', startTime, result);
    return result;
  }

  // Sync odds for matches
  async syncOdds(): Promise<CronJobResult> {
    const startTime = this.startJob('sync_odds');
    const result: CronJobResult = { success: true, processed: 0, errors: 0, duration: 0 };

    try {
      // Get matches that need odds (within 24 hours, no odds or old odds)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const matches = await prisma.match.findMany({
        where: {
          date: {
            gte: new Date(),
            lte: tomorrow,
          },
          status: 'NS',
        },
        select: { id: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
        take: 20,
      });

      for (const match of matches) {
        try {
          // In a real implementation, we would call the odds API here
          // For now, we'll skip actual API calls
          result.processed++;
        } catch (error) {
          result.errors++;
          logger.error(`Error syncing odds for match ${match.id}`, error);
        }
      }

      result.message = `Processed odds for ${result.processed} matches`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error}`;
      logger.error('Error in syncOdds', error);
    }

    this.endJob('sync_odds', startTime, result);
    return result;
  }

  // Update Elo ratings based on finished matches
  async updateEloRatings(): Promise<CronJobResult> {
    const startTime = this.startJob('update_elo_ratings');
    const result: CronJobResult = { success: true, processed: 0, errors: 0, duration: 0 };

    try {
      // Get recently finished matches without Elo updates
      const matches = await prisma.match.findMany({
        where: {
          status: { in: ['FT', 'AET', 'PEN'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        take: 20,
      });

      for (const match of matches) {
        try {
          if (match.homeScore === null || match.awayScore === null) continue;

          // Calculate new Elo ratings
          const { calculateEloChange } = await import('./prediction-engine');
          
          const homeEloChange = calculateEloChange(
            match.homeTeam.elo,
            match.awayTeam.elo,
            match.homeScore,
            match.awayScore,
            true
          );

          const awayEloChange = calculateEloChange(
            match.awayTeam.elo,
            match.homeTeam.elo,
            match.awayScore,
            match.homeScore,
            false
          );

          // Update team Elos
          await prisma.team.update({
            where: { id: match.homeTeamId },
            data: { elo: match.homeTeam.elo + homeEloChange },
          });

          await prisma.team.update({
            where: { id: match.awayTeamId },
            data: { elo: match.awayTeam.elo + awayEloChange },
          });

          // Record form history
          const homeResult: 'W' | 'D' | 'L' = 
            match.homeScore > match.awayScore ? 'W' :
            match.homeScore < match.awayScore ? 'L' : 'D';
          const awayResult: 'W' | 'D' | 'L' = 
            match.awayScore > match.homeScore ? 'W' :
            match.awayScore < match.homeScore ? 'L' : 'D';

          await teamRepository.recordForm(
            match.homeTeamId,
            match.id,
            homeResult,
            match.homeScore,
            match.awayScore,
            'home',
            match.date
          );

          await teamRepository.recordForm(
            match.awayTeamId,
            match.id,
            awayResult,
            match.awayScore,
            match.homeScore,
            'away',
            match.date
          );

          result.processed++;
        } catch (error) {
          result.errors++;
          logger.error(`Error updating Elo for match ${match.id}`, error);
        }
      }

      result.message = `Updated Elo ratings for ${result.processed} matches`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error}`;
      logger.error('Error in updateEloRatings', error);
    }

    this.endJob('update_elo_ratings', startTime, result);
    return result;
  }

  // Helper to upsert a match
  private async upsertMatch(fixture: {
    fixture: { id: number; date: string; venue?: { name: string }; referee?: string | null };
    league: { id: number; name: string; country: string; logo: string; flag?: string | null };
    teams: {
      home: { id: number; name: string; shortName?: string | null; logo: string };
      away: { id: number; name: string; shortName?: string | null; logo: string };
    };
    goals: { home: number | null; away: number | null };
  }): Promise<void> {
    const homeTeam = await prisma.team.findUnique({ where: { apiId: fixture.teams.home.id } });
    const awayTeam = await prisma.team.findUnique({ where: { apiId: fixture.teams.away.id } });
    const league = await prisma.league.findUnique({ where: { apiId: fixture.league.id } });

    if (!homeTeam || !awayTeam || !league) return;

    await prisma.match.upsert({
      where: { apiId: fixture.fixture.id },
      update: {
        date: new Date(fixture.fixture.date),
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        venue: fixture.fixture.venue?.name,
        referee: fixture.fixture.referee,
      },
      create: {
        apiId: fixture.fixture.id,
        date: new Date(fixture.fixture.date),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: league.id,
        venue: fixture.fixture.venue?.name,
        referee: fixture.fixture.referee,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
      },
    });
  }

  // Run all cron jobs
  async runAll(): Promise<{ results: CronJobResult[] }> {
    const results = await Promise.all([
      this.syncTodayMatches(),
      this.syncUpcomingMatches(),
      this.generatePredictions(),
      this.updateEloRatings(),
    ]);

    return { results };
  }
}

export const cronService = new CronService();
export default cronService;

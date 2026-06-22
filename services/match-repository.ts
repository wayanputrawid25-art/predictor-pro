import { prisma } from '@/lib/prisma';
import { Match, MatchStats, MatchEvent, MatchOdds, Prediction } from '@/types';
import { apiFootball } from './api-football';

interface MatchFilters {
  date?: Date;
  leagueId?: string;
  status?: string;
  teamId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}

interface MatchWithRelations {
  id: string;
  apiId: number;
  date: Date;
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  round: string | null;
  homeTeam: {
    id: string;
    apiId: number;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  awayTeam: {
    id: string;
    apiId: number;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  league: {
    id: string;
    apiId: number;
    name: string;
    country: string | null;
    logo: string | null;
  };
  stats: MatchStats | null;
  prediction: Prediction | null;
  odds: MatchOdds[];
}

class MatchRepository {
  // Get matches with filters and pagination
  async findAll(filters: MatchFilters = {}): Promise<{
    matches: MatchWithRelations[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { date, leagueId, status, teamId, fromDate, toDate, page = 1, pageSize = 20 } = filters;

    const where: Record<string, unknown> = {};
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }
    
    if (fromDate && toDate) {
      where.date = { gte: fromDate, lte: toDate };
    }
    
    if (leagueId) where.leagueId = leagueId;
    if (status && status !== 'all') where.status = status;
    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
          awayTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
          league: { select: { id: true, apiId: true, name: true, country: true, logo: true } },
          stats: true,
          prediction: true,
          odds: { take: 5, orderBy: { updatedAt: 'desc' } },
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.match.count({ where }),
    ]);

    return { matches: matches as MatchWithRelations[], total, page, pageSize };
  }

  // Get match by ID
  async findById(id: string): Promise<MatchWithRelations | null> {
    return prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true, elo: true } },
        awayTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true, elo: true } },
        league: true,
        stats: true,
        prediction: true,
        odds: { take: 10, orderBy: { updatedAt: 'desc' } },
        events: { orderBy: { minute: 'asc' } },
        h2h: { take: 10, orderBy: { date: 'desc' } },
      },
    }) as Promise<MatchWithRelations | null>;
  }

  // Get live matches
  async findLive(): Promise<MatchWithRelations[]> {
    return prisma.match.findMany({
      where: { status: 'LIVE' },
      include: {
        homeTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        awayTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        league: { select: { id: true, apiId: true, name: true, country: true, logo: true } },
        stats: true,
        prediction: true,
        odds: { take: 3, orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { date: 'asc' },
    }) as Promise<MatchWithRelations[]>;
  }

  // Get matches by date
  async findByDate(date: Date): Promise<MatchWithRelations[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.match.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: {
        homeTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        awayTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        league: { select: { id: true, apiId: true, name: true, country: true, logo: true } },
        stats: true,
        prediction: true,
        odds: { take: 3, orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { date: 'asc' },
    }) as Promise<MatchWithRelations[]>;
  }

  // Get upcoming matches
  async findUpcoming(daysAhead: number = 7): Promise<MatchWithRelations[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.match.findMany({
      where: {
        date: { gte: now, lte: futureDate },
        status: 'NS',
      },
      include: {
        homeTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        awayTeam: { select: { id: true, apiId: true, name: true, shortName: true, logo: true } },
        league: { select: { id: true, apiId: true, name: true, country: true, logo: true } },
        stats: true,
        prediction: true,
        odds: { take: 3, orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { date: 'asc' },
      take: 50,
    }) as Promise<MatchWithRelations[]>;
  }

  // Create or update match from API data
  async upsertFromApi(apiMatch: {
    fixture: { id: number; date: string; venue?: { name: string }; referee?: string | null };
    league: { id: number; name: string; country: string; logo: string; flag?: string | null };
    teams: {
      home: { id: number; name: string; shortName?: string | null; logo: string };
      away: { id: number; name: string; shortName?: string | null; logo: string };
    };
    goals: { home: number | null; away: number | null };
  }): Promise<string> {
    // Ensure teams exist
    const homeTeam = await prisma.team.upsert({
      where: { apiId: apiMatch.teams.home.id },
      update: { name: apiMatch.teams.home.name, logo: apiMatch.teams.home.logo },
      create: {
        apiId: apiMatch.teams.home.id,
        name: apiMatch.teams.home.name,
        shortName: apiMatch.teams.home.shortName || null,
        logo: apiMatch.teams.home.logo,
      },
    });

    const awayTeam = await prisma.team.upsert({
      where: { apiId: apiMatch.teams.away.id },
      update: { name: apiMatch.teams.away.name, logo: apiMatch.teams.away.logo },
      create: {
        apiId: apiMatch.teams.away.id,
        name: apiMatch.teams.away.name,
        shortName: apiMatch.teams.away.shortName || null,
        logo: apiMatch.teams.away.logo,
      },
    });

    // Ensure league exists
    const league = await prisma.league.upsert({
      where: { apiId: apiMatch.league.id },
      update: { name: apiMatch.league.name, logo: apiMatch.league.logo },
      create: {
        apiId: apiMatch.league.id,
        name: apiMatch.league.name,
        country: apiMatch.league.country,
        logo: apiMatch.league.logo,
        flag: apiMatch.league.flag || null,
      },
    });

    // Create/update match
    const match = await prisma.match.upsert({
      where: { apiId: apiMatch.fixture.id },
      update: {
        date: new Date(apiMatch.fixture.date),
        status: 'NS',
        homeScore: apiMatch.goals.home,
        awayScore: apiMatch.goals.away,
        venue: apiMatch.fixture.venue?.name || null,
        referee: apiMatch.fixture.referee || null,
      },
      create: {
        apiId: apiMatch.fixture.id,
        date: new Date(apiMatch.fixture.date),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: league.id,
        venue: apiMatch.fixture.venue?.name || null,
        referee: apiMatch.fixture.referee || null,
      },
    });

    return match.id;
  }

  // Update match with live data
  async updateLiveData(id: string, data: {
    status?: string;
    minute?: number;
    homeScore?: number;
    awayScore?: number;
  }): Promise<void> {
    await prisma.match.update({
      where: { id },
      data,
    });
  }

  // Save prediction
  async savePrediction(matchId: string, prediction: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    bttsYesProb?: number;
    bttsNoProb?: number;
    over25Prob?: number;
    under25Prob?: number;
    homeHandicap?: string;
    handicapProb?: number;
    predictedHomeScore: number;
    predictedAwayScore: number;
    confidence: number;
    eloHome: number;
    eloAway: number;
    formHome: number;
    formAway: number;
    homeAdvantage: number;
    factors?: unknown;
    aiGenerated: boolean;
  }): Promise<void> {
    await prisma.prediction.upsert({
      where: { matchId },
      update: prediction,
      create: { ...prediction, matchId },
    });
  }

  // Get head-to-head records
  async getHeadToHead(homeTeamId: string, awayTeamId: string): Promise<Array<{
    id: string;
    date: Date;
    homeScore: number;
    awayScore: number;
    homeTeam: { id: string; name: string; logo: string | null };
    awayTeam: { id: string; name: string; logo: string | null };
    league: { id: string; name: string };
  }>> {
    const records = await prisma.h2HRecord.findMany({
      where: {
        OR: [
          { homeTeamId: homeTeamId, awayTeamId: awayTeamId },
          { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
        ],
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        league: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    return records.map(r => ({
      ...r,
      homeTeam: r.homeTeamId === homeTeamId ? r.homeTeam : r.awayTeam,
      awayTeam: r.homeTeamId === homeTeamId ? r.awayTeam : r.homeTeam,
      homeScore: r.homeTeamId === homeTeamId ? r.homeScore : r.awayScore,
      awayScore: r.homeTeamId === homeTeamId ? r.awayScore : r.homeScore,
    }));
  }
}

export const matchRepository = new MatchRepository();
export default matchRepository;

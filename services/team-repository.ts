import { prisma } from '@/lib/prisma';

interface TeamWithElo {
  id: string;
  apiId: number;
  name: string;
  shortName: string | null;
  logo: string | null;
  elo: number;
}

class TeamRepository {
  // Get team by ID
  async findById(id: string): Promise<TeamWithElo | null> {
    return prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        apiId: true,
        name: true,
        shortName: true,
        logo: true,
        elo: true,
      },
    }) as Promise<TeamWithElo | null>;
  }

  // Get team by API ID
  async findByApiId(apiId: number): Promise<TeamWithElo | null> {
    return prisma.team.findUnique({
      where: { apiId },
      select: {
        id: true,
        apiId: true,
        name: true,
        shortName: true,
        logo: true,
        elo: true,
      },
    }) as Promise<TeamWithElo | null>;
  }

  // Get all teams
  async findAll(page: number = 1, pageSize: number = 50): Promise<{
    teams: TeamWithElo[];
    total: number;
  }> {
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        select: {
          id: true,
          apiId: true,
          name: true,
          shortName: true,
          logo: true,
          elo: true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.team.count(),
    ]);

    return { teams: teams as TeamWithElo[], total };
  }

  // Get team form (last 5 matches)
  async getForm(teamId: string): Promise<Array<'W' | 'D' | 'L'>> {
    const matches = await prisma.formHistory.findMany({
      where: { teamId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return matches.map(m => m.result as 'W' | 'D' | 'L');
  }

  // Update team Elo
  async updateElo(id: string, newElo: number): Promise<void> {
    await prisma.team.update({
      where: { id },
      data: { elo: newElo },
    });
  }

  // Record match result for form calculation
  async recordForm(
    teamId: string,
    matchId: string,
    result: 'W' | 'D' | 'L',
    goalsFor: number,
    goalsAgainst: number,
    homeAway: 'home' | 'away',
    date: Date
  ): Promise<void> {
    await prisma.formHistory.create({
      data: {
        teamId,
        matchId,
        result,
        goalsFor,
        goalsAgainst,
        homeAway,
        date,
        weight: 1, // Weight can be adjusted based on match importance
      },
    });
  }

  // Get team injuries
  async getInjuries(teamId: string): Promise<Array<{
    id: string;
    player: string;
    type: string;
    reason: string | null;
    status: string | null;
    returnDate: Date | null;
  }>> {
    return prisma.injury.findMany({
      where: { teamId },
      orderBy: { returnDate: 'asc' },
    }) as Promise<Array<{
      id: string;
      player: string;
      type: string;
      reason: string | null;
      status: string | null;
      returnDate: Date | null;
    }>>;
  }

  // Get team standings
  async getStanding(teamId: string, season?: string): Promise<{
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    form: string | null;
  } | null> {
    const standing = await prisma.leagueStanding.findFirst({
      where: teamId ? { teamId, season } : { teamId },
      orderBy: { position: 'asc' },
    });

    if (!standing) return null;

    return {
      position: standing.position,
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goalsFor: standing.goalsFor,
      goalsAgainst: standing.goalsAgainst,
      goalDiff: standing.goalDiff,
      points: standing.points,
      form: standing.form,
    };
  }

  // Get recent matches for a team
  async getRecentMatches(teamId: string, limit: number = 10): Promise<Array<{
    id: string;
    date: Date;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { id: string; name: string; logo: string | null };
    awayTeam: { id: string; name: string; logo: string | null };
    league: { id: string; name: string };
  }>> {
    return prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
        status: { in: ['FT', 'AET', 'PEN'] },
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        league: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    }) as Promise<Array<{
      id: string;
      date: Date;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      homeTeam: { id: string; name: string; logo: string | null };
      awayTeam: { id: string; name: string; logo: string | null };
      league: { id: string; name: string };
    }>>;
  }

  // Create or update team from API
  async upsertFromApi(apiTeam: {
    id: number;
    name: string;
    shortName?: string | null;
    logo: string;
    country?: string;
    founded?: number;
    venue?: string;
  }): Promise<string> {
    const team = await prisma.team.upsert({
      where: { apiId: apiTeam.id },
      update: {
        name: apiTeam.name,
        shortName: apiTeam.shortName || null,
        logo: apiTeam.logo,
        country: apiTeam.country || null,
        founded: apiTeam.founded,
        venue: apiTeam.venue,
      },
      create: {
        apiId: apiTeam.id,
        name: apiTeam.name,
        shortName: apiTeam.shortName || null,
        logo: apiTeam.logo,
        country: apiTeam.country || null,
        founded: apiTeam.founded,
        venue: apiTeam.venue,
        elo: 1500, // Default Elo
      },
    });

    return team.id;
  }
}

export const teamRepository = new TeamRepository();
export default teamRepository;

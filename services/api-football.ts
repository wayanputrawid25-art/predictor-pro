import { matchApiResponseSchema } from '@/types/schemas';
import { retry, sleep } from '@/lib/utils';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY || '';

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Array<{ message: string; token?: string }>;
  results: number;
  paging: { current: number; total: number };
  response: T;
}

class ApiFootballService {
  private apiKey: string;
  private baseUrl: string;
  private rateLimitMs = 10000; // 10 requests per minute for free tier

  constructor(apiKey: string = API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = API_FOOTBALL_BASE;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': this.apiKey,
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  }

  // Get matches by date
  async getMatchesByDate(date: string, league?: number): Promise<ApiFootballResponse<unknown>> {
    const params: Record<string, string> = { date };
    if (league) params.league = league.toString();
    
    return retry(() => this.fetch('/fixtures', params), 3);
  }

  // Get matches by date range
  async getMatchesByDateRange(
    startDate: string,
    endDate: string,
    league?: number
  ): Promise<ApiFootballResponse<unknown>> {
    const params: Record<string, string> = { date: startDate, to: endDate };
    if (league) params.league = league.toString();
    
    return retry(() => this.fetch('/fixtures', params), 3);
  }

  // Get live matches
  async getLiveMatches(): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures', { live: 'all' }), 3);
  }

  // Get match details
  async getMatchDetails(fixtureId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures', { id: fixtureId.toString() }), 3);
  }

  // Get match statistics
  async getMatchStatistics(fixtureId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures/statistics', { fixture: fixtureId.toString() }), 3);
  }

  // Get match events (goals, cards, subs)
  async getMatchEvents(fixtureId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures/events', { fixture: fixtureId.toString() }), 3);
  }

  // Get match lineups
  async getMatchLineups(fixtureId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures/lineups', { fixture: fixtureId.toString() }), 3);
  }

  // Get head-to-head
  async getHeadToHead(team1Id: number, team2Id: number, limit: number = 10): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/fixtures/headtohead', { 
      h2h: `${team1Id}-${team2Id}`,
      limit: limit.toString(),
    }), 3);
  }

  // Get team information
  async getTeam(teamId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/teams', { id: teamId.toString() }), 3);
  }

  // Get team statistics for a season
  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/teams/statistics', { 
      team: teamId.toString(),
      league: leagueId.toString(),
      season: season.toString(),
    }), 3);
  }

  // Get league standings
  async getLeagueStandings(leagueId: number, season: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/standings', { 
      league: leagueId.toString(),
      season: season.toString(),
    }), 3);
  }

  // Get league information
  async getLeague(leagueId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/leagues', { id: leagueId.toString() }), 3);
  }

  // Get leagues by country
  async getLeaguesByCountry(country: string): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/leagues', { country }), 3);
  }

  // Get injuries
  async getInjuries(leagueId?: number, season?: number): Promise<ApiFootballResponse<unknown>> {
    const params: Record<string, string> = {};
    if (leagueId) params.league = leagueId.toString();
    if (season) params.season = season.toString();
    
    return retry(() => this.fetch('/injuries', params), 3);
  }

  // Get team injuries
  async getTeamInjuries(teamId: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/injuries', { team: teamId.toString() }), 3);
  }

  // Get odds for a match
  async getOdds(fixtureId: number, bookmaker?: string): Promise<ApiFootballResponse<unknown>> {
    const params: Record<string, string> = { fixture: fixtureId.toString() };
    if (bookmaker) params.bookmaker = bookmaker;
    
    return retry(() => this.fetch('/odds', params), 3);
  }

  // Get player statistics
  async getPlayerStatistics(teamId: number, season: number): Promise<ApiFootballResponse<unknown>> {
    return retry(() => this.fetch('/players', { 
      team: teamId.toString(),
      season: season.toString(),
    }), 3);
  }
}

export const apiFootball = new ApiFootballService();
export default apiFootball;

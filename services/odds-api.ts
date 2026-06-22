import { oddsResponseSchema } from '@/types/schemas';
import { retry } from '@/lib/utils';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY || '';

interface OddsApiResponse {
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

class OddsApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = ODDS_API_BASE;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apiKey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Odds API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // Get upcoming sports events with odds
  async getUpcomingOdds(
    sport: string = 'soccer',
    region: string = 'eu',
    market: string = 'h2h'
  ): Promise<OddsApiResponse[]> {
    return this.fetch('/sports/' + sport + '/odds', {
      regions: region,
      markets: market,
      oddsFormat: 'decimal',
    });
  }

  // Get odds for specific fixtures
  async getFixturesOdds(
    fixtureIds: string[],
    sport: string = 'soccer',
    region: string = 'eu',
    market: string = 'h2h'
  ): Promise<OddsApiResponse[]> {
    if (fixtureIds.length === 0) return [];
    
    return this.fetch('/sports/' + sport + '/odds', {
      regions: region,
      markets: market,
      oddsFormat: 'decimal',
      eventIds: fixtureIds.join(','),
    });
  }

  // Get historical odds (requires paid tier)
  async getHistoricalOdds(
    sport: string = 'soccer',
    date: string,
    region: string = 'eu',
    market: string = 'h2h'
  ): Promise<OddsApiResponse[]> {
    return this.fetch('/sports/' + sport + '/odds-history', {
      regions: region,
      markets: market,
      oddsFormat: 'decimal',
      date: date,
    });
  }

  // Parse odds data to extract 1X2 and other markets
  parseOddsData(data: OddsApiResponse[]): Array<{
    fixtureId: string;
    homeTeam: string;
    awayTeam: string;
    bookmakers: Array<{
      name: string;
      homeOdds: number;
      drawOdds: number;
      awayOdds: number;
      over25Odds?: number;
      under25Odds?: number;
      bttsYesOdds?: number;
      bttsNoOdds?: number;
    }>;
  }> {
    return data.map(event => {
      const bookmakersData = event.bookmakers.map(bm => {
        const h2hMarket = bm.markets.find(m => m.key === 'h2h');
        const overUnderMarket = bm.markets.find(m => m.key === 'totals');
        const bttsMarket = bm.markets.find(m => m.key === 'btts');
        
        const homeOutcome = h2hMarket?.outcomes.find(o => o.name === event.home_team);
        const drawOutcome = h2hMarket?.outcomes.find(o => o.name === 'Draw');
        const awayOutcome = h2hMarket?.outcomes.find(o => o.name === event.away_team);
        
        const overOutcome = overUnderMarket?.outcomes.find(o => o.name === 'Over');
        const underOutcome = overUnderMarket?.outcomes.find(o => o.name === 'Under');
        
        const bttsYesOutcome = bttsMarket?.outcomes.find(o => o.name === 'Yes');
        const bttsNoOutcome = bttsMarket?.outcomes.find(o => o.name === 'No');
        
        return {
          name: bm.title,
          homeOdds: homeOutcome?.price || 0,
          drawOdds: drawOutcome?.price || 0,
          awayOdds: awayOutcome?.price || 0,
          over25Odds: overOutcome?.point === 2.5 ? overOutcome?.price : undefined,
          under25Odds: underOutcome?.point === 2.5 ? underOutcome?.price : undefined,
          bttsYesOdds: bttsYesOutcome?.price,
          bttsNoOdds: bttsNoOutcome?.price,
        };
      });

      return {
        fixtureId: event.sport_key + '-' + event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        bookmakers: bookmakersData,
      };
    });
  }

  // Calculate implied probabilities from odds
  calculateImpliedProbability(homeOdds: number, drawOdds: number, awayOdds: number): {
    home: number;
    draw: number;
    away: number;
    overround: number;
  } {
    const homeProb = 1 / homeOdds;
    const drawProb = 1 / drawOdds;
    const awayProb = 1 / awayOdds;
    const total = homeProb + drawProb + awayProb;
    const overround = total - 1;

    return {
      home: homeProb / total,
      draw: drawProb / total,
      away: awayProb / total,
      overround,
    };
  }

  // Find best odds across bookmakers
  findBestOdds(
    data: Array<{ bookmaker: string; homeOdds: number; drawOdds: number; awayOdds: number }>
  ): {
    home: { bookmaker: string; odds: number };
    draw: { bookmaker: string; odds: number };
    away: { bookmaker: string; odds: number };
  } {
    let bestHome = { bookmaker: '', odds: 0 };
    let bestDraw = { bookmaker: '', odds: 0 };
    let bestAway = { bookmaker: '', odds: 0 };

    data.forEach(d => {
      if (d.homeOdds > bestHome.odds) {
        bestHome = { bookmaker: d.bookmaker, odds: d.homeOdds };
      }
      if (d.drawOdds > bestDraw.odds) {
        bestDraw = { bookmaker: d.bookmaker, odds: d.drawOdds };
      }
      if (d.awayOdds > bestAway.odds) {
        bestAway = { bookmaker: d.bookmaker, odds: d.awayOdds };
      }
    });

    return { home: bestHome, draw: bestDraw, away: bestAway };
  }
}

export const oddsApi = new OddsApiService();
export default oddsApi;

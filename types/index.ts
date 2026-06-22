// Core domain types for Predictor Pro

export interface League {
  id: string;
  apiId: number;
  name: string;
  country?: string;
  logo?: string;
  flag?: string;
  type: 'league' | 'cup';
  active: boolean;
}

export interface Team {
  id: string;
  apiId: number;
  name: string;
  shortName?: string;
  logo?: string;
  country?: string;
  founded?: number;
  venue?: string;
  elo: number;
}

export interface Match {
  id: string;
  apiId: number;
  date: Date;
  status: MatchStatus;
  minute?: number;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  round?: string;
  season?: string;
  referee?: string;
  homeFormation?: string;
  awayFormation?: string;
  stats?: MatchStats;
  prediction?: Prediction;
  odds?: MatchOdds[];
  events?: MatchEvent[];
}

export type MatchStatus = 'NS' | 'LIVE' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'INT';

export interface MatchStats {
  homeShots?: number;
  awayShots?: number;
  homeShotsOnGoal?: number;
  awayShotsOnGoal?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeYellows?: number;
  awayYellows?: number;
  homeReds?: number;
  awayReds?: number;
  homePasses?: number;
  awayPasses?: number;
  homePassAccuracy?: number;
  awayPassAccuracy?: number;
  homePossession?: number;
  awayPossession?: number;
  homeSaves?: number;
  awaySaves?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var';
  minute: number;
  team: 'home' | 'away';
  player?: string;
  assist?: string;
  detail?: string;
}

export interface MatchOdds {
  id: string;
  matchId: string;
  bookmaker: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  over25Odds?: number;
  under25Odds?: number;
  bttsYesOdds?: number;
  bttsNoOdds?: number;
  handicapHome?: number;
  handicapAway?: number;
  handicapOdds?: number;
  homeImpliedProb?: number;
  drawImpliedProb?: number;
  awayImpliedProb?: number;
}

export interface Prediction {
  id: string;
  matchId: string;
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
  factors?: PredictionFactors;
  aiGenerated: boolean;
}

export interface PredictionFactors {
  eloDifference: number;
  formDifference: number;
  homeAdvantageValue: number;
  recentGoalAverage: number;
  oddsImpliedProbability: number;
  poissonExpectedHomeGoals: number;
  poissonExpectedAwayGoals: number;
  bttsProbability: number;
}

export interface Standing {
  id: string;
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form?: string;
}

export interface Injury {
  id: string;
  teamId: string;
  team?: Team;
  player: string;
  type: 'suspension' | 'injury';
  reason?: string;
  status?: string;
  returnDate?: Date;
}

export interface H2HRecord {
  id: string;
  date: Date;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  leagueId: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Dashboard types
export interface DashboardData {
  todayMatches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  topLeagues: League[];
}

// Form data for API requests
export interface PredictionRequest {
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  matchDate: Date;
}

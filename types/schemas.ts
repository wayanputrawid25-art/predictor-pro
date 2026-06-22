import { z } from 'zod';

// Match validation schemas
export const matchStatusSchema = z.enum(['NS', 'LIVE', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'INT']);
export const matchApiResponseSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({
      short: z.string(),
      elapsed: z.number().optional(),
    }),
    venue: z.object({ name: z.string() }).optional(),
    referee: z.string().nullable(),
  }),
  league: z.object({
    id: z.number(),
    name: z.string(),
    country: z.string(),
    logo: z.string(),
    flag: z.string().nullable(),
  }),
  teams: z.object({
    home: z.object({
      id: z.number(),
      name: z.string(),
      shortName: z.string().nullable(),
      logo: z.string(),
    }),
    away: z.object({
      id: z.number(),
      name: z.string(),
      shortName: z.string().nullable(),
      logo: z.string(),
    }),
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
});

export const matchListResponseSchema = z.object({
  get: z.string(),
  parameters: z.record(z.any()),
  results: z.number(),
  paging: z.object({
    current: z.number(),
    total: z.number(),
  }),
  response: z.array(matchApiResponseSchema),
});

// Odds API schemas
export const oddsResponseSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      markets: z.array(
        z.object({
          key: z.string(),
          outcomes: z.array(
            z.object({
              name: z.string(),
              price: z.number(),
              point: z.number().optional(),
            })
          ),
        })
      ),
    })
  ),
});

// Prediction request/response schemas
export const predictionRequestSchema = z.object({
  homeTeamId: z.string().min(1, 'Home team ID is required'),
  awayTeamId: z.string().min(1, 'Away team ID is required'),
  leagueId: z.string().min(1, 'League ID is required'),
  matchDate: z.string().datetime(),
});

export const predictionResponseSchema = z.object({
  homeWinProb: z.number().min(0).max(1),
  drawProb: z.number().min(0).max(1),
  awayWinProb: z.number().min(0).max(1),
  bttsYesProb: z.number().min(0).max(1).optional(),
  bttsNoProb: z.number().min(0).max(1).optional(),
  over25Prob: z.number().min(0).max(1).optional(),
  under25Prob: z.number().min(0).max(1).optional(),
  homeHandicap: z.string().optional(),
  handicapProb: z.number().min(0).max(1).optional(),
  predictedHomeScore: z.number().int().min(0),
  predictedAwayScore: z.number().int().min(0),
  confidence: z.number().min(0).max(100),
  eloHome: z.number(),
  eloAway: z.number(),
  formHome: z.number(),
  formAway: z.number(),
  homeAdvantage: z.number(),
  factors: z.object({
    eloDifference: z.number(),
    formDifference: z.number(),
    homeAdvantageValue: z.number(),
    recentGoalAverage: z.number(),
    oddsImpliedProbability: z.number(),
    poissonExpectedHomeGoals: z.number(),
    poissonExpectedAwayGoals: z.number(),
    bttsProbability: z.number(),
  }).optional(),
  aiGenerated: z.boolean(),
});

// League standings schema
export const standingsSchema = z.object({
  league: z.object({
    id: z.number(),
    name: z.string(),
    country: z.string(),
    logo: z.string(),
    season: z.number(),
  }),
  standings: z.array(
    z.array(
      z.object({
        rank: z.number(),
        team: z.object({
          id: z.number(),
          name: z.string(),
          logo: z.string(),
        }),
        points: z.number(),
        played: z.number(),
        form: z.string().nullable(),
        goalsDiff: z.number(),
        all: z.object({
          played: z.number(),
          win: z.number(),
          draw: z.number(),
          lose: z.number(),
          goals: z.object({
            for: z.number(),
            against: z.number(),
          }),
        }),
        home: z.object({
          played: z.number(),
          win: z.number(),
          draw: z.number(),
          lose: z.number(),
          goals: z.object({
            for: z.number(),
            against: z.number(),
          }),
        }),
        away: z.object({
          played: z.number(),
          win: z.number(),
          draw: z.number(),
          lose: z.number(),
          goals: z.object({
            for: z.number(),
            against: z.number(),
          }),
        }),
      })
    )
  ),
});

// API Query parameters schemas
export const matchQuerySchema = z.object({
  date: z.string().optional(),
  league: z.string().optional(),
  season: z.string().optional(),
  status: z.enum(['NS', 'LIVE', 'FT', 'all']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type MatchQuery = z.infer<typeof matchQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;

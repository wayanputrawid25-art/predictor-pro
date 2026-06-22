-- Migration: Initial schema
-- Created: 2024

-- CreateLeagueTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "apiId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "logo" TEXT,
    "flag" TEXT,
    "type" TEXT NOT NULL DEFAULT 'league',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "League_apiId_key" ON "League"("apiId");
CREATE INDEX "League_apiId" ON "League"("apiId");
CREATE INDEX "League_country" ON "League"("country");

-- CreateTeamTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "apiId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logo" TEXT,
    "country" TEXT,
    "founded" INTEGER,
    "venue" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "elo" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_apiId_key" ON "Team"("apiId");
CREATE INDEX "Team_apiId" ON "Team"("apiId");
CREATE INDEX "Team_name" ON "Team"("name");

-- CreateMatchTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "apiId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NS',
    "minute" INTEGER,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homePenalties" INTEGER,
    "awayPenalties" INTEGER,
    "venue" TEXT,
    "round" TEXT,
    "season" TEXT,
    "referee" TEXT,
    "attendance" INTEGER,
    "weather" TEXT,
    "temperature" DOUBLE PRECISION,
    "homeFormation" TEXT,
    "awayFormation" TEXT,
    "homeYellowCards" INTEGER,
    "awayYellowCards" INTEGER,
    "homeRedCards" INTEGER,
    "awayRedCards" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Match_apiId_key" ON "Match"("apiId");
CREATE INDEX "Match_apiId" ON "Match"("apiId");
CREATE INDEX "Match_date" ON "Match"("date");
CREATE INDEX "Match_status" ON "Match"("status");
CREATE INDEX "Match_leagueId" ON "Match"("leagueId");
CREATE INDEX "Match_homeTeamId" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId" ON "Match"("awayTeamId");

-- CreateMatchStatsTable
CREATE TABLE "MatchStats" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeShots" INTEGER,
    "awayShots" INTEGER,
    "homeShotsOnGoal" INTEGER,
    "awayShotsOnGoal" INTEGER,
    "homeCorners" INTEGER,
    "awayCorners" INTEGER,
    "homeFouls" INTEGER,
    "awayFouls" INTEGER,
    "homeYellows" INTEGER,
    "awayYellows" INTEGER,
    "homeReds" INTEGER,
    "awayReds" INTEGER,
    "homePasses" INTEGER,
    "awayPasses" INTEGER,
    "homePassAccuracy" DOUBLE PRECISION,
    "awayPassAccuracy" DOUBLE PRECISION,
    "homePossession" DOUBLE PRECISION,
    "awayPossession" DOUBLE PRECISION,
    "homeSaves" INTEGER,
    "awaySaves" INTEGER,
    "homeOffsides" INTEGER,
    "awayOffsides" INTEGER,
    "homeDribbles" INTEGER,
    "awayDribbles" INTEGER,
    "homeTackles" INTEGER,
    "awayTackles" INTEGER,
    "homeInterceptions" INTEGER,
    "awayInterceptions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchStats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MatchStats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "MatchStats_matchId_key" ON "MatchStats"("matchId");
CREATE INDEX "MatchStats_matchId" ON "MatchStats"("matchId");

-- CreateMatchEventTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "player" TEXT,
    "assist" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE INDEX "MatchEvent_matchId" ON "MatchEvent"("matchId");

-- CreateH2HRecordTable
CREATE TABLE "H2HRecord" (
    "id" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "leagueId" TEXT NOT NULL,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "H2HRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "H2HRecord_homeTeamId_awayTeamId" ON "H2HRecord"("homeTeamId", "awayTeamId");

-- CreateMatchOddsTable
CREATE TABLE "MatchOdds" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "homeOdds" DOUBLE PRECISION NOT NULL,
    "drawOdds" DOUBLE PRECISION NOT NULL,
    "awayOdds" DOUBLE PRECISION NOT NULL,
    "over25Odds" DOUBLE PRECISION,
    "under25Odds" DOUBLE PRECISION,
    "bttsYesOdds" DOUBLE PRECISION,
    "bttsNoOdds" DOUBLE PRECISION,
    "handicapHome" DOUBLE PRECISION,
    "handicapAway" DOUBLE PRECISION,
    "handicapOdds" DOUBLE PRECISION,
    "homeImpliedProb" DOUBLE PRECISION,
    "drawImpliedProb" DOUBLE PRECISION,
    "awayImpliedProb" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchOdds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MatchOdds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE INDEX "MatchOdds_matchId" ON "MatchOdds"("matchId");
CREATE INDEX "MatchOdds_bookmaker" ON "MatchOdds"("bookmaker");

-- CreatePredictionTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeWinProb" DOUBLE PRECISION NOT NULL,
    "drawProb" DOUBLE PRECISION NOT NULL,
    "awayWinProb" DOUBLE PRECISION NOT NULL,
    "bttsYesProb" DOUBLE PRECISION,
    "bttsNoProb" DOUBLE PRECISION,
    "over25Prob" DOUBLE PRECISION,
    "under25Prob" DOUBLE PRECISION,
    "homeHandicap" TEXT,
    "handicapProb" DOUBLE PRECISION,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "eloHome" DOUBLE PRECISION NOT NULL,
    "eloAway" DOUBLE PRECISION NOT NULL,
    "formHome" DOUBLE PRECISION NOT NULL,
    "formAway" DOUBLE PRECISION NOT NULL,
    "homeAdvantage" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Prediction_matchId_key" ON "Prediction"("matchId");
CREATE INDEX "Prediction_matchId" ON "Prediction"("matchId");
CREATE INDEX "Prediction_confidence" ON "Prediction"("confidence");

-- CreateLeagueStandingTable
CREATE TABLE "LeagueStanding" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "form" TEXT,
    "season" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeagueStanding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeagueStanding_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE,
    CONSTRAINT "LeagueStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
    CONSTRAINT "LeagueStanding_leagueId_teamId_season_unique" UNIQUE ("leagueId", "teamId", "season")
);

CREATE INDEX "LeagueStanding_leagueId_position" ON "LeagueStanding"("leagueId", "position");

-- CreateTeamStandingTable
CREATE TABLE "TeamStanding" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "homePlayed" INTEGER NOT NULL DEFAULT 0,
    "homeWon" INTEGER NOT NULL DEFAULT 0,
    "homeDrawn" INTEGER NOT NULL DEFAULT 0,
    "homeLost" INTEGER NOT NULL DEFAULT 0,
    "homeGF" INTEGER NOT NULL DEFAULT 0,
    "homeGA" INTEGER NOT NULL DEFAULT 0,
    "awayPlayed" INTEGER NOT NULL DEFAULT 0,
    "awayWon" INTEGER NOT NULL DEFAULT 0,
    "awayDrawn" INTEGER NOT NULL DEFAULT 0,
    "awayLost" INTEGER NOT NULL DEFAULT 0,
    "awayGF" INTEGER NOT NULL DEFAULT 0,
    "awayGA" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamStanding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
    CONSTRAINT "TeamStanding_teamId_season_leagueId_unique" UNIQUE ("teamId", "season", "leagueId")
);

CREATE INDEX "TeamStanding_teamId" ON "TeamStanding"("teamId");

-- CreateInjuryTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "player" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT,
    "returnDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Injury_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE
);

CREATE INDEX "Injury_teamId" ON "Injury"("teamId");

-- CreateFormHistoryTable
CREATE TABLE "FormHistory" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "goalsFor" INTEGER NOT NULL,
    "goalsAgainst" INTEGER NOT NULL,
    "homeAway" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FormHistory_teamId_matchId_unique" UNIQUE ("teamId", "matchId")
);

CREATE INDEX "FormHistory_teamId_date" ON "FormHistory"("teamId", "date");

-- CreateRateLimitLogTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RateLimitLog_ip_endpoint_windowStart" ON "RateLimitLog"("ip", "endpoint", "windowStart");
CREATE INDEX "RateLimitLog_windowStart" ON "RateLimitLog"("windowStart");

-- CreateCacheEntryTable
CREATE TABLE "CacheEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CacheEntry_key_key" ON "CacheEntry"("key");
CREATE INDEX "CacheEntry_expiresAt" ON "CacheEntry"("expiresAt");

-- CreateCronLogTable
CREATE TABLE "CronLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    CONSTRAINT "CronLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronLog_jobName_startedAt" ON "CronLog"("jobName", "startedAt");

-- Commit transaction
COMMIT;

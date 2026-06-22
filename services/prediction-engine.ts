import { Prediction, PredictionFactors } from '@/types';

// Elo Rating Constants
const K_FACTOR = 32;
const HOME_ADVANTAGE_ELO = 65;
const DEFAULT_ELO = 1500;

// Form calculation constants
const FORM_WEIGHTS = [1.0, 0.9, 0.8, 0.7, 0.6]; // Most recent first
const MATCHES_TO_CONSIDER = 5;

// Poisson distribution for goal prediction
export function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Calculate expected goals using Poisson
export function calculateExpectedGoals(
  eloHome: number,
  eloAway: number,
  formHome: number,
  formAway: number,
  homeAdvantage: number
): { homeExpected: number; awayExpected: number } {
  // Elo difference impact
  const eloDiff = (eloHome + homeAdvantage) - eloAway;
  const eloFactor = eloDiff / 400;
  
  // Base expected goals (league average ~2.5 goals per game)
  const baseHomeGoals = 1.35;
  const baseAwayGoals = 1.05;
  
  // Form factor (0.8 to 1.2 range)
  const formFactor = (formHome + (2 - formAway)) / 2;
  
  // Calculate expected goals
  const homeExpected = baseHomeGoals * Math.pow(10, eloFactor) * (0.9 + formFactor * 0.1);
  const awayExpected = baseAwayGoals * Math.pow(10, -eloFactor) * (0.9 + (2 - formFactor) * 0.1);
  
  return {
    homeExpected: Math.max(0.3, Math.min(homeExpected, 4.5)),
    awayExpected: Math.max(0.2, Math.min(awayExpected, 4.0)),
  };
}

// Calculate Elo rating change
export function calculateEloChange(
  currentElo: number,
  opponentElo: number,
  goalsFor: number,
  goalsAgainst: number,
  isHome: boolean,
  kFactor: number = K_FACTOR
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo - (isHome ? HOME_ADVANTAGE_ELO : 0)) / 400));
  
  // Actual score based on result and goal difference
  let actualScore: number;
  if (goalsFor > goalsAgainst) {
    actualScore = 1;
  } else if (goalsFor < goalsAgainst) {
    actualScore = 0;
  } else {
    actualScore = 0.5;
  }
  
  // Adjust for goal difference (up to 0.2 bonus)
  const goalDiff = Math.abs(goalsFor - goalsAgainst);
  const goalBonus = Math.min(goalDiff * 0.05, 0.2);
  actualScore = Math.max(0, Math.min(1, actualScore + (actualScore > 0.5 ? goalBonus : -goalBonus)));
  
  return Math.round(kFactor * (actualScore - expectedScore));
}

// Calculate team form (0-2 scale, 1 = average)
export function calculateForm(results: Array<'W' | 'D' | 'L'>, weights: number[] = FORM_WEIGHTS): number {
  if (results.length === 0) return 1;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  results.slice(0, MATCHES_TO_CONSIDER).forEach((result, index) => {
    let points: number;
    switch (result) {
      case 'W': points = 2; break;
      case 'D': points = 1; break;
      case 'L': points = 0; break;
    }
    const weight = weights[index] || 0.5;
    weightedSum += points * weight;
    totalWeight += weight * 2; // Max points is 2
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 1;
}

// Calculate BTTS probability
export function calculateBTTSProbability(
  homeExpected: number,
  awayExpected: number,
  formHome: number,
  formAway: number
): number {
  // P(BTTS Yes) = P(Home scores >= 1) * P(Away scores >= 1)
  // Using Poisson CDF for this
  
  const homeScoringProb = 1 - poissonProbability(homeExpected, 0);
  const awayScoringProb = 1 - poissonProbability(awayExpected, 0);
  
  // Adjust based on recent BTTS form
  const formAdjust = (formHome + formAway) / 2;
  
  return Math.max(0.1, Math.min(0.9, homeScoringProb * awayScoringProb * (0.8 + formAdjust * 0.2)));
}

// Calculate Over/Under 2.5 probability
export function calculateOverUnderProbability(
  homeExpected: number,
  awayExpected: number
): { over25: number; under25: number } {
  const totalExpected = homeExpected + awayExpected;
  
  // Calculate P(goals <= 2) using Poisson
  let p0 = poissonProbability(totalExpected, 0);
  let p1 = poissonProbability(totalExpected, 1);
  let p2 = poissonProbability(totalExpected, 2);
  
  const under25 = p0 + p1 + p2;
  const over25 = 1 - under25;
  
  return { over25: Math.max(0.1, Math.min(0.9, over25)), under25: 1 - over25 };
}

// Main prediction function
export function generatePrediction(params: {
  eloHome: number;
  eloAway: number;
  formHome: number;
  formAway: number;
  homeAdvantage?: number;
  recentGoalAverage?: number;
  oddsImpliedProb?: number;
}): Prediction & { factors: PredictionFactors } {
  const {
    eloHome,
    eloAway,
    formHome,
    formAway,
    homeAdvantage = HOME_ADVANTAGE_ELO,
    recentGoalAverage = 2.5,
    oddsImpliedProb,
  } = params;
  
  // Calculate expected goals using Poisson
  const { homeExpected, awayExpected } = calculateExpectedGoals(
    eloHome,
    eloAway,
    formHome,
    formAway,
    homeAdvantage
  );
  
  // Calculate win probabilities using Elo
  const eloDiff = eloHome + homeAdvantage - eloAway;
  const eloHomeWin = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const eloAwayWin = 1 / (1 + Math.pow(10, eloDiff / 400));
  const drawElo = 1 - eloHomeWin - eloAwayWin + 0.5 * (eloHomeWin + eloAwayWin);
  
  // Blend with form
  const formTotal = formHome + formAway;
  const formWeight = 0.3;
  const eloWeight = 1 - formWeight;
  
  const blendedHomeWin = eloWeight * eloHomeWin + formWeight * (formHome / (formHome + formAway + 0.01));
  const blendedAwayWin = eloWeight * eloAwayWin + formWeight * (formAway / (formHome + formAway + 0.01));
  const blendedDraw = Math.max(0.05, 1 - blendedHomeWin - blendedAwayWin);
  
  // Normalize
  const total = blendedHomeWin + blendedAwayWin + blendedDraw;
  const homeWinProb = blendedHomeWin / total;
  const awayWinProb = blendedAwayWin / total;
  const drawProb = blendedDraw / total;
  
  // Calculate BTTS
  const bttsYesProb = calculateBTTSProbability(homeExpected, awayExpected, formHome, formAway);
  const bttsNoProb = 1 - bttsYesProb;
  
  // Calculate Over/Under
  const { over25, under25 } = calculateOverUnderProbability(homeExpected, awayExpected);
  
  // Predict score using Poisson
  let predictedHomeScore = 0;
  let predictedAwayScore = 0;
  let maxProb = 0;
  
  for (let home = 0; home <= 5; home++) {
    for (let away = 0; away <= 5; away++) {
      const prob = poissonProbability(homeExpected, home) * poissonProbability(awayExpected, away);
      if (prob > maxProb) {
        maxProb = prob;
        predictedHomeScore = home;
        predictedAwayScore = away;
      }
    }
  }
  
  // Adjust predicted score based on probabilities
  if (homeWinProb > awayWinProb && homeWinProb > drawProb) {
    predictedHomeScore = Math.max(predictedHomeScore, Math.round(homeExpected));
  } else if (awayWinProb > homeWinProb) {
    predictedAwayScore = Math.max(predictedAwayScore, Math.round(awayExpected));
  }
  
  // Calculate confidence
  let confidence = 50;
  
  // Increase confidence based on:
  // 1. Stronger team disparity (Elo difference)
  const eloConfidence = Math.min(25, Math.abs(eloDiff) / 40);
  confidence += eloConfidence;
  
  // 2. Consistent recent form
  const formConfidence = Math.abs(formHome - formAway) * 10;
  confidence += formConfidence;
  
  // 3. Recent high-scoring games
  if (recentGoalAverage > 2.8) confidence += 5;
  if (recentGoalAverage < 2.2) confidence -= 5;
  
  // 4. Odds alignment (if available)
  if (oddsImpliedProb) {
    const oddsAlignment = 1 - Math.abs(homeWinProb - oddsImpliedProb);
    confidence += oddsAlignment * 10;
  }
  
  // Clamp confidence
  confidence = Math.max(15, Math.min(95, confidence));
  
  // Calculate Asian Handicap
  const goalDiff = predictedHomeScore - predictedAwayScore;
  let handicap: string;
  let handicapProb: number;
  
  if (goalDiff >= 2) {
    handicap = '-1.5';
    handicapProb = homeWinProb * 0.85;
  } else if (goalDiff === 1) {
    handicap = '-0.75';
    handicapProb = (homeWinProb + drawProb) * 0.9;
  } else if (goalDiff === 0) {
    handicap = '0';
    handicapProb = drawProb + 0.1;
  } else if (goalDiff === -1) {
    handicap = '+0.75';
    handicapProb = (awayWinProb + drawProb) * 0.9;
  } else {
    handicap = '+1.5';
    handicapProb = awayWinProb * 0.85 + drawProb * 0.5;
  }
  
  const factors: PredictionFactors = {
    eloDifference: eloDiff,
    formDifference: formHome - formAway,
    homeAdvantageValue: homeAdvantage,
    recentGoalAverage,
    oddsImpliedProbability: oddsImpliedProb || 0,
    poissonExpectedHomeGoals: homeExpected,
    poissonExpectedAwayGoals: awayExpected,
    bttsProbability: bttsYesProb,
  };
  
  return {
    homeWinProb,
    drawProb,
    awayWinProb,
    bttsYesProb,
    bttsNoProb,
    over25Prob: over25,
    under25Prob: under25,
    homeHandicap: handicap,
    handicapProb,
    predictedHomeScore,
    predictedAwayScore,
    confidence,
    eloHome,
    eloAway,
    formHome,
    formAway,
    homeAdvantage,
    factors,
    aiGenerated: false,
  };
}

// Export all prediction data for storage
export interface StoredPrediction {
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
  factors: PredictionFactors;
  aiGenerated: boolean;
}

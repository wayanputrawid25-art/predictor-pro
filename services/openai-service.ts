import OpenAI from 'openai';
import { Prediction } from '@/types';

const API_KEY = process.env.OPENAI_API_KEY || '';

class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (API_KEY) {
      this.client = new OpenAI({
        apiKey: API_KEY,
      });
    }
  }

  private getClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }
    return this.client;
  }

  // Generate AI-enhanced prediction analysis
  async generatePredictionAnalysis(params: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    homeForm: string;
    awayForm: string;
    h2hResults: Array<{
      date: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
    }>;
    statistics: {
      homeTeam: {
        avgGoalsFor: number;
        avgGoalsAgainst: number;
        homeWinRate: number;
        recentCleanSheets: number;
      };
      awayTeam: {
        avgGoalsFor: number;
        avgGoalsAgainst: number;
        awayWinRate: number;
        recentCleanSheets: number;
      };
    };
    prediction: Prediction;
  }): Promise<string> {
    if (!this.client) {
      return 'OpenAI API not configured. Using statistical prediction only.';
    }

    const prompt = this.buildPredictionPrompt(params);

    try {
      const response = await this.getClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert football analyst. Provide concise, data-driven match predictions.
            Focus on objective analysis backed by statistics. Be confident but acknowledge uncertainty.
            Format your response in clear sections. Keep it under 300 words.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to generate analysis.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return 'Error generating AI analysis. Using statistical prediction only.';
    }
  }

  private buildPredictionPrompt(params: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    homeForm: string;
    awayForm: string;
    h2hResults: Array<{
      date: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
    }>;
    statistics: {
      homeTeam: {
        avgGoalsFor: number;
        avgGoalsAgainst: number;
        homeWinRate: number;
        recentCleanSheets: number;
      };
      awayTeam: {
        avgGoalsFor: number;
        avgGoalsAgainst: number;
        awayWinRate: number;
        recentCleanSheets: number;
      };
    };
    prediction: Prediction;
  }): string {
    const { homeTeam, awayTeam, league, homeForm, awayForm, h2hResults, statistics, prediction } = params;

    return `
## Match Analysis Request

**Match:** ${homeTeam} vs ${awayTeam}
**League:** ${league}

### Current Form
- ${homeTeam} (Home): ${homeForm}
- ${awayTeam} (Away): ${awayForm}

### Key Statistics
**${homeTeam}:**
- Avg Goals Scored: ${statistics.homeTeam.avgGoalsFor}
- Avg Goals Conceded: ${statistics.homeTeam.avgGoalsAgainst}
- Home Win Rate: ${(statistics.homeTeam.homeWinRate * 100).toFixed(1)}%
- Recent Clean Sheets: ${statistics.homeTeam.recentCleanSheets}/5

**${awayTeam}:**
- Avg Goals Scored: ${statistics.awayTeam.avgGoalsFor}
- Avg Goals Conceded: ${statistics.awayTeam.avgGoalsAgainst}
- Away Win Rate: ${(statistics.awayTeam.awayWinRate * 100).toFixed(1)}%
- Recent Clean Sheets: ${statistics.awayTeam.recentCleanSheets}/5

### Head to Head (Last 5)
${h2hResults.map(r => `- ${r.date}: ${r.homeTeam} ${r.homeScore} - ${r.awayScore} ${r.awayTeam}`).join('\n')}

### Statistical Prediction
- Home Win: ${(prediction.homeWinProb * 100).toFixed(1)}%
- Draw: ${(prediction.drawProb * 100).toFixed(1)}%
- Away Win: ${(prediction.awayWinProb * 100).toFixed(1)}%
- Predicted Score: ${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}
- Confidence: ${prediction.confidence.toFixed(0)}%
- BTTS Yes: ${prediction.bttsYesProb ? (prediction.bttsYesProb * 100).toFixed(1) + '%' : 'N/A'}
- Over 2.5: ${prediction.over25Prob ? (prediction.over25Prob * 100).toFixed(1) + '%' : 'N/A'}

### Request
Provide a concise analysis highlighting:
1. Key factors favoring each team
2. Potential value bets
3. Risk assessment
4. Final recommendation
`;
  }

  // Generate match summary for quick view
  async generateMatchSummary(params: {
    homeTeam: string;
    awayTeam: string;
    prediction: Prediction;
    isLive?: boolean;
    liveScore?: { home: number; away: number };
  }): Promise<string> {
    if (!this.client) {
      return `Predicted: ${params.prediction.predictedHomeScore} - ${params.prediction.predictedAwayScore}`;
    }

    const { homeTeam, awayTeam, prediction, isLive, liveScore } = params;

    try {
      const response = await this.getClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a very brief match summary (50 words max). Focus on the key prediction.'
          },
          {
            role: 'user',
            content: isLive && liveScore
              ? `${homeTeam} ${liveScore.home} - ${liveScore.away} ${awayTeam} (LIVE). Predicted: ${prediction.predictedHomeScore}-${prediction.predictedAwayScore}. Confidence: ${prediction.confidence}%.`
              : `${homeTeam} vs ${awayTeam}. Predicted: ${prediction.predictedHomeScore}-${prediction.predictedAwayScore} (${(prediction.homeWinProb * 100).toFixed(0)}% home win). Confidence: ${prediction.confidence}%.`
          }
        ],
        max_tokens: 100,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || 
        `Predicted: ${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}`;
    } catch (error) {
      return `Predicted: ${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}`;
    }
  }
}

export const openaiService = new OpenAIService();
export default openaiService;

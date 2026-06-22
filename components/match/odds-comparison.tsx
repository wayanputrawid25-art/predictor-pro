'use client';

import { MatchOdds } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatOdds, oddsToProbability } from '@/lib/utils';

interface OddsComparisonProps {
  odds: MatchOdds[];
  prediction?: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
  };
}

export function OddsComparison({ odds, prediction }: OddsComparisonProps) {
  if (odds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Odds Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No odds data available</p>
        </CardContent>
      </Card>
    );
  }

  // Find best odds
  const bestOdds = odds.reduce(
    (acc, curr) => ({
      home: curr.homeOdds > acc.home.odds ? { odds: curr.homeOdds, bookmaker: curr.bookmaker } : acc.home,
      draw: curr.drawOdds > acc.draw.odds ? { odds: curr.drawOdds, bookmaker: curr.bookmaker } : acc.draw,
      away: curr.awayOdds > acc.away.odds ? { odds: curr.awayOdds, bookmaker: curr.bookmaker } : acc.away,
    }),
    {
      home: { odds: 0, bookmaker: '' },
      draw: { odds: 0, bookmaker: '' },
      away: { odds: 0, bookmaker: '' },
    }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Odds Comparison</CardTitle>
          <Badge variant="outline">{odds.length} bookmakers</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best odds highlight */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Home Win</div>
            <div className="text-2xl font-bold text-green-500">{formatOdds(bestOdds.home.odds)}</div>
            <div className="text-xs text-muted-foreground truncate">{bestOdds.home.bookmaker}</div>
            {prediction && (
              <div className="text-xs mt-1">
                Our: {Math.round(prediction.homeWinProb * 100)}%
              </div>
            )}
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Draw</div>
            <div className="text-2xl font-bold">{formatOdds(bestOdds.draw.odds)}</div>
            <div className="text-xs text-muted-foreground truncate">{bestOdds.draw.bookmaker}</div>
            {prediction && (
              <div className="text-xs mt-1">
                Our: {Math.round(prediction.drawProb * 100)}%
              </div>
            )}
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Away Win</div>
            <div className="text-2xl font-bold text-blue-500">{formatOdds(bestOdds.away.odds)}</div>
            <div className="text-xs text-muted-foreground truncate">{bestOdds.away.bookmaker}</div>
            {prediction && (
              <div className="text-xs mt-1">
                Our: {Math.round(prediction.awayWinProb * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Full odds table */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium">
            <div>Bookmaker</div>
            <div className="text-center">Home</div>
            <div className="text-center">Draw</div>
            <div className="text-center">Away</div>
          </div>
          {odds.slice(0, 5).map((odd) => (
            <div key={odd.id} className="grid grid-cols-4 gap-2 text-sm py-1 border-b">
              <div className="truncate font-medium">{odd.bookmaker}</div>
              <div className={`text-center ${odd.homeOdds === bestOdds.home.odds ? 'text-green-500 font-bold' : ''}`}>
                {formatOdds(odd.homeOdds)}
              </div>
              <div className={`text-center ${odd.drawOdds === bestOdds.draw.odds ? 'font-bold' : ''}`}>
                {formatOdds(odd.drawOdds)}
              </div>
              <div className={`text-center ${odd.awayOdds === bestOdds.away.odds ? 'text-blue-500 font-bold' : ''}`}>
                {formatOdds(odd.awayOdds)}
              </div>
            </div>
          ))}
        </div>

        {/* Over/Under & BTTS */}
        {odds[0].over25Odds && (
          <div className="pt-4 border-t space-y-2">
            <div className="text-sm font-medium">Goals</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Over 2.5</span>
                <span className="font-medium">{formatOdds(odds[0].over25Odds || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Under 2.5</span>
                <span className="font-medium">{formatOdds(odds[0].under25Odds || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {odds[0].bttsYesOdds && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Both Teams To Score</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Yes</span>
                <span className="font-medium">{formatOdds(odds[0].bttsYesOdds || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>No</span>
                <span className="font-medium">{formatOdds(odds[0].bttsNoOdds || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

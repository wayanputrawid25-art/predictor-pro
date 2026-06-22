'use client';

import { MatchStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchStatsProps {
  stats: MatchStats | null;
  homeTeam: string;
  awayTeam: string;
}

export function MatchStatsCard({ stats, homeTeam, awayTeam }: MatchStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const statRows = [
    { label: 'Shots', home: stats.homeShots, away: stats.awayShots },
    { label: 'Shots on Target', home: stats.homeShotsOnGoal, away: stats.awayShotsOnGoal },
    { label: 'Corners', home: stats.homeCorners, away: stats.awayCorners },
    { label: 'Fouls', home: stats.homeFouls, away: stats.awayFouls },
    { label: 'Yellow Cards', home: stats.homeYellows, away: stats.awayYellows },
    { label: 'Red Cards', home: stats.homeReds, away: stats.awayReds },
    { label: 'Offsides', home: stats.homeOffsides, away: stats.awayOffsides },
    { label: 'Saves', home: stats.homeSaves, away: stats.awaySaves },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statRows.map((row) => {
          if (row.home === undefined && row.away === undefined) return null;
          const total = (row.home || 0) + (row.away || 0);
          const homePercent = total > 0 ? ((row.home || 0) / total) * 100 : 50;

          return (
            <div key={row.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{row.home || 0}</span>
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.away || 0}</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all"
                  style={{ width: `${homePercent}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-secondary transition-all"
                  style={{ width: `${100 - homePercent}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Possession */}
        {(stats.homePossession !== undefined || stats.awayPossession !== undefined) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{stats.homePossession?.toFixed(1) || 0}%</span>
              <span className="text-muted-foreground">Possession</span>
              <span className="font-medium">{stats.awayPossession?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${stats.homePossession || 50}%` }}
              />
              <div
                className="absolute right-0 top-0 h-full bg-secondary transition-all"
                style={{ width: `${stats.awayPossession || 50}%` }}
              />
            </div>
          </div>
        )}

        {/* Pass Accuracy */}
        {(stats.homePassAccuracy !== undefined || stats.awayPassAccuracy !== undefined) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{stats.homePassAccuracy?.toFixed(1) || 0}%</span>
              <span className="text-muted-foreground">Pass Accuracy</span>
              <span className="font-medium">{stats.awayPassAccuracy?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${stats.homePassAccuracy || 50}%` }}
              />
              <div
                className="absolute right-0 top-0 h-full bg-secondary transition-all"
                style={{ width: `${stats.awayPassAccuracy || 50}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { H2HRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';

interface H2HSectionProps {
  records: H2HRecord[];
  homeTeam: { name: string; logo?: string };
  awayTeam: { name: string; logo?: string };
}

export function H2HSection({ records, homeTeam, awayTeam }: H2HSectionProps) {
  // Calculate stats
  const stats = records.reduce(
    (acc, record) => {
      if (record.homeScore > record.awayScore) acc.homeWins++;
      else if (record.homeScore < record.awayScore) acc.awayWins++;
      else acc.draws++;
      acc.totalGoals += record.homeScore + record.awayScore;
      return acc;
    },
    { homeWins: 0, awayWins: 0, draws: 0, totalGoals: 0 }
  );

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Head to Head</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No head-to-head data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Head to Head</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-500">{homeTeam.name}: {stats.homeWins}</span>
            <span className="text-muted-foreground">Draws: {stats.draws}</span>
            <span className="text-blue-500">{awayTeam.name}: {stats.awayWins}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.slice(0, 10).map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {record.homeTeam.logo && (
                <Image
                  src={record.homeTeam.logo}
                  alt={record.homeTeam.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-sm font-medium">{record.homeTeam.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tabular-nums">
                {record.homeScore}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className="text-lg font-bold tabular-nums">
                {record.awayScore}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-right">{record.awayTeam.name}</span>
              {record.awayTeam.logo && (
                <Image
                  src={record.awayTeam.logo}
                  alt={record.awayTeam.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-green-500">{stats.homeWins}</div>
              <div className="text-muted-foreground">Home Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.draws}</div>
              <div className="text-muted-foreground">Draws</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{stats.awayWins}</div>
              <div className="text-muted-foreground">Away Wins</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-muted-foreground">Average Goals: </span>
            <span className="font-medium">{(stats.totalGoals / records.length).toFixed(1)} per game</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

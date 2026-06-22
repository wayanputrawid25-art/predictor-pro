'use client';

import { Match } from '@/types';
import { formatMatchDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';

interface MatchesSectionProps {
  title: string;
  matches: Match[];
  variant?: 'today' | 'live' | 'upcoming';
  emptyMessage?: string;
}

export function MatchesSection({ 
  title, 
  matches, 
  variant = 'today',
  emptyMessage = 'No matches available'
}: MatchesSectionProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {variant === 'live' && (
          <Badge variant="destructive" className="animate-pulse">
            <span className="mr-1">●</span> LIVE
          </Badge>
        )}
        {variant === 'upcoming' && (
          <Badge variant="secondary">{matches.length} matches</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.slice(0, 10).map((match) => (
          <MatchCard key={match.id} match={match} variant={variant} />
        ))}
      </CardContent>
    </Card>
  );
}

function MatchCard({ match, variant }: { match: Match; variant: string }) {
  const isLive = variant === 'live';
  const isFinished = match.status === 'FT' || match.status === 'AET';

  return (
    <Link href={`/match/${match.id}`} className="block">
      <div className="group relative rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between">
          {/* League badge */}
          <div className="absolute left-4 top-2 flex items-center gap-2">
            {match.league.logo && (
              <Image
                src={match.league.logo}
                alt={match.league.name}
                width={16}
                height={16}
                className="rounded-sm"
              />
            )}
            <span className="text-xs text-muted-foreground">{match.league.name}</span>
          </div>

          {/* Match time */}
          <div className="absolute right-4 top-2 text-xs text-muted-foreground">
            {isLive ? (
              <span className="text-red-500 font-medium">
                {match.minute || 0}&apos;
              </span>
            ) : (
              formatMatchDate(match.date)
            )}
          </div>
        </div>

        {/* Teams and score */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.homeTeam.logo && (
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="truncate font-medium">{match.homeTeam.name}</span>
          </div>

          <div className="mx-4 flex items-center gap-2">
            {isFinished || isLive ? (
              <>
                <span className="text-2xl font-bold tabular-nums">
                  {match.homeScore ?? 0}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="text-2xl font-bold tabular-nums">
                  {match.awayScore ?? 0}
                </span>
              </>
            ) : (
              <span className="text-lg text-muted-foreground">vs</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="truncate font-medium text-right">{match.awayTeam.name}</span>
            {match.awayTeam.logo && (
              <Image
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
          </div>
        </div>

        {/* Prediction preview */}
        {match.prediction && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Prediction</span>
            <div className="flex items-center gap-2">
              <span>{Math.round(match.prediction.homeWinProb * 100)}%</span>
              <span className="text-muted-foreground">-</span>
              <span>{Math.round(match.prediction.drawProb * 100)}%</span>
              <span className="text-muted-foreground">-</span>
              <span>{Math.round(match.prediction.awayWinProb * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

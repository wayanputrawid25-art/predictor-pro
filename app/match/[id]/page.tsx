import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getMatchById, getHeadToHead } from '@/app/actions';
import { PredictionCard } from '@/components/match/prediction-card';
import { MatchStatsCard } from '@/components/match/match-stats';
import { OddsComparison } from '@/components/match/odds-comparison';
import { H2HSection } from '@/components/match/h2h-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/header';
import Image from 'next/image';
import { formatMatchDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getMatchById(id);
  
  if (!result.success || !result.data) {
    return { title: 'Match Not Found' };
  }

  const match = result.data;
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    description: `Match prediction and analysis for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
  };
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  
  const matchResult = await getMatchById(id);
  const h2hResult = await getHeadToHead(id.split('-')[0] || '', id.split('-')[1] || '');

  if (!matchResult.success || !matchResult.data) {
    notFound();
  }

  const match = matchResult.data;
  const h2h = h2hResult.success ? h2hResult.data : [];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {match.league.logo && (
              <Image
                src={match.league.logo}
                alt={match.league.name}
                width={24}
                height={24}
                className="rounded-sm"
              />
            )}
            <span className="text-sm text-muted-foreground">{match.league.name}</span>
            <Badge variant={match.status === 'LIVE' ? 'destructive' : 'secondary'}>
              {match.status === 'LIVE' ? `LIVE ${match.minute}'` : match.status}
            </Badge>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                {match.homeTeam.logo && (
                  <Image
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    width={80}
                    height={80}
                    className="mx-auto mb-3 rounded-full"
                  />
                )}
                <h2 className="font-bold text-lg">{match.homeTeam.name}</h2>
                {match.homeFormation && (
                  <p className="text-sm text-muted-foreground">{match.homeFormation}</p>
                )}
              </div>

              <div className="px-8">
                <div className="flex items-center gap-4 text-4xl font-bold">
                  <span className={match.homeScore! > match.awayScore! ? 'text-green-500' : ''}>
                    {match.homeScore ?? '-'}
                  </span>
                  <span className="text-muted-foreground">:</span>
                  <span className={match.awayScore! > match.homeScore! ? 'text-green-500' : ''}>
                    {match.awayScore ?? '-'}
                  </span>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {formatMatchDate(match.date)}
                </p>
              </div>

              <div className="flex-1 text-center">
                {match.awayTeam.logo && (
                  <Image
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    width={80}
                    height={80}
                    className="mx-auto mb-3 rounded-full"
                  />
                )}
                <h2 className="font-bold text-lg">{match.awayTeam.name}</h2>
                {match.awayFormation && (
                  <p className="text-sm text-muted-foreground">{match.awayFormation}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<Skeleton className="h-64" />}>
              {match.prediction ? (
                <PredictionCard prediction={match.prediction} showDetails />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Prediction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No prediction available for this match yet. Check back closer to kickoff.
                    </p>
                  </CardContent>
                </Card>
              )}
            </Suspense>

            <Suspense fallback={<Skeleton className="h-64" />}>
              <MatchStatsCard 
                stats={match.stats}
                homeTeam={match.homeTeam.name}
                awayTeam={match.awayTeam.name}
              />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-64" />}>
              <H2HSection
                records={h2h}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
              />
            </Suspense>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <OddsComparison
                odds={match.odds || []}
                prediction={match.prediction}
              />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle>Match Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {match.venue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue</span>
                    <span className="font-medium">{match.venue}</span>
                  </div>
                )}
                {match.referee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referee</span>
                    <span className="font-medium">{match.referee}</span>
                  </div>
                )}
                {match.round && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Round</span>
                    <span className="font-medium">{match.round}</span>
                  </div>
                )}
                {match.season && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Season</span>
                    <span className="font-medium">{match.season}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

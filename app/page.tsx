import { Suspense } from 'react';
import { MatchesSection } from '@/components/dashboard/matches-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getLiveMatches, getTodayMatches, getUpcomingMatches } from './actions';
import { Header } from '@/components/layout/header';

export const revalidate = 300; // ISR - revalidate every 5 minutes

export default async function HomePage() {
  const [todayData, liveData, upcomingData] = await Promise.all([
    getTodayMatches(),
    getLiveMatches(),
    getUpcomingMatches(7),
  ]);

  const todayMatches = todayData.success ? todayData.data : [];
  const liveMatches = liveData.success ? liveData.data : [];
  const upcomingMatches = upcomingData.success ? upcomingData.data : [];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Football Predictions</h1>
          <p className="text-muted-foreground">
            AI-powered predictions based on Elo ratings, Poisson distribution, and team form
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Matches */}
          <Suspense fallback={<MatchesSkeleton />}>
            <MatchesSection
              title="Live Matches"
              matches={liveMatches}
              variant="live"
              emptyMessage="No live matches right now"
            />
          </Suspense>

          {/* Today's Matches */}
          <Suspense fallback={<MatchesSkeleton />}>
            <MatchesSection
              title="Today's Matches"
              matches={todayMatches}
              variant="today"
              emptyMessage="No matches scheduled for today"
            />
          </Suspense>
        </div>

        {/* Upcoming Matches */}
        <div className="mt-6">
          <Suspense fallback={<MatchesSkeleton />}>
            <MatchesSection
              title="Upcoming Matches"
              matches={upcomingMatches}
              variant="upcoming"
              emptyMessage="No upcoming matches"
            />
          </Suspense>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMatches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Live Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{liveMatches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AI</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MatchesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

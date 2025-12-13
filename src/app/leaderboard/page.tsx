import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getLeaderboardData,
  getUserRank,
  getCoursesForFilter,
  createRankSnapshot,
} from './actions';
import LeaderboardClient from './LeaderboardClient';
import Container from '@/components/shared/Container';

export const metadata = {
  title: 'Leaderboard | Code Drill',
  description: 'View rankings and compete with other students',
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { tab?: string; course?: string; timeframe?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isProfessor = userData?.role === 'professor';

  // Parse search params
  const tab = searchParams.tab || 'global';
  const courseId = searchParams.course || undefined;

  // Fetch data
  const [leaderboardData, userRank, courses] = await Promise.all([
    getLeaderboardData(courseId, undefined, 100, 0),
    getUserRank(courseId),
    getCoursesForFilter(),
  ]);

  // Create rank snapshot for current view
  if (userRank) {
    await createRankSnapshot(courseId);
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with other students and track your progress
        </p>
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardClient
          initialLeaderboard={leaderboardData}
          initialUserRank={userRank}
          courses={courses}
          isProfessor={isProfessor}
          initialTab={tab}
          initialCourseId={courseId}
        />
      </Suspense>
    </Container>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* User Rank Banner Skeleton */}
      <div className="h-32 bg-muted animate-pulse rounded-lg" />

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

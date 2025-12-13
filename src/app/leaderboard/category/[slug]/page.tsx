import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getLeaderboardData,
  getUserRank,
  createRankSnapshot,
} from '../../actions';
import Container from '@/components/shared/Container';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import Link from 'next/link';

const CATEGORY_MAP: Record<string, string> = {
  'arrays': 'Arrays',
  'strings': 'Strings',
  'dynamic-programming': 'Dynamic Programming',
  'trees': 'Trees',
  'graphs': 'Graphs',
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const categoryName = CATEGORY_MAP[params.slug] || params.slug;
  return {
    title: `${categoryName} Leaderboard | Code Drill`,
    description: `View rankings for ${categoryName.toLowerCase()} problems`,
  };
}

export default async function CategoryLeaderboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const categoryName = CATEGORY_MAP[params.slug] || params.slug;
  const category = params.slug;

  // Fetch data
  const [leaderboardData, userRank] = await Promise.all([
    getLeaderboardData(undefined, category, 100, 0),
    getUserRank(undefined, category),
  ]);

  // Create rank snapshot for this category
  if (userRank) {
    await createRankSnapshot(undefined, category);
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/leaderboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Leaderboard
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">🏷️ {categoryName} Leaderboard</h1>
        <p className="text-muted-foreground">
          Rankings based on {categoryName.toLowerCase()} problem performance
        </p>
      </div>

      {/* User Rank Banner */}
      {userRank && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {userRank.rank === 1
                  ? '🥇'
                  : userRank.rank === 2
                  ? '🥈'
                  : userRank.rank === 3
                  ? '🥉'
                  : '🎯'}
              </div>
              <div>
                <h3 className="text-2xl font-bold">Your Rank: #{userRank.rank}</h3>
                <p className="text-muted-foreground">
                  in {categoryName} • {userRank.total_users} students
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{userRank.total_points}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {userRank.problems_solved}
                </div>
                <div className="text-sm text-muted-foreground">Solved</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardTable entries={leaderboardData} />
      </Suspense>

      {/* Category Navigation */}
      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold mb-3">Other Categories</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_MAP)
            .filter(([slug]) => slug !== params.slug)
            .map(([slug, name]) => (
              <Link
                key={slug}
                href={`/leaderboard/category/${slug}`}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
              >
                {name}
              </Link>
            ))}
        </div>
      </div>
    </Container>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

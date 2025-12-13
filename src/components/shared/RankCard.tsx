'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserRank, UserRank } from '@/app/leaderboard/actions';
import BadgeDisplay from '@/components/leaderboard/BadgeDisplay';

interface RankCardProps {
  className?: string;
}

export default function RankCard({ className }: RankCardProps) {
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRank() {
      const rank = await getUserRank();
      setUserRank(rank);
      setIsLoading(false);
    }
    fetchRank();
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!userRank) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className || ''}`}>
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">🏆</span>
          <h3 className="text-lg font-semibold text-gray-900">Your Rank</h3>
        </div>
        <div className="text-center">
          <p className="text-gray-500 mb-3">Start solving problems to get ranked!</p>
          <Link
            href="/problems"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Browse Problems
          </Link>
        </div>
      </div>
    );
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏆';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border border-blue-100 ${className || ''}`}>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">{getMedalEmoji(userRank.rank)}</span>
        <h3 className="text-lg font-semibold text-gray-900">Your Rank</h3>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-blue-600 mb-2">#{userRank.rank}</div>
        <div className="text-sm text-gray-500 mb-3">
          out of {userRank.total_users} students
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-white/50 rounded p-2">
            <div className="font-bold text-gray-900">{userRank.total_points}</div>
            <div className="text-gray-500">Points</div>
          </div>
          <div className="bg-white/50 rounded p-2">
            <div className="font-bold text-gray-900">{userRank.problems_solved}</div>
            <div className="text-gray-500">Solved</div>
          </div>
          <div className="bg-white/50 rounded p-2">
            <div className="font-bold text-gray-900">{userRank.current_streak}</div>
            <div className="text-gray-500">Streak</div>
          </div>
        </div>

        {/* Badges Preview */}
        {userRank.badges.length > 0 && (
          <div className="flex justify-center gap-1 mb-4">
            {userRank.badges.slice(0, 3).map((badge, idx) => (
              <BadgeDisplay key={idx} badge={badge} size="sm" />
            ))}
            {userRank.badges.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                +{userRank.badges.length - 3}
              </span>
            )}
          </div>
        )}

        <Link
          href="/leaderboard"
          className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          View Full Leaderboard →
        </Link>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { getUserRankAction, getUserDetailedStatsAction, type UserRank, type UserDetailedStats } from '@/app/profile/actions';

interface ProfileStatsProps {
  userId: string;
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  const [rank, setRank] = useState<UserRank | null>(null);
  const [stats, setStats] = useState<UserDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [rankData, statsData] = await Promise.all([
        getUserRankAction(userId),
        getUserDetailedStatsAction(userId),
      ]);

      setRank(rankData);
      setStats(statsData);
      setLoading(false);
    }

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Statistics</h2>

      {/* Rank Badge */}
      {rank && rank.rank > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Global Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{rank.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Top {Math.round(rank.percentile)}%</p>
              <p className="text-xs text-gray-500">of {rank.totalUsers.toLocaleString()} users</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-blue-700">{stats.totalSubmissions}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-green-700">{stats.acceptedSubmissions}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
          <p className="text-2xl font-bold text-purple-700">{stats.acceptanceRate}%</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Points Earned</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.totalPointsEarned}</p>
        </div>
      </div>

      {/* Problems by Difficulty */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Problems Solved by Difficulty</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Easy</span>
              <span className="text-sm font-semibold text-green-700">{stats.problemsByDifficulty.easy}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, stats.problemsByDifficulty.easy * 10)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Medium</span>
              <span className="text-sm font-semibold text-yellow-700">{stats.problemsByDifficulty.medium}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, stats.problemsByDifficulty.medium * 10)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Hard</span>
              <span className="text-sm font-semibold text-red-700">{stats.problemsByDifficulty.hard}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, stats.problemsByDifficulty.hard * 10)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Languages Used */}
      {stats.languagesUsed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Languages Used</h3>
          <div className="flex flex-wrap gap-2">
            {stats.languagesUsed.map(lang => (
              <span 
                key={lang}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import type { SubmissionStats } from '@/lib/submissions';
import { formatPoints } from '@/lib/scoring';

interface Props {
  stats: SubmissionStats;
}

export default function SubmissionStatsDisplay({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Submissions */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Total Submissions</p>
        <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
      </div>

      {/* Accepted */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Accepted</p>
        <p className="text-3xl font-bold text-green-500">{stats.acceptedSubmissions}</p>
      </div>

      {/* Acceptance Rate */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Acceptance Rate</p>
        <p className="text-3xl font-bold">{stats.acceptanceRate.toFixed(1)}%</p>
      </div>

      {/* Total Points */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Total Points Earned</p>
        <p className="text-3xl font-bold text-yellow-500">
          {formatPoints(stats.totalPointsEarned)}
        </p>
      </div>

      {/* Languages Used */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Languages Used</p>
        <p className="text-3xl font-bold">{stats.languagesUsed.length}</p>
        <p className="text-xs text-gray-500 mt-1">
          {stats.languagesUsed.slice(0, 3).join(', ')}
          {stats.languagesUsed.length > 3 && '...'}
        </p>
      </div>
    </div>
  );
}

'use client';

import { LeaderboardEntry } from '@/app/leaderboard/actions';
import BadgeDisplay from './BadgeDisplay';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '−';
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <p className="text-xl text-muted-foreground">
          No leaderboard data available
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Start solving problems to appear on the leaderboard! 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">Student</th>
              <th className="px-4 py-3 text-left font-semibold">Badges</th>
              <th className="px-4 py-3 text-right font-semibold">Points</th>
              <th className="px-4 py-3 text-right font-semibold">Solved</th>
              <th className="px-4 py-3 text-right font-semibold">Avg Score</th>
              <th className="px-4 py-3 text-right font-semibold">Streak</th>
              <th className="px-4 py-3 text-center font-semibold">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.user_id === currentUserId;
              const medal = getMedalEmoji(entry.rank);

              return (
                <tr
                  key={entry.user_id}
                  className={`hover:bg-muted/50 transition-colors ${
                    isCurrentUser ? 'bg-primary/5' : ''
                  } ${index < 3 ? 'font-medium' : ''}`}
                >
                  {/* Rank */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Student */}
                  <td className="px-4 py-4">
                    <div className="font-medium">{entry.name}</div>
                  </td>

                  {/* Badges */}
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {entry.badges.slice(0, 4).map((badge, idx) => (
                        <BadgeDisplay key={idx} badge={badge} size="sm" />
                      ))}
                      {entry.badges.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{entry.badges.length - 4}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-primary">
                      {entry.total_points.toLocaleString()}
                    </span>
                  </td>

                  {/* Solved */}
                  <td className="px-4 py-4 text-right">
                    {entry.problems_solved}
                  </td>

                  {/* Avg Score */}
                  <td className="px-4 py-4 text-right">
                    {entry.avg_score?.toFixed(1) || '0.0'}%
                  </td>

                  {/* Streak */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {entry.current_streak > 0 && '🔥'}
                      <span>{entry.current_streak}</span>
                    </div>
                  </td>

                  {/* Rank Change */}
                  <td className="px-4 py-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1 ${getRankChangeColor(entry.rank_change)}`}
                    >
                      <span className="text-lg">
                        {getRankChangeIcon(entry.rank_change)}
                      </span>
                      {entry.rank_change !== 0 && (
                        <span className="text-sm font-medium">
                          {Math.abs(entry.rank_change)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-muted/50 border-t text-sm text-muted-foreground">
        Showing {entries.length} student{entries.length !== 1 ? 's' : ''} •
        Rankings update daily
      </div>
    </div>
  );
}

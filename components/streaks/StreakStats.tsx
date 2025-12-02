'use client';

import { useEffect, useState } from 'react';
import { getUserStreak, formatStreak, getStreakEmoji, isStreakAtRisk, type StreakInfo } from '@/lib/streaks';
import { createClient } from '@/lib/supabase/client';

export function StreakStats() {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const info = await getUserStreak(user.id);
      setStreakInfo(info);
      setLoading(false);
    }

    fetchStreak();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!streakInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Streak</h3>
        <p className="text-gray-600">Start solving problems to build your streak!</p>
      </div>
    );
  }

  const atRisk = isStreakAtRisk(streakInfo);
  const currentEmoji = getStreakEmoji(streakInfo.currentStreak);
  const longestEmoji = getStreakEmoji(streakInfo.longestStreak);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Streak 🔥</h3>
      
      <div className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-orange-700">
              {currentEmoji} {formatStreak(streakInfo.currentStreak)}
            </p>
            {atRisk && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ At risk - solve today!
              </p>
            )}
            {streakInfo.gracePeriodUsed && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Grace period used
              </p>
            )}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Longest Streak</p>
            <p className="text-2xl font-bold text-purple-700">
              {longestEmoji} {formatStreak(streakInfo.longestStreak)}
            </p>
          </div>
        </div>

        {/* Last Active */}
        {streakInfo.lastActiveDate && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Active</span>
              <span className="font-medium text-gray-900">
                {streakInfo.daysSinceLastActivity === 0
                  ? 'Today'
                  : streakInfo.daysSinceLastActivity === 1
                  ? 'Yesterday'
                  : `${streakInfo.daysSinceLastActivity} days ago`}
              </span>
            </div>
          </div>
        )}

        {/* Streak Info */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Solve at least one problem daily to maintain your streak. You get one grace day if you miss.
          </p>
        </div>
      </div>
    </div>
  );
}

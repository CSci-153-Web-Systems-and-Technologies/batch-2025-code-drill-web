'use client';

import { useEffect, useState } from 'react';
import { getUserStreakAction, type StreakInfo } from '@/app/streaks/actions';
import { formatStreak, getStreakEmoji } from '@/lib/streaks';

export function StreakDisplay() {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      const info = await getUserStreakAction();
      
      if (!info) {
        setLoading(false);
        return;
      }
      setStreakInfo(info);
      setLoading(false);
    }

    fetchStreak();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!streakInfo || streakInfo.currentStreak === 0) {
    return null;
  }

  const emoji = getStreakEmoji(streakInfo.currentStreak);
  const streakText = formatStreak(streakInfo.currentStreak);

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
      title={`Current streak: ${streakText}\nLongest streak: ${formatStreak(streakInfo.longestStreak)}`}
    >
      <span className="text-lg" aria-label="streak-emoji">
        {emoji}
      </span>
      <span className="text-sm font-semibold text-orange-800">
        {streakText}
      </span>
      {streakInfo.gracePeriodUsed && (
        <span 
          className="ml-1 text-xs text-orange-600" 
          title="Grace period used - solve today to keep your streak!"
        >
          ⚠️
        </span>
      )}
    </div>
  );
}

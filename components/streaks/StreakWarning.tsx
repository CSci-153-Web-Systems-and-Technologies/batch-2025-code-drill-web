'use client';

import { useEffect, useState } from 'react';
import { getUserStreakAction, type StreakInfo } from '@/app/streaks/actions';
import { isStreakAtRisk } from '@/lib/streaks';

export function StreakWarning() {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    async function fetchStreak() {
      const info = await getUserStreakAction();
      setStreakInfo(info);
      
      if (info && isStreakAtRisk(info) && info.currentStreak > 0) {
        setShowWarning(true);
      }
    }

    fetchStreak();
  }, []);

  if (!showWarning || !streakInfo) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Your {streakInfo.currentStreak}-day streak is at risk! 🔥
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Solve a problem today to keep your streak going. You have one grace day remaining.
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

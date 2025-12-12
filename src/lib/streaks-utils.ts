export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  gracePeriodUsed: boolean;
  daysSinceLastActivity: number;
}

export interface StreakUpdateResult {
  success: boolean;
  currentStreak: number;
  longestStreak: number;
  gracePeriodUsed: boolean;
  daysSinceLastActivity: number;
}

/**
 * Check if streak is at risk (1 day away from breaking)
 */
export function isStreakAtRisk(streakInfo: StreakInfo | null): boolean {
  if (!streakInfo || !streakInfo.lastActiveDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(streakInfo.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastActive.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // At risk if last activity was yesterday (1 day gap)
  return daysDiff === 1;
}

/**
 * Format streak for display
 */
export function formatStreak(days: number): string {
  if (days === 0) return 'No streak';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Get streak emoji based on length
 */
export function getStreakEmoji(days: number): string {
  if (days === 0) return '💤';
  if (days < 7) return '🔥';
  if (days < 30) return '🔥🔥';
  if (days < 100) return '🔥🔥🔥';
  return '🏆';
}

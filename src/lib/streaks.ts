import { createClient } from '@/lib/supabase/server';

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
 * Update user's daily streak after solving a problem
 * Calls the update_daily_streak database function
 */
export async function updateDailyStreak(
  userId: string,
  activityDate?: Date
): Promise<StreakUpdateResult> {
  const supabase = await createClient();
  
  const dateString = activityDate 
    ? activityDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const { data, error } = await supabase.rpc('update_daily_streak', {
    p_user_id: userId,
    p_activity_date: dateString,
  });

  if (error) {
    console.error('Error updating daily streak:', error);
    return {
      success: false,
      currentStreak: 0,
      longestStreak: 0,
      gracePeriodUsed: false,
      daysSinceLastActivity: 0,
    };
  }

  return {
    success: data.success || false,
    currentStreak: data.current_streak || 0,
    longestStreak: data.longest_streak || 0,
    gracePeriodUsed: data.grace_period_used || false,
    daysSinceLastActivity: data.days_since_last || 0,
  };
}

/**
 * Get current streak information for a user
 */
export async function getUserStreak(userId: string): Promise<StreakInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user streak:', error);
    return null;
  }

  // Calculate days since last activity
  const lastActive = data.last_active_date 
    ? new Date(data.last_active_date)
    : null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let daysSinceLastActivity = 0;
  let gracePeriodUsed = false;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastActive.getTime();
    daysSinceLastActivity = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    gracePeriodUsed = daysSinceLastActivity === 2;
  }

  return {
    currentStreak: data.current_streak || 0,
    longestStreak: data.longest_streak || 0,
    lastActiveDate: data.last_active_date,
    gracePeriodUsed,
    daysSinceLastActivity,
  };
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

/**
 * Calculate streak calendar data for the last year (365 days)
 */
export async function getStreakCalendar(userId: string): Promise<Array<{ date: string; count: number }>> {
  const supabase = await createClient();

  // Get submissions from last year
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const { data: practiceQuestions, error } = await supabase
    .from('practice_exam_questions')
    .select('answered_at, is_correct, practice_sessions!inner(user_id)')
    .eq('practice_sessions.user_id', userId)
    .eq('is_correct', true)
    .not('answered_at', 'is', null)
    .gte('answered_at', oneYearAgo.toISOString());

  if (error) {
    console.error('Error fetching streak calendar:', error);
    return [];
  }

  // Create map of dates with counts
  const dateCounts = new Map<string, number>();
  practiceQuestions?.forEach((question) => {
    if (question.answered_at) {
      const date = new Date(question.answered_at);
      const dateString = date.toISOString().split('T')[0];
      dateCounts.set(dateString, (dateCounts.get(dateString) || 0) + 1);
    }
  });

  // Generate calendar data for last 365 days
  const calendar: Array<{ date: string; count: number }> = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    calendar.push({
      date: dateString,
      count: dateCounts.get(dateString) || 0,
    });
  }

  return calendar;
}

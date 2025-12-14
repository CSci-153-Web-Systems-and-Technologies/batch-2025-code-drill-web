'use server';

import { createClient } from '@/lib/supabase/server';
import type { StreakInfo } from '@/lib/streaks-utils';
import { getStreakCalendar } from '@/lib/streaks';

export type { StreakInfo };

/**
 * Get current streak information for a user (Server Action)
 */
export async function getUserStreakAction(): Promise<StreakInfo | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', user.id)
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
 * Get streak calendar for the last year (Server Action)
 */
export async function getStreakCalendarAction(): Promise<Array<{ date: string; count: number }>> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  try {
    const calendar = await getStreakCalendar(user.id);
    return calendar;
  } catch (error) {
    console.error('Error fetching streak calendar:', error);
    return [];
  }
}

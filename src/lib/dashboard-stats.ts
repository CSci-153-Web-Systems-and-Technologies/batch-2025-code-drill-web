'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get number of problems solved this week
 */
export async function getWeeklyProblemsSolved(userId: string): Promise<number> {
  const supabase = await createClient();
  
  // Get start of current week (Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Count distinct problems solved this week
  const { data, error } = await supabase
    .from('submissions')
    .select('problem_id')
    .eq('user_id', userId)
    .eq('status', 'Accepted')
    .gte('created_at', startOfWeek.toISOString());
  
  if (error) {
    console.error('Error fetching weekly problems:', error);
    return 0;
  }
  
  // Count unique problem IDs
  const uniqueProblems = new Set(data?.map(s => s.problem_id) || []);
  return uniqueProblems.size;
}

'use server';

import { createClient } from '@/lib/supabase/server';

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  name: string;
  email: string;
  total_points: number;
  problems_solved: number;
  avg_score: number;
  current_streak: number;
  rank_change: number;
  badges: Badge[];
}

export interface Badge {
  name: string;
  emoji: string;
  description: string;
  earned_at: string;
}

export interface UserRank {
  rank: number;
  total_users: number;
  total_points: number;
  problems_solved: number;
  avg_score: number;
  current_streak: number;
  badges: Badge[];
}

export interface RankHistoryEntry {
  snapshot_date: string;
  rank: number;
  total_points: number;
}

/**
 * Get leaderboard data with optional filtering
 */
export async function getLeaderboardData(
  courseId?: string,
  category?: string,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_course_id: courseId || null,
    p_category: category || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  console.log('Leaderboard data fetched:', {
    count: data?.length || 0,
    data: data,
  });

  return data || [];
}

/**
 * Get current user's rank and stats
 */
export async function getUserRank(
  courseId?: string,
  category?: string
): Promise<UserRank | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_user_rank', {
    p_user_id: user.id,
    p_course_id: courseId || null,
    p_category: category || null,
  });

  if (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

/**
 * Get user's rank history for the last 30 days
 */
export async function getRankHistory(
  courseId?: string
): Promise<RankHistoryEntry[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_rank_history', {
    p_user_id: user.id,
    p_course_id: courseId || null,
  });

  if (error) {
    console.error('Error fetching rank history:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a rank snapshot for the current user
 */
export async function createRankSnapshot(
  courseId?: string,
  category?: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.rpc('create_rank_snapshot', {
    p_user_id: user.id,
    p_course_id: courseId || null,
    p_category: category || null,
  });

  if (error) {
    console.error('Error creating rank snapshot:', error);
  }
}

/**
 * Update user's leaderboard visibility setting
 */
export async function updateLeaderboardVisibility(
  visible: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('users')
    .update({ leaderboard_visible: visible })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating leaderboard visibility:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all courses for course filter dropdown
 */
export async function getCoursesForFilter(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('professor_courses')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Award achievement badge to user
 */
export async function awardBadge(
  userId: string,
  badgeName: string
): Promise<void> {
  const supabase = await createClient();

  // Get badge ID
  const { data: badge, error: badgeError } = await supabase
    .from('achievement_badges')
    .select('id')
    .eq('name', badgeName)
    .single();

  if (badgeError || !badge) {
    console.error('Error fetching badge:', badgeError);
    return;
  }

  // Award badge (ignore conflict if already awarded)
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badge.id })
    .select();

  if (error && !error.message.includes('duplicate')) {
    console.error('Error awarding badge:', error);
  }
}

/**
 * Check and award badges based on user stats
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  const supabase = await createClient();

  // Get user stats
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_points, problems_solved, current_streak')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return;
  }

  // Check for Problem Master badge (50+ problems)
  if (user.problems_solved >= 50) {
    await awardBadge(userId, 'Problem Master');
  }

  // Check for Consistent badge (7+ day streak)
  if (user.current_streak >= 7) {
    await awardBadge(userId, 'Consistent');
  }

  // Check for Rising Star (rank improvement)
  // This would need more complex logic comparing current rank to past ranks
  // For now, we'll leave it for future implementation

  // Speed Demon badge would be checked during daily activity tracking
}

/**
 * Export leaderboard data as CSV (professors only)
 */
export async function exportLeaderboardCSV(
  courseId?: string
): Promise<{ success: boolean; csv?: string; error?: string }> {
  const supabase = await createClient();

  // Check if user is a professor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || userData?.role !== 'professor') {
    return { success: false, error: 'Unauthorized' };
  }

  // Get leaderboard data
  const leaderboard = await getLeaderboardData(courseId, undefined, 1000, 0);

  if (leaderboard.length === 0) {
    return { success: false, error: 'No data to export' };
  }

  // Generate CSV
  const headers = [
    'Rank',
    'Name',
    'Email',
    'Total Points',
    'Problems Solved',
    'Average Score',
    'Current Streak',
    'Rank Change',
    'Badges',
  ];

  const rows = leaderboard.map((entry) => [
    entry.rank,
    entry.name,
    entry.email,
    entry.total_points,
    entry.problems_solved,
    entry.avg_score?.toFixed(2) || '0.00',
    entry.current_streak,
    entry.rank_change > 0 ? `+${entry.rank_change}` : entry.rank_change,
    entry.badges.map((b) => `${b.emoji} ${b.name}`).join('; '),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return { success: true, csv };
}

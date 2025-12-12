'use server';

import { createClient } from '@/lib/supabase/server';

export interface UserRank {
  rank: number;
  totalUsers: number;
  percentile: number;
}

/**
 * Get user's rank on the leaderboard
 */
export async function getUserRankAction(userId: string): Promise<UserRank | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_user_rank', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }

    return {
      rank: data?.rank || 0,
      totalUsers: data?.total_users || 0,
      percentile: data?.percentile || 0,
    };
  } catch (error) {
    console.error('Error in getUserRankAction:', error);
    return null;
  }
}

export interface UserDetailedStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  totalPointsEarned: number;
  problemsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  languagesUsed: string[];
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Get detailed statistics for user profile
 */
export async function getUserDetailedStatsAction(userId: string): Promise<UserDetailedStats | null> {
  const supabase = await createClient();

  try {
    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('status, points_earned, language, created_at, problem_id')
      .eq('user_id', userId);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return null;
    }

    const totalSubmissions = submissions?.length || 0;
    const acceptedSubmissions = submissions?.filter(s => s.status === 'Accepted').length || 0;
    const acceptanceRate = totalSubmissions > 0 
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
      : 0;

    const totalPointsEarned = submissions?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0;

    // Get unique languages used
    const languagesSet = new Set(submissions?.map(s => s.language).filter(Boolean));
    const languagesUsed = Array.from(languagesSet);

    // Get problems by difficulty
    const acceptedProblemIds = new Set(
      submissions?.filter(s => s.status === 'Accepted').map(s => s.problem_id)
    );

    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id, difficulty')
      .in('id', Array.from(acceptedProblemIds));

    const problemsByDifficulty = {
      easy: problems?.filter(p => p.difficulty === 'Easy').length || 0,
      medium: problems?.filter(p => p.difficulty === 'Medium').length || 0,
      hard: problems?.filter(p => p.difficulty === 'Hard').length || 0,
    };

    // Get recent activity (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentSubmissions = submissions?.filter(s => 
      new Date(s.created_at) >= fourteenDaysAgo
    );

    const activityMap = new Map<string, number>();
    recentSubmissions?.forEach(s => {
      const date = new Date(s.created_at).toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    const recentActivity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      totalPointsEarned,
      problemsByDifficulty,
      languagesUsed,
      recentActivity,
    };
  } catch (error) {
    console.error('Error in getUserDetailedStatsAction:', error);
    return null;
  }
}

export interface RecentActivity {
  id: string;
  problem_id: string;
  status: string;
  language: string;
  points_earned: number | null;
  created_at: string;
  problem?: {
    title: string;
    slug: string;
    difficulty: string;
  };
}

/**
 * Get recent submissions for profile activity
 */
export async function getRecentActivityAction(userId: string, limit: number = 10): Promise<RecentActivity[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        problem_id,
        status,
        language,
        points_earned,
        created_at,
        problems:problem_id (
          title,
          slug,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data?.map(submission => ({
      id: submission.id,
      problem_id: submission.problem_id,
      status: submission.status,
      language: submission.language,
      points_earned: submission.points_earned,
      created_at: submission.created_at,
      problem: Array.isArray(submission.problems) ? submission.problems[0] : submission.problems,
    })) || [];
  } catch (error) {
    console.error('Error in getRecentActivityAction:', error);
    return [];
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfileAction(
  userId: string,
  data: { name?: string; bio?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        // Add bio field when database schema is updated
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserProfileAction:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

import { createClient } from '@/lib/supabase/server';
import { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  // Get authenticated user from Supabase Auth
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Fetch user data from users table
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (dbError || !userData) {
    return null;
  }

  // Map database fields to User type
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    totalPoints: userData.total_points,
    problemsSolved: userData.problems_solved,
    currentStreak: userData.current_streak,
    avgScore: userData.avg_score,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

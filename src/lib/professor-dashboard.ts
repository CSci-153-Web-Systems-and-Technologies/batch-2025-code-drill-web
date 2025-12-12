import { createClient } from '@/lib/supabase/server';

export interface ProfessorDashboardStats {
  courseCount: number;
  templateCount: number;
  submissionCount: number;
}

/**
 * Fetch dashboard stats for professors/admins.
 * Currently scoped to overall counts the user can access.
 */
export async function getProfessorDashboardStats(): Promise<ProfessorDashboardStats> {
  const supabase = await createClient();

  // Ensure user is authenticated and has professor/admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    throw new Error('Professor or admin role required');
  }

  // Fetch counts
  const [coursesCount, templatesCount, submissionsCount] = await Promise.all([
    supabase.from('professor_courses').select('*', { count: 'exact', head: true }),
    supabase.from('exam_templates').select('*', { count: 'exact', head: true }),
    supabase.from('user_exam_answers').select('*', { count: 'exact', head: true }),
  ]);

  return {
    courseCount: coursesCount.count ?? 0,
    templateCount: templatesCount.count ?? 0,
    submissionCount: submissionsCount.count ?? 0,
  };
}
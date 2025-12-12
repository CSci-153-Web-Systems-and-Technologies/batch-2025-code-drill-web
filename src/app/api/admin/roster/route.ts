import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireProfessorOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, userRecord: null } as const;
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return { supabase, user, userRecord } as const;
}

export async function GET() {
  const { supabase, user, userRecord } = await requireProfessorOrAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    return NextResponse.json({ error: 'Professor or admin role required' }, { status: 403 });
  }

  // Get all students with their stats
  const { data: students, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('role', 'student')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get progress for each student
  const studentsWithStats = await Promise.all(
    (students || []).map(async (student) => {
      const { count: examCount } = await supabase
        .from('user_exam_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', student.id);

      const { data: progressData } = await supabase
        .from('user_exam_progress')
        .select('accuracy, total_points')
        .eq('user_id', student.id)
        .eq('status', 'completed');

      const avgAccuracy = progressData && progressData.length > 0
        ? progressData.reduce((sum, p) => sum + p.accuracy, 0) / progressData.length
        : 0;

      const totalPoints = progressData?.reduce((sum, p) => sum + p.total_points, 0) || 0;

      return {
        ...student,
        examCount: examCount || 0,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        totalPoints,
      };
    })
  );

  return NextResponse.json({ students: studentsWithStats });
}

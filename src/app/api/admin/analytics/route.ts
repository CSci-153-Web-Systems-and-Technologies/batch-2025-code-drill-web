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

export async function GET(request: Request) {
  const { supabase, user, userRecord } = await requireProfessorOrAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    return NextResponse.json({ error: 'Professor or admin role required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');

  // First, get all students
  const { data: allStudents, error: studentsError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'student')
    .order('name');

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  if (!allStudents || allStudents.length === 0) {
    return NextResponse.json({
      analytics: {
        totalStudents: 0,
        avgAccuracy: 0,
        totalSubmissions: 0,
        completionRate: 0,
        students: [],
      }
    });
  }

  // Get exam progress for all students
  let query = supabase
    .from('user_exam_progress')
    .select(`
      *,
      exam_templates (
        id,
        title,
        course_id,
        professor_courses (course_code, name)
      )
    `)
    .in('user_id', allStudents.map(s => s.id))
    .order('accuracy', { ascending: false });

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data: progressData, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Merge student data with progress data
  const studentsWithProgress = allStudents.map(student => {
    const studentProgress = progressData?.filter(p => p.user_id === student.id) || [];
    
    const avgAccuracy = studentProgress.length > 0
      ? studentProgress.reduce((sum, p) => sum + p.accuracy, 0) / studentProgress.length
      : 0;
    
    const totalPoints = studentProgress.reduce((sum, p) => sum + (p.total_points || 0), 0);
    
    return {
      user_id: student.id,
      users: { id: student.id, name: student.name, email: student.email },
      accuracy: avgAccuracy,
      total_points: totalPoints,
      exam_count: studentProgress.length,
    };
  });

  // Calculate aggregate stats
  const totalSubmissions = progressData?.length || 0;
  const avgAccuracy = progressData && progressData.length > 0
    ? progressData.reduce((sum, p) => sum + p.accuracy, 0) / progressData.length
    : 0;
  const completionRate = progressData && progressData.length > 0
    ? (progressData.filter(p => p.status === 'completed').length / totalSubmissions) * 100
    : 0;

  return NextResponse.json({
    analytics: {
      totalStudents: allStudents.length,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      totalSubmissions,
      completionRate: Math.round(completionRate * 100) / 100,
      students: studentsWithProgress,
    }
  });
}

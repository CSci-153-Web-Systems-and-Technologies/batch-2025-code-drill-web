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
  const status = searchParams.get('status');

  // Get submissions with user and question details
  let query = supabase
    .from('user_exam_answers')
    .select(`
      id,
      user_id,
      question_id,
      blank_answers,
      output_answer,
      essay_answer,
      is_correct,
      points_earned,
      submitted_at,
      graded_at,
      feedback,
      users (id, name, email),
      exam_questions (
        id,
        title,
        question_type,
        points,
        template_id,
        exam_templates (
          id,
          title,
          course_id
        )
      )
    `)
    .order('submitted_at', { ascending: false });

  if (courseId) {
    // Filter by course - need to join through template
    query = query.eq('exam_questions.exam_templates.course_id', courseId);
  }

  if (status === 'pending') {
    query = query.is('graded_at', null);
  } else if (status === 'graded') {
    query = query.not('graded_at', 'is', null);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data || [] });
}

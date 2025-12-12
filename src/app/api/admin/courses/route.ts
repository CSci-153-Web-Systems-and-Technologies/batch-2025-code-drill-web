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
    .select('role, name')
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

  const { data, error } = await supabase
    .from('professor_courses')
    .select('id, course_code, name')
    .order('course_code');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ courses: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user, userRecord } = await requireProfessorOrAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    return NextResponse.json({ error: 'Professor or admin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { course_code, name, description, semester, exam_style, difficulty } = body;

  if (!course_code || !name) {
    return NextResponse.json({ error: 'course_code and name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('professor_courses')
    .insert({
      course_code,
      name,
      description: description ?? null,
      professor_name: userRecord?.name || 'Professor',
      semester: semester ?? 'TBD',
      student_count: 0,
      exam_style: exam_style ?? 'balanced',
      difficulty: difficulty ?? 'Medium',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ course: data }, { status: 201 });
}
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTemplateSchema } from '@/lib/validations/template-schemas';

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

  let query = supabase
    .from('exam_templates')
    .select('id, course_id, exam_type, title, description, duration_minutes, question_count, total_points, instructions, created_at')
    .order('created_at', { ascending: false });

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user, userRecord } = await requireProfessorOrAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    return NextResponse.json({ error: 'Professor or admin role required' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const payload = parsed.data;

  const { data, error } = await supabase
    .from('exam_templates')
    .insert({
      course_id: payload.course_id,
      exam_type: payload.exam_type,
      title: payload.title,
      description: payload.description ?? null,
      duration_minutes: payload.duration_minutes,
      question_count: payload.question_count ?? 0,
      total_points: payload.total_points,
      instructions: payload.instructions ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
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

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('course_id');

  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcements: data || [] });
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

  if (!body || !body.title || !body.message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      course_id: body.course_id ?? null,
      title: body.title,
      message: body.message,
      priority: body.priority ?? 'normal',
      author_id: user.id,
      author_name: userRecord.name || 'Professor',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data }, { status: 201 });
}

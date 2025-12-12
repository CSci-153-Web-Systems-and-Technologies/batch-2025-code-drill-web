import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all questions across all courses with course names
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select(`
        id,
        course_id,
        question_text,
        question_type,
        points,
        difficulty_level,
        tags,
        created_at,
        professor_courses!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Transform the data to flatten the course name
    const transformedQuestions = (questions || []).map(q => ({
      id: q.id,
      course_id: q.course_id,
      course_name: (q.professor_courses as any)?.name || 'Unknown Course',
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      difficulty_level: q.difficulty_level,
      tags: q.tags,
      created_at: q.created_at,
    }));

    return NextResponse.json({ questions: transformedQuestions });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

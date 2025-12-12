import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { question_id, target_course_id } = body;

    if (!question_id || !target_course_id) {
      return NextResponse.json(
        { error: 'Question ID and target course ID are required' },
        { status: 400 }
      );
    }

    // Fetch the original question
    const { data: originalQuestion, error: fetchError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('id', question_id)
      .single();

    if (fetchError || !originalQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Create a copy of the question
    const { data: newQuestion, error: createError } = await supabase
      .from('exam_questions')
      .insert({
        course_id: target_course_id,
        template_id: originalQuestion.template_id, // Keep the same template_id if applicable
        question_text: originalQuestion.question_text,
        question_type: originalQuestion.question_type,
        options: originalQuestion.options,
        correct_answer: originalQuestion.correct_answer,
        points: originalQuestion.points,
        order_index: originalQuestion.order_index,
        difficulty_level: originalQuestion.difficulty_level,
        tags: originalQuestion.tags,
      })
      .select()
      .single();

    if (createError || !newQuestion) {
      console.error('Error creating question copy:', createError);
      return NextResponse.json({ error: 'Failed to clone question' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      question: newQuestion,
      message: 'Question cloned successfully'
    });
  } catch (error) {
    console.error('Error in clone question API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

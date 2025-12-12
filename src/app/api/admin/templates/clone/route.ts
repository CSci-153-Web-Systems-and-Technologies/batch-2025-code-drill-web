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
    const { template_id, target_course_id, new_title } = body;

    if (!template_id || !target_course_id) {
      return NextResponse.json(
        { error: 'Template ID and target course ID are required' },
        { status: 400 }
      );
    }

    // Fetch the original template
    const { data: originalTemplate, error: fetchError } = await supabase
      .from('exam_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (fetchError || !originalTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create a copy of the template
    const { data: newTemplate, error: createError } = await supabase
      .from('exam_templates')
      .insert({
        course_id: target_course_id,
        title: new_title || `${originalTemplate.title} (Copy)`,
        description: originalTemplate.description,
        exam_type: originalTemplate.exam_type,
        duration_minutes: originalTemplate.duration_minutes,
        total_points: originalTemplate.total_points,
      })
      .select()
      .single();

    if (createError || !newTemplate) {
      console.error('Error creating template copy:', createError);
      return NextResponse.json({ error: 'Failed to clone template' }, { status: 500 });
    }

    // Fetch questions from the original template
    const { data: originalQuestions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('template_id', template_id);

    // Clone questions to the new template
    if (originalQuestions && originalQuestions.length > 0) {
      const questionsToInsert = originalQuestions.map(q => ({
        template_id: newTemplate.id,
        course_id: target_course_id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: q.order_index,
        difficulty_level: q.difficulty_level,
        tags: q.tags,
      }));

      await supabase.from('exam_questions').insert(questionsToInsert);
    }

    return NextResponse.json({ 
      success: true, 
      template: newTemplate,
      message: 'Template cloned successfully'
    });
  } catch (error) {
    console.error('Error in clone template API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

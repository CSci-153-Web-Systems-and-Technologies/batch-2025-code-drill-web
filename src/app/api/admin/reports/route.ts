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
  const templateId = searchParams.get('template_id');
  const courseId = searchParams.get('course_id');

  if (!templateId && !courseId) {
    return NextResponse.json({ error: 'template_id or course_id required' }, { status: 400 });
  }

  // Get all questions for the template/course
  let questionQuery = supabase
    .from('exam_questions')
    .select('*');

  if (templateId) {
    questionQuery = questionQuery.eq('template_id', templateId);
  }

  const { data: questions, error: questionsError } = await questionQuery;

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  // Get answer statistics for each question
  const questionStats = await Promise.all(
    (questions || []).map(async (question) => {
      // Total attempts
      const { count: totalAttempts } = await supabase
        .from('user_exam_answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', question.id);

      // Correct attempts
      const { count: correctAttempts } = await supabase
        .from('user_exam_answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', question.id)
        .eq('is_correct', true);

      // Average points earned
      const { data: pointsData } = await supabase
        .from('user_exam_answers')
        .select('points_earned')
        .eq('question_id', question.id)
        .not('points_earned', 'is', null);

      const avgPoints = pointsData && pointsData.length > 0
        ? pointsData.reduce((sum, a) => sum + (a.points_earned || 0), 0) / pointsData.length
        : 0;

      const correctRate = totalAttempts && totalAttempts > 0
        ? (correctAttempts || 0) / totalAttempts
        : 0;

      // Difficulty index (% correct)
      const difficultyIndex = correctRate;

      // Discrimination index (simplified: compare top 27% vs bottom 27%)
      const { data: allAnswers } = await supabase
        .from('user_exam_answers')
        .select('points_earned')
        .eq('question_id', question.id)
        .not('points_earned', 'is', null)
        .order('points_earned', { ascending: false });

      let discriminationIndex = 0;
      if (allAnswers && allAnswers.length >= 10) {
        const topCount = Math.ceil(allAnswers.length * 0.27);
        const topCorrect = allAnswers.slice(0, topCount).filter(a => (a.points_earned || 0) >= question.points * 0.7).length;
        const bottomCorrect = allAnswers.slice(-topCount).filter(a => (a.points_earned || 0) >= question.points * 0.7).length;
        discriminationIndex = (topCorrect - bottomCorrect) / topCount;
      }

      return {
        question_id: question.id,
        question_number: question.question_number,
        title: question.title,
        question_type: question.question_type,
        difficulty: question.difficulty,
        points: question.points,
        totalAttempts: totalAttempts || 0,
        correctAttempts: correctAttempts || 0,
        correctRate: Math.round(correctRate * 10000) / 100,
        avgPoints: Math.round(avgPoints * 100) / 100,
        difficultyIndex: Math.round(difficultyIndex * 10000) / 100,
        discriminationIndex: Math.round(discriminationIndex * 10000) / 100,
      };
    })
  );

  // Sort by question number
  questionStats.sort((a, b) => a.question_number - b.question_number);

  // Calculate overall template stats
  const totalAttempts = questionStats.reduce((sum, q) => sum + q.totalAttempts, 0);
  const avgCorrectRate = questionStats.length > 0
    ? questionStats.reduce((sum, q) => sum + q.correctRate, 0) / questionStats.length
    : 0;

  return NextResponse.json({
    report: {
      templateId,
      courseId,
      totalQuestions: questions?.length || 0,
      totalAttempts,
      avgCorrectRate: Math.round(avgCorrectRate * 100) / 100,
      questions: questionStats,
    }
  });
}

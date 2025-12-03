'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ProfessorCourse,
  CourseWithProgress,
  ExamTemplate,
  ExamTemplateWithProgress,
  ExamQuestion,
  ExamQuestionWithAnswer,
  UserExamProgress,
  UserExamAnswer,
  BlankAnswerInput,
  AnswerCheckResult,
  ExamResults,
  ExamSessionData,
  CourseStats,
} from '@/types/professor-exam';

// ============================================================================
// COURSE ACTIONS
// ============================================================================

/**
 * Get all professor courses with optional progress aggregation
 */
export async function getCourses(includeProgress = false): Promise<CourseWithProgress[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: courses, error } = await supabase
    .from('professor_courses')
    .select('*')
    .order('course_code');

  if (error) throw error;

  if (!includeProgress) {
    return courses as CourseWithProgress[];
  }

  // Get progress for each course
  const coursesWithProgress = await Promise.all(
    courses.map(async (course) => {
      const templates = await getCourseExamTemplates(course.id);
      
      const progressData: CourseWithProgress = {
        ...course,
        code_analysis_progress: undefined,
        output_tracing_progress: undefined,
        essay_progress: undefined,
      };

      for (const template of templates) {
        const { data: progress } = await supabase
          .from('user_exam_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .single();

        if (progress) {
          const progressSummary = {
            completed: progress.questions_completed,
            total: progress.total_questions,
            accuracy: progress.accuracy,
          };

          if (template.exam_type === 'code_analysis') {
            progressData.code_analysis_progress = progressSummary;
          } else if (template.exam_type === 'output_tracing') {
            progressData.output_tracing_progress = progressSummary;
          } else if (template.exam_type === 'essay') {
            progressData.essay_progress = progressSummary;
          }
        }
      }

      return progressData;
    })
  );

  return coursesWithProgress;
}

/**
 * Get a single course by ID
 */
export async function getCourseById(courseId: string): Promise<ProfessorCourse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('professor_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get course statistics for a user
 */
export async function getCourseStats(courseId: string): Promise<CourseStats> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const course = await getCourseById(courseId);
  
  const { data: progressRecords, error } = await supabase
    .from('user_exam_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId);

  if (error) throw error;

  const totalExams = progressRecords?.length || 0;
  const completedExams = progressRecords?.filter(p => p.status === 'completed').length || 0;
  const avgAccuracy = totalExams > 0 
    ? progressRecords.reduce((sum, p) => sum + p.accuracy, 0) / totalExams 
    : 0;
  const totalTimeSpent = progressRecords?.reduce((sum, p) => sum + p.time_spent_seconds, 0) || 0;

  return {
    course,
    total_exams: totalExams,
    completed_exams: completedExams,
    avg_accuracy: avgAccuracy,
    total_time_spent_minutes: Math.round(totalTimeSpent / 60),
  };
}

// ============================================================================
// EXAM TEMPLATE ACTIONS
// ============================================================================

/**
 * Get all exam templates for a course
 */
export async function getCourseExamTemplates(courseId: string): Promise<ExamTemplateWithProgress[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: templates, error } = await supabase
    .from('exam_templates')
    .select('*')
    .eq('course_id', courseId)
    .order('exam_type');

  if (error) throw error;

  // Get progress for each template
  const templatesWithProgress = await Promise.all(
    templates.map(async (template) => {
      const { data: progress } = await supabase
        .from('user_exam_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', template.id)
        .single();

      return {
        ...template,
        progress: progress || undefined,
      };
    })
  );

  return templatesWithProgress;
}

/**
 * Get a single exam template by ID
 */
export async function getExamTemplateById(templateId: string): Promise<ExamTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// QUESTION ACTIONS
// ============================================================================

/**
 * Get all questions for an exam template
 */
export async function getExamQuestions(templateId: string): Promise<ExamQuestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('template_id', templateId)
    .order('question_number');

  if (error) throw error;
  return data;
}

/**
 * Get a single question with user's answer
 */
export async function getQuestionWithAnswer(questionId: string): Promise<ExamQuestionWithAnswer> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: question, error: questionError } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionError) throw questionError;

  const { data: answer } = await supabase
    .from('user_exam_answers')
    .select('*')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single();

  return {
    ...question,
    user_answer: answer || undefined,
  };
}

// ============================================================================
// PROGRESS ACTIONS
// ============================================================================

/**
 * Start or resume an exam session
 */
export async function startExamSession(
  courseId: string,
  templateId: string
): Promise<ExamSessionData> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get template and questions
  const template = await getExamTemplateById(templateId);
  const questions = await getExamQuestions(templateId);

  // Call RPC to create or get progress
  const { data: progressId, error: rpcError } = await supabase.rpc('start_exam_session', {
    p_user_id: user.id,
    p_course_id: courseId,
    p_template_id: templateId,
    p_total_questions: questions.length,
    p_max_points: template.total_points,
  });

  if (rpcError) throw rpcError;

  // Get the created/updated progress
  const { data: progress, error: progressError } = await supabase
    .from('user_exam_progress')
    .select('*')
    .eq('id', progressId)
    .single();

  if (progressError) throw progressError;

  // Get existing answers
  const { data: answers } = await supabase
    .from('user_exam_answers')
    .select('*')
    .eq('user_id', user.id)
    .eq('progress_id', progressId);

  return {
    template,
    questions,
    progress,
    answers: answers || [],
  };
}

/**
 * Get user's exam progress
 */
export async function getUserProgress(templateId: string): Promise<UserExamProgress | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_exam_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('template_id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

/**
 * Get exam results
 */
export async function getExamResults(progressId: string): Promise<ExamResults> {
  const supabase = await createClient();

  const { data: progress, error } = await supabase
    .from('user_exam_progress')
    .select('*')
    .eq('id', progressId)
    .single();

  if (error) throw error;

  const { data: answers } = await supabase
    .from('user_exam_answers')
    .select('*')
    .eq('progress_id', progressId);

  const answeredQuestions = answers?.filter(a => a.submitted_at !== null).length || 0;

  return {
    progress,
    total_questions: progress.total_questions,
    answered_questions: answeredQuestions,
    correct_answers: progress.correct_answers,
    total_points: progress.total_points,
    max_points: progress.max_points,
    accuracy: progress.accuracy,
    time_spent_minutes: Math.round(progress.time_spent_seconds / 60),
    status: progress.status,
  };
}

// ============================================================================
// ANSWER SUBMISSION ACTIONS
// ============================================================================

/**
 * Submit fill-in-the-blanks answer (code analysis)
 */
export async function submitBlanksAnswer(
  questionId: string,
  progressId: string,
  blankAnswers: BlankAnswerInput,
  timeSpent: number
): Promise<AnswerCheckResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('check_blanks_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_blank_answers: blankAnswers,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return data;
}

/**
 * Submit output tracing answer
 */
export async function submitOutputAnswer(
  questionId: string,
  progressId: string,
  outputAnswer: string,
  timeSpent: number
): Promise<AnswerCheckResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('check_output_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_output_answer: outputAnswer,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return data;
}

/**
 * Submit essay answer (no auto-grading)
 */
export async function submitEssayAnswer(
  questionId: string,
  progressId: string,
  essayAnswer: string,
  wordCount: number,
  timeSpent: number
): Promise<string> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: answerId, error } = await supabase.rpc('submit_essay_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_essay_answer: essayAnswer,
    p_word_count: wordCount,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return answerId;
}

/**
 * Auto-save essay answer (without submission)
 */
export async function autoSaveEssay(
  questionId: string,
  progressId: string,
  essayAnswer: string,
  wordCount: number
): Promise<void> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if answer exists
  const { data: existingAnswer } = await supabase
    .from('user_exam_answers')
    .select('id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single();

  if (existingAnswer) {
    // Update existing answer
    const { error } = await supabase
      .from('user_exam_answers')
      .update({
        essay_answer: essayAnswer,
        word_count: wordCount,
        last_attempted_at: new Date().toISOString(),
      })
      .eq('id', existingAnswer.id);

    if (error) throw error;
  } else {
    // Create new answer (not submitted yet)
    const { error } = await supabase
      .from('user_exam_answers')
      .insert({
        user_id: user.id,
        question_id: questionId,
        progress_id: progressId,
        essay_answer: essayAnswer,
        word_count: wordCount,
        auto_graded: false,
        manually_reviewed: false,
        first_attempted_at: new Date().toISOString(),
        last_attempted_at: new Date().toISOString(),
      });

    if (error) throw error;
  }
}

// ============================================================================
// HINT TRACKING
// ============================================================================

/**
 * Track hint usage for a question
 */
export async function trackHintUsage(questionId: string, progressId: string): Promise<void> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: existingAnswer } = await supabase
    .from('user_exam_answers')
    .select('id, hints_used')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single();

  if (existingAnswer) {
    const { error } = await supabase
      .from('user_exam_answers')
      .update({
        hints_used: existingAnswer.hints_used + 1,
      })
      .eq('id', existingAnswer.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_exam_answers')
      .insert({
        user_id: user.id,
        question_id: questionId,
        progress_id: progressId,
        hints_used: 1,
        auto_graded: false,
        first_attempted_at: new Date().toISOString(),
      });

    if (error) throw error;
  }
}

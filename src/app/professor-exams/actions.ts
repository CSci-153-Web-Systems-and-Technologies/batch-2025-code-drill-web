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

/**
 * Submit multiple choice answer
 */
export async function submitMultipleChoiceAnswer(
  questionId: string,
  progressId: string,
  selectedChoice: string,
  timeSpent: number
): Promise<AnswerCheckResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('check_multiple_choice_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_selected_choice: selectedChoice,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return data;
}

/**
 * Submit true/false answer
 */
export async function submitTrueFalseAnswer(
  questionId: string,
  progressId: string,
  answerBoolean: boolean,
  timeSpent: number
): Promise<AnswerCheckResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('check_true_false_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_answer_boolean: answerBoolean,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return data;
}

/**
 * Submit identification answer (case-insensitive)
 */
export async function submitIdentificationAnswer(
  questionId: string,
  progressId: string,
  identificationAnswer: string,
  timeSpent: number
): Promise<AnswerCheckResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('check_identification_answer', {
    p_user_id: user.id,
    p_question_id: questionId,
    p_progress_id: progressId,
    p_identification_answer: identificationAnswer,
    p_time_spent: timeSpent,
  });

  if (error) throw error;
  return data;
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

// ============================================================================
// VERSIONING ACTIONS
// ============================================================================

/**
 * Get version history for a question
 */
export async function getQuestionVersionHistory(questionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('exam_question_versions')
    .select(`
      *,
      users!exam_question_versions_changed_by_fkey (
        name,
        email
      )
    `)
    .eq('question_id', questionId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching version history:', error);
    return [];
  }

  return data.map(version => ({
    id: version.id,
    question_id: version.question_id,
    version_number: version.version_number,
    question_data: version.question_data,
    changed_by: version.changed_by,
    changed_at: version.changed_at,
    change_description: version.change_description,
    created_at: version.created_at,
    user_name: version.users?.name || null,
    user_email: version.users?.email || null,
  }));
}

/**
 * Rollback question to a specific version
 */
export async function rollbackQuestionToVersion(
  questionId: string,
  versionNumber: number
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('rollback_question_to_version', {
      p_question_id: questionId,
      p_version_number: versionNumber,
    });

  if (error) {
    console.error('Error rolling back question:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Compare two versions of a question
 */
export async function compareQuestionVersions(
  questionId: string,
  version1: number,
  version2: number
) {
  const supabase = await createClient();
  
  const { data: versions, error } = await supabase
    .from('exam_question_versions')
    .select('*')
    .eq('question_id', questionId)
    .in('version_number', [version1, version2]);

  if (error || !versions || versions.length !== 2) {
    return { success: false, error: 'Failed to fetch versions for comparison' };
  }

  const v1 = versions.find(v => v.version_number === version1);
  const v2 = versions.find(v => v.version_number === version2);

  if (!v1 || !v2) {
    return { success: false, error: 'Version not found' };
  }

  // Compare all fields
  const fields = [
    'title',
    'question_text',
    'code_snippet',
    'blanks',
    'expected_output',
    'output_tips',
    'essay_context',
    'essay_requirements',
    'essay_structure_guide',
    'points',
    'difficulty',
    'hints',
  ];

  const differences = fields.map(field => ({
    field,
    old_value: v1.question_data[field],
    new_value: v2.question_data[field],
    changed: JSON.stringify(v1.question_data[field]) !== JSON.stringify(v2.question_data[field]),
  })).filter(diff => diff.changed);

  return {
    success: true,
    version1: { ...v1.question_data, version_number: v1.version_number },
    version2: { ...v2.question_data, version_number: v2.version_number },
    differences,
  };
}

// ============================================================================
// PUBLISH/UNPUBLISH ACTIONS
// ============================================================================

/**
 * Publish a question
 */
export async function publishQuestion(questionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('publish_question', {
      p_question_id: questionId,
    });

  if (error) {
    console.error('Error publishing question:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Unpublish a question
 */
export async function unpublishQuestion(questionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('unpublish_question', {
      p_question_id: questionId,
    });

  if (error) {
    console.error('Error unpublishing question:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Bulk publish questions
 */
export async function bulkPublishQuestions(questionIds: string[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('bulk_publish_questions', {
      p_question_ids: questionIds,
    });

  if (error) {
    console.error('Error bulk publishing questions:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Bulk unpublish questions
 */
export async function bulkUnpublishQuestions(questionIds: string[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('bulk_unpublish_questions', {
      p_question_ids: questionIds,
    });

  if (error) {
    console.error('Error bulk unpublishing questions:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Get questions with publish status for professor dashboard
 */
export async function getQuestionsWithPublishStatus(
  templateId?: string,
  publishedOnly?: boolean,
  courseId?: string
) {
  const supabase = await createClient();
  
  // If filtering by courseId, first get all templates for that course
  if (courseId && !templateId) {
    const { data: templates } = await supabase
      .from('exam_templates')
      .select('id')
      .eq('course_id', courseId);
    
    if (!templates || templates.length === 0) {
      return [];
    }
    
    const templateIds = templates.map(t => t.id);
    
    let query = supabase
      .from('exam_questions')
      .select(`
        *,
        exam_templates (
          title,
          exam_type,
          course_id
        ),
        users!exam_questions_published_by_fkey (
          name,
          email
        )
      `)
      .in('template_id', templateIds)
      .order('question_number');
    
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching questions with publish status:', error);
      return [];
    }
    
    return data;
  }
  
  // Original logic for templateId filtering
  let query = supabase
    .from('exam_questions')
    .select(`
      *,
      exam_templates (
        title,
        exam_type,
        course_id
      ),
      users!exam_questions_published_by_fkey (
        name,
        email
      )
    `)
    .order('question_number');

  if (templateId) {
    query = query.eq('template_id', templateId);
  }

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching questions with publish status:', error);
    return [];
  }

  return data;
}

// ============================================================================
// PREVIEW TOKEN ACTIONS
// ============================================================================

/**
 * Generate a preview token for a question
 */
export async function generatePreviewToken(
  questionId: string,
  expiresInDays: number = 7,
  allowedViews: number = 10,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data, error } = await supabase
    .from('preview_tokens')
    .insert({
      question_id: questionId,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      allowed_views: allowedViews,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating preview token:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    token: data.token,
    expires_at: data.expires_at,
    allowed_views: data.allowed_views,
  };
}

/**
 * Validate a preview token
 */
export async function validatePreviewToken(token: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('validate_preview_token', {
      p_token: token,
    });

  if (error) {
    console.error('Error validating preview token:', error);
    return { valid: false, error: error.message };
  }

  return data;
}

/**
 * Get preview tokens created by the current user
 */
export async function getUserPreviewTokens(questionId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from('preview_tokens')
    .select(`
      *,
      exam_questions (
        id,
        title,
        question_type
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (questionId) {
    query = query.eq('question_id', questionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching preview tokens:', error);
    return [];
  }

  return data;
}

/**
 * Deactivate a preview token
 */
export async function deactivatePreviewToken(tokenId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('preview_tokens')
    .update({ is_active: false })
    .eq('id', tokenId);

  if (error) {
    console.error('Error deactivating preview token:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get question by preview token (for public preview page)
 */
export async function getQuestionByPreviewToken(token: string) {
  // First validate the token
  const validation = await validatePreviewToken(token);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('id', validation.question_id)
    .single();

  if (error) {
    console.error('Error fetching question:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    question: data,
    views_remaining: validation.views_remaining,
  };
}

// ============================================================================
// QUESTION CRUD ACTIONS
// ============================================================================

/**
 * Create a new question
 */
export async function createQuestion(data: {
  template_id: string;
  title: string;
  question_text: string;
  question_type: 'fill_blanks' | 'trace_output' | 'essay' | 'multiple_choice' | 'true_false' | 'identification';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  code_snippet?: string | null;
  blanks?: Record<string, string> | null;
  expected_output?: string | null;
  output_tips?: string[] | null;
  essay_context?: string | null;
  essay_requirements?: any | null;
  essay_structure_guide?: string | null;
  choices?: Array<{ id: string; text: string }> | null;
  correct_answer?: string | null;
  correct_boolean?: boolean | null;
  hints?: string[];
  time_estimate_minutes?: number | null;
  question_number?: number;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Get next question number if not provided
  let questionNumber = data.question_number;
  if (!questionNumber) {
    const { data: existingQuestions } = await supabase
      .from('exam_questions')
      .select('question_number')
      .eq('template_id', data.template_id)
      .order('question_number', { ascending: false })
      .limit(1);
    
    questionNumber = existingQuestions && existingQuestions.length > 0 
      ? existingQuestions[0].question_number + 1 
      : 1;
  }

  // Insert the question
  const { data: newQuestion, error: insertError } = await supabase
    .from('exam_questions')
    .insert({
      template_id: data.template_id,
      question_number: questionNumber,
      title: data.title,
      question_text: data.question_text,
      question_type: data.question_type,
      difficulty: data.difficulty,
      points: data.points,
      code_snippet: data.code_snippet || null,
      blanks: data.blanks || null,
      expected_output: data.expected_output || null,
      output_tips: data.output_tips || null,
      essay_context: data.essay_context || null,
      essay_requirements: data.essay_requirements || null,
      essay_structure_guide: data.essay_structure_guide || null,
      choices: data.choices || null,
      correct_answer: data.correct_answer || null,
      correct_boolean: data.correct_boolean || null,
      hints: data.hints || null,
      time_estimate_minutes: data.time_estimate_minutes || null,
      is_published: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating question:', insertError);
    return { success: false, error: insertError.message };
  }

  // Create initial version snapshot
  const { error: versionError } = await supabase
    .from('exam_question_versions')
    .insert({
      question_id: newQuestion.id,
      version_number: 1,
      question_data: newQuestion,
      changed_by: user.id,
      change_description: 'Initial version',
    });

  if (versionError) {
    console.error('Error creating initial version:', versionError);
    // Don't fail the entire operation if version creation fails
  }

  return { 
    success: true, 
    questionId: newQuestion.id,
    question: newQuestion,
  };
}

/**
 * Update an existing question
 */
export async function updateQuestion(data: {
  id: string;
  template_id?: string;
  question_number?: number;
  title?: string;
  question_text?: string;
  question_type: 'fill_blanks' | 'trace_output' | 'essay' | 'multiple_choice' | 'true_false' | 'identification';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  points?: number;
  code_snippet?: string | null;
  blanks?: Record<string, string> | null;
  expected_output?: string | null;
  output_tips?: string[] | null;
  essay_context?: string | null;
  essay_requirements?: any | null;
  essay_structure_guide?: string | null;
  choices?: Array<{ id: string; text: string }> | null;
  correct_answer?: string | null;
  correct_boolean?: boolean | null;
  hints?: string[];
  time_estimate_minutes?: number | null;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Get the current question for version comparison
  const { data: currentQuestion, error: fetchError } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('id', data.id)
    .single();

  if (fetchError || !currentQuestion) {
    return { success: false, error: 'Question not found' };
  }

  // Prepare update data (only include provided fields)
  const updateData: any = {};
  if (data.template_id !== undefined) updateData.template_id = data.template_id;
  if (data.question_number !== undefined) updateData.question_number = data.question_number;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.question_text !== undefined) updateData.question_text = data.question_text;
  if (data.question_type !== undefined) updateData.question_type = data.question_type;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.points !== undefined) updateData.points = data.points;
  if (data.code_snippet !== undefined) updateData.code_snippet = data.code_snippet;
  if (data.blanks !== undefined) updateData.blanks = data.blanks;
  if (data.expected_output !== undefined) updateData.expected_output = data.expected_output;
  if (data.output_tips !== undefined) updateData.output_tips = data.output_tips;
  if (data.essay_context !== undefined) updateData.essay_context = data.essay_context;
  if (data.essay_requirements !== undefined) updateData.essay_requirements = data.essay_requirements;
  if (data.essay_structure_guide !== undefined) updateData.essay_structure_guide = data.essay_structure_guide;
  if (data.choices !== undefined) updateData.choices = data.choices;
  if (data.correct_answer !== undefined) updateData.correct_answer = data.correct_answer;
  if (data.correct_boolean !== undefined) updateData.correct_boolean = data.correct_boolean;
  if (data.hints !== undefined) updateData.hints = data.hints;
  if (data.time_estimate_minutes !== undefined) updateData.time_estimate_minutes = data.time_estimate_minutes;
  
  updateData.updated_at = new Date().toISOString();

  // Update the question
  const { data: updatedQuestion, error: updateError } = await supabase
    .from('exam_questions')
    .update(updateData)
    .eq('id', data.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating question:', updateError);
    return { success: false, error: updateError.message };
  }

  // Get current version number
  const { data: versions } = await supabase
    .from('exam_question_versions')
    .select('version_number')
    .eq('question_id', data.id)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

  // Create version snapshot (via database trigger or manually)
  const { error: versionError } = await supabase
    .from('exam_question_versions')
    .insert({
      question_id: data.id,
      version_number: nextVersion,
      question_data: updatedQuestion,
      changed_by: user.id,
      change_description: 'Question updated',
    });

  if (versionError) {
    console.error('Error creating version snapshot:', versionError);
    // Don't fail the entire operation
  }

  return { 
    success: true, 
    question: updatedQuestion,
  };
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Check if user has permission (professor or admin)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || (userData.role !== 'professor' && userData.role !== 'admin')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  // Delete the question (cascade will handle versions and tokens)
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

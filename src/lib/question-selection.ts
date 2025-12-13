'use server';

import { createClient } from '@/lib/supabase/server';
import type { ExamQuestion, QuestionTypeCategory } from '@/types/professor-exam';

interface QuestionFilters {
  courseId?: string;
  tags?: string[];
  questionTypes?: QuestionTypeCategory[];
  excludeQuestionIds?: string[];
}

interface PracticeQuestion extends ExamQuestion {
  last_seen_at?: string | null;
  times_seen?: number;
  times_correct?: number;
  times_incorrect?: number;
}

/**
 * Select questions for practice session using smart selection algorithm
 * Prioritizes questions user hasn't seen or struggled with
 * 
 * Algorithm:
 * 1. Filter by course, tags, question types
 * 2. Join with user_question_history to get seen status
 * 3. Prioritize: never seen > seen longest ago > most incorrect
 * 4. Use SQL ordering with NULLS FIRST for unseen questions
 * 5. Limit to maxCount
 */
export async function selectPracticeQuestions(
  userId: string,
  filters: QuestionFilters,
  maxCount: number = 5
): Promise<PracticeQuestion[]> {
  const supabase = await createClient();
  
  try {
    // Build the base query
    let query = supabase
      .from('exam_questions')
      .select(`
        *,
        user_question_history!left (
          last_seen_at,
          times_seen,
          times_correct,
          times_incorrect
        )
      `)
      .eq('is_published', true);
    
    // Apply filters
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    
    if (filters.questionTypes && filters.questionTypes.length > 0) {
      query = query.in('question_type_category', filters.questionTypes);
    }
    
    // Tag filtering: questions must have at least one of the selected tags
    if (filters.tags && filters.tags.length > 0) {
      // Use array overlap operator: tags && ARRAY[...]
      query = query.overlaps('tags', filters.tags);
    }
    
    // Exclude specific questions (e.g., already in current session)
    if (filters.excludeQuestionIds && filters.excludeQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeQuestionIds.join(',')})`);
    }
    
    // Fetch all matching questions
    const { data: questions, error } = await query;
    
    if (error) throw error;
    
    if (!questions || questions.length === 0) {
      return [];
    }
    
    // Process results to flatten user_question_history
    const processedQuestions: PracticeQuestion[] = questions.map(q => {
      const history = Array.isArray(q.user_question_history) && q.user_question_history.length > 0
        ? q.user_question_history.find((h: any) => h) // Get first non-null history
        : null;
      
      return {
        ...q,
        last_seen_at: history?.last_seen_at || null,
        times_seen: history?.times_seen || 0,
        times_correct: history?.times_correct || 0,
        times_incorrect: history?.times_incorrect || 0,
      };
    });
    
    // Sort using smart selection algorithm
    processedQuestions.sort((a, b) => {
      // Priority 1: Never seen questions first (NULLS FIRST)
      if (a.last_seen_at === null && b.last_seen_at !== null) return -1;
      if (a.last_seen_at !== null && b.last_seen_at === null) return 1;
      
      // Priority 2: If both seen, prioritize questions with more incorrect answers
      if (a.last_seen_at !== null && b.last_seen_at !== null) {
        if (a.times_incorrect !== b.times_incorrect) {
          return (b.times_incorrect || 0) - (a.times_incorrect || 0);
        }
        
        // Priority 3: Older questions first
        return new Date(a.last_seen_at || 0).getTime() - new Date(b.last_seen_at || 0).getTime();
      }
      
      // Priority 4: Random for never-seen questions
      return Math.random() - 0.5;
    });
    
    // Return top maxCount questions
    return processedQuestions.slice(0, maxCount);
    
  } catch (error) {
    console.error('Error selecting practice questions:', error);
    throw new Error('Failed to select practice questions');
  }
}

/**
 * Select exactly one question per question type
 * Used for mixed-mode practice sessions
 */
export async function selectMixedQuestions(
  userId: string,
  filters: QuestionFilters,
  questionTypes: QuestionTypeCategory[]
): Promise<PracticeQuestion[]> {
  const selectedQuestions: PracticeQuestion[] = [];
  
  for (const type of questionTypes) {
    const questions = await selectPracticeQuestions(
      userId,
      {
        ...filters,
        questionTypes: [type],
        excludeQuestionIds: selectedQuestions.map(q => q.id),
      },
      1 // Only 1 question per type
    );
    
    if (questions.length > 0) {
      selectedQuestions.push(questions[0]);
    }
  }
  
  return selectedQuestions;
}

/**
 * Update user question history after viewing a question
 */
export async function recordQuestionSeen(userId: string, questionId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.rpc('upsert_question_history', {
      p_user_id: userId,
      p_question_id: questionId,
    });
    
    if (error) {
      // If RPC function doesn't exist, use direct upsert
      await supabase
        .from('user_question_history')
        .upsert({
          user_id: userId,
          question_id: questionId,
          last_seen_at: new Date().toISOString(),
          times_seen: 1,
        }, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false,
        });
    }
  } catch (error) {
    console.error('Error recording question seen:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Update user question history after answering
 */
export async function recordQuestionAnswer(
  userId: string,
  questionId: string,
  isCorrect: boolean
) {
  const supabase = await createClient();
  
  try {
    // Get current history
    const { data: existing } = await supabase
      .from('user_question_history')
      .select('times_seen, times_correct, times_incorrect')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();
    
    const updates = {
      user_id: userId,
      question_id: questionId,
      last_seen_at: new Date().toISOString(),
      times_seen: (existing?.times_seen || 0) + 1,
      times_correct: (existing?.times_correct || 0) + (isCorrect ? 1 : 0),
      times_incorrect: (existing?.times_incorrect || 0) + (isCorrect ? 0 : 1),
      updated_at: new Date().toISOString(),
    };
    
    await supabase
      .from('user_question_history')
      .upsert(updates, {
        onConflict: 'user_id,question_id',
      });
      
  } catch (error) {
    console.error('Error recording question answer:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get count of available questions matching filters
 * Useful for showing "X questions available" before starting session
 */
export async function getAvailableQuestionCount(filters: QuestionFilters): Promise<number> {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('exam_questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);
    
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    
    if (filters.questionTypes && filters.questionTypes.length > 0) {
      query = query.in('question_type_category', filters.questionTypes);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error getting question count:', error);
    return 0;
  }
}

/**
 * Get breakdown of available questions by type
 * Shows how many questions are available for each question type
 */
export async function getQuestionTypeBreakdown(filters: Omit<QuestionFilters, 'questionTypes'>) {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('exam_questions')
      .select('question_type_category')
      .eq('is_published', true);
    
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Count by type
    const counts: Record<QuestionTypeCategory, number> = {
      code_analysis: 0,
      output_tracing: 0,
      essay: 0,
      multiple_choice: 0,
      true_false: 0,
    };
    
    data?.forEach(q => {
      if (q.question_type_category in counts) {
        counts[q.question_type_category as QuestionTypeCategory]++;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error getting question type breakdown:', error);
    return null;
  }
}

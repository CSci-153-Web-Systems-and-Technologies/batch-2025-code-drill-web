'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PracticeSessionConfig, PracticeSession, ActiveSessionData } from '@/types/practice';

export async function createPracticeSession(config: PracticeSessionConfig) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Create the practice session
  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: user.id,
      difficulty: config.difficulty || null,
      category: config.category || null,
      time_limit: config.timeLimit,
      status: 'active',
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error('Error creating practice session:', sessionError);
    return { error: sessionError?.message || 'Failed to create practice session' };
  }

  // Get random problems based on filters
  let query = supabase.from('problems').select('id');

  if (config.difficulty) {
    query = query.eq('difficulty', config.difficulty);
  }

  if (config.category) {
    query = query.eq('category', config.category);
  }

  const { data: problems, error: problemsError } = await query.limit(10);

  if (problemsError || !problems || problems.length === 0) {
    console.error('Error fetching problems:', problemsError);
    return { error: 'No problems found matching criteria' };
  }

  // Add problems to session
  const sessionProblems = problems.map((problem) => ({
    session_id: session.id,
    problem_id: problem.id,
    status: 'pending' as const,
  }));

  const { error: problemsInsertError } = await supabase
    .from('session_problems')
    .insert(sessionProblems);

  if (problemsInsertError) {
    console.error('Error adding problems to session:', problemsInsertError);
    return { error: 'Failed to add problems to session' };
  }

  revalidatePath('/practice');
  return { data: session };
}

export async function getActiveSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: session, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active session:', error);
    return { error: 'Failed to fetch active session' };
  }

  return { data: session };
}

export async function getSessionDetails(sessionId: string): Promise<{ data?: ActiveSessionData; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      session_problems (
        *,
        problem:problems (
          id,
          title,
          difficulty,
          slug
        )
      )
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    console.error('Error fetching session details:', sessionError);
    return { error: 'Session not found' };
  }

  return { data: session as ActiveSessionData };
}

export async function updateSessionStatus(sessionId: string, status: 'completed' | 'abandoned') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('practice_sessions')
    .update({
      status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating session status:', error);
    return { error: 'Failed to update session' };
  }

  revalidatePath('/practice');
  revalidatePath(`/practice/${sessionId}`);
  return { success: true };
}

export async function updateSessionProblemStatus(
  sessionId: string,
  problemId: string,
  status: 'attempted' | 'solved',
  submissionId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const updateData: any = {
    status,
    ...(status === 'attempted' && { attempted_at: new Date().toISOString() }),
    ...(status === 'solved' && { solved_at: new Date().toISOString() }),
    ...(submissionId && { submission_id: submissionId }),
  };

  const { error } = await supabase
    .from('session_problems')
    .update(updateData)
    .eq('session_id', sessionId)
    .eq('problem_id', problemId);

  if (error) {
    console.error('Error updating session problem:', error);
    return { error: 'Failed to update problem status' };
  }

  // Update session stats
  const { data: sessionProblems } = await supabase
    .from('session_problems')
    .select('status')
    .eq('session_id', sessionId);

  if (sessionProblems) {
    const problemsAttempted = sessionProblems.filter(
      (sp) => sp.status === 'attempted' || sp.status === 'solved'
    ).length;
    const problemsSolved = sessionProblems.filter((sp) => sp.status === 'solved').length;

    await supabase
      .from('practice_sessions')
      .update({
        problems_attempted: problemsAttempted,
        problems_solved: problemsSolved,
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);
  }

  revalidatePath(`/practice/${sessionId}`);
  return { success: true };
}

export async function getPracticeHistory() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: sessions, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['completed', 'abandoned'])
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching practice history:', error);
    return { error: 'Failed to fetch practice history' };
  }

  return { data: sessions };
}

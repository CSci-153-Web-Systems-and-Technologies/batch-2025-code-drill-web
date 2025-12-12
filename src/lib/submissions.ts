/**
 * Submissions API
 * 
 * Functions for querying user submissions and submission history
 */

import { createClient } from '@/lib/supabase/server';

export interface SubmissionFilters {
  problemId?: string;
  language?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: string;
  runtime?: number;
  memory?: number;
  testCasesPassed: number;
  totalTestCases: number;
  pointsEarned: number;
  solveTimeSeconds?: number;
  errorMessage?: string;
  submittedAt: string;
  problem?: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
  };
}

export interface SubmissionStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  languagesUsed: string[];
  totalPointsEarned: number;
  averagePoints: number;
}

/**
 * Get user submissions with optional filtering and pagination
 */
export async function getUserSubmissions(
  userId: string,
  filters?: SubmissionFilters,
  page: number = 1,
  limit: number = 20
): Promise<{ submissions: Submission[]; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('submissions')
    .select(
      `
      *,
      problems:problem_id (
        id,
        title,
        slug,
        difficulty,
        category
      )
    `
    )
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit);

  // Apply filters
  if (filters?.problemId) {
    query = query.eq('problem_id', filters.problemId);
  }
  if (filters?.language) {
    query = query.eq('language', filters.language);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte('submitted_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('submitted_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching submissions:', error);
    return { submissions: [], hasMore: false };
  }

  const submissions: Submission[] = (data || []).map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    problemId: item.problem_id,
    language: item.language,
    code: item.code,
    status: item.status,
    runtime: item.runtime,
    memory: item.memory,
    testCasesPassed: item.test_cases_passed,
    totalTestCases: item.total_test_cases,
    pointsEarned: item.points_earned || 0,
    solveTimeSeconds: item.solve_time_seconds,
    errorMessage: item.error_message,
    submittedAt: item.submitted_at,
    problem: item.problems
      ? {
          id: item.problems.id,
          title: item.problems.title,
          slug: item.problems.slug,
          difficulty: item.problems.difficulty,
          category: item.problems.category,
        }
      : undefined,
  }));

  const hasMore = submissions.length === limit + 1;
  if (hasMore) {
    submissions.pop(); // Remove the extra item used for pagination check
  }

  return { submissions, hasMore };
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(
  submissionId: string,
  userId: string
): Promise<Submission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      *,
      problems:problem_id (
        id,
        title,
        slug,
        difficulty,
        category
      )
    `
    )
    .eq('id', submissionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching submission:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    problemId: data.problem_id,
    language: data.language,
    code: data.code,
    status: data.status,
    runtime: data.runtime,
    memory: data.memory,
    testCasesPassed: data.test_cases_passed,
    totalTestCases: data.total_test_cases,
    pointsEarned: data.points_earned || 0,
    solveTimeSeconds: data.solve_time_seconds,
    errorMessage: data.error_message,
    submittedAt: data.submitted_at,
    problem: data.problems
      ? {
          id: data.problems.id,
          title: data.problems.title,
          slug: data.problems.slug,
          difficulty: data.problems.difficulty,
          category: data.problems.category,
        }
      : undefined,
  };
}

/**
 * Get submission statistics for a user
 */
export async function getSubmissionStats(userId: string): Promise<SubmissionStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submissions')
    .select('status, language, points_earned')
    .eq('user_id', userId);

  if (error || !data) {
    console.error('Error fetching submission stats:', error);
    return {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      acceptanceRate: 0,
      languagesUsed: [],
      totalPointsEarned: 0,
      averagePoints: 0,
    };
  }

  const totalSubmissions = data.length;
  const acceptedSubmissions = data.filter((s) => s.status === 'Accepted').length;
  const acceptanceRate =
    totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0;

  const languagesSet = new Set(data.map((s) => s.language));
  const languagesUsed = Array.from(languagesSet);

  const totalPointsEarned = data.reduce((sum, s) => sum + (s.points_earned || 0), 0);
  const averagePoints = totalSubmissions > 0 ? totalPointsEarned / totalSubmissions : 0;

  return {
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    languagesUsed,
    totalPointsEarned,
    averagePoints: Math.round(averagePoints * 100) / 100,
  };
}

/**
 * Get submissions for a specific problem by a user
 */
export async function getProblemSubmissions(
  userId: string,
  problemId: string
): Promise<Submission[]> {
  const { submissions } = await getUserSubmissions(
    userId,
    { problemId },
    1,
    100 // Get up to 100 submissions for a problem
  );

  return submissions;
}

/**
 * Get recent submissions (last 10)
 */
export async function getRecentSubmissions(userId: string): Promise<Submission[]> {
  const { submissions } = await getUserSubmissions(userId, undefined, 1, 10);
  return submissions;
}

/**
 * Compare two submissions
 */
export async function compareSubmissions(
  submissionId1: string,
  submissionId2: string,
  userId: string
): Promise<{ submission1: Submission | null; submission2: Submission | null }> {
  const [submission1, submission2] = await Promise.all([
    getSubmissionById(submissionId1, userId),
    getSubmissionById(submissionId2, userId),
  ]);

  return { submission1, submission2 };
}

/**
 * Get unique languages used by user
 */
export async function getLanguagesUsed(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submissions')
    .select('language')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  const languagesSet = new Set(data.map((s) => s.language));
  return Array.from(languagesSet).sort();
}

/**
 * Get unique problems attempted by user
 */
export async function getProblemsAttempted(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submissions')
    .select('problem_id')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  const problemsSet = new Set(data.map((s) => s.problem_id));
  return Array.from(problemsSet);
}

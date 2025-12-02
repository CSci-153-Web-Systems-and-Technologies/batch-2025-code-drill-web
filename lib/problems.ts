import { createClient } from '@/lib/supabase/server';
import { Problem, DifficultyLevel } from '@/types';

/**
 * Fetch all problems with optional filtering
 */
export async function getProblems(filters?: {
  difficulty?: DifficultyLevel;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Problem[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching problems:', error);
    return [];
  }

  return (data || []).map(mapDatabaseToProblem);
}

/**
 * Fetch a single problem by slug
 */
export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching problem:', error);
    return null;
  }

  return data ? mapDatabaseToProblem(data) : null;
}

/**
 * Fetch a single problem by ID
 */
export async function getProblemById(id: string): Promise<Problem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching problem:', error);
    return null;
  }

  return data ? mapDatabaseToProblem(data) : null;
}

/**
 * Get unique categories from problems
 */
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('problems')
    .select('category');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categorySet = new Set(data?.map(p => p.category) || []);
  const categories = Array.from(categorySet);
  return categories.sort();
}

/**
 * Get problems count by difficulty
 */
export async function getProblemStats(): Promise<{
  total: number;
  easy: number;
  medium: number;
  hard: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('problems')
    .select('difficulty');

  if (error) {
    console.error('Error fetching problem stats:', error);
    return { total: 0, easy: 0, medium: 0, hard: 0 };
  }

  const stats = {
    total: data?.length || 0,
    easy: data?.filter(p => p.difficulty === 'Easy').length || 0,
    medium: data?.filter(p => p.difficulty === 'Medium').length || 0,
    hard: data?.filter(p => p.difficulty === 'Hard').length || 0,
  };

  return stats;
}

/**
 * Map database row to Problem interface
 */
function mapDatabaseToProblem(row: any): Problem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    difficulty: row.difficulty as DifficultyLevel,
    category: row.category,
    tags: row.tags || [],
    acceptanceRate: parseFloat(row.acceptance_rate) || 0,
    totalSubmissions: row.total_submissions || 0,
    totalAccepted: row.total_accepted || 0,
    exampleTestCases: row.example_test_cases || [],
    hiddenTestCases: row.hidden_test_cases || [],
    constraints: row.constraints || '',
    starterCode: row.starter_code || {},
    solutionTemplate: row.solution_template || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

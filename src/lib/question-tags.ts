'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Common programming tags for autocomplete suggestions
 * Organized by category for better UX
 */
export const COMMON_PROGRAMMING_TAGS = {
  loops: ['loops', 'for-loop', 'while-loop', 'do-while', 'nested-loops', 'loop-control', 'break-statement', 'continue-statement', 'infinite-loop'],
  arrays: ['arrays', '1d-arrays', '2d-arrays', 'multidimensional', 'array-traversal', 'array-manipulation', 'sorting', 'searching', 'array-bounds'],
  functions: ['functions', 'function-definition', 'function-prototype', 'parameters', 'arguments', 'return-values', 'void-functions', 'pass-by-value', 'pass-by-reference', 'scope', 'recursion-base'],
  recursion: ['recursion', 'base-case', 'recursive-case', 'tail-recursion', 'tree-recursion', 'backtracking', 'call-stack', 'stack-overflow', 'indirect-recursion'],
  pointers: ['pointers', 'pointer-declaration', 'pointer-arithmetic', 'dereferencing', 'address-of', 'null-pointer', 'double-pointers', 'void-pointer', 'dangling-pointers', 'memory-leaks'],
  control: ['if-statement', 'else-if', 'switch-case', 'ternary-operator', 'conditional-logic'],
  strings: ['strings', 'string-manipulation', 'string-comparison', 'string-concatenation', 'char-arrays'],
  structures: ['structs', 'unions', 'typedef', 'nested-structures', 'structure-pointers'],
  memory: ['dynamic-memory', 'malloc', 'calloc', 'realloc', 'free', 'memory-management', 'heap', 'stack'],
  io: ['input-output', 'printf', 'scanf', 'file-io', 'formatted-io'],
  operators: ['arithmetic-operators', 'relational-operators', 'logical-operators', 'bitwise-operators', 'assignment-operators'],
  debugging: ['debugging', 'testing', 'error-handling', 'edge-cases', 'validation'],
  algorithms: ['algorithms', 'complexity', 'time-complexity', 'space-complexity', 'optimization'],
} as const;

// Flatten all tags for easy searching
export const ALL_COMMON_TAGS = Object.values(COMMON_PROGRAMMING_TAGS).flat();

/**
 * Normalize tags: lowercase, trim, remove duplicates, sort
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0);
  
  return Array.from(new Set(normalized)).sort();
}

/**
 * Get all unique tags from exam questions for a course
 * Returns tags with question counts for autocomplete
 */
export async function getExistingTags(courseId?: string): Promise<Array<{ tag: string; count: number }>> {
  const supabase = await createClient();
  
  try {
    if (courseId) {
      // Use RPC function for course-specific tags
      const { data, error } = await supabase.rpc('get_course_tags', { p_course_id: courseId });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        tag: row.tag,
        count: Number(row.question_count),
      }));
    } else {
      // Get all tags across all courses
      const { data: questions, error } = await supabase
        .from('exam_questions')
        .select('tags')
        .eq('is_published', true);
      
      if (error) throw error;
      
      // Aggregate tags and count occurrences
      const tagCounts = new Map<string, number>();
      
      questions?.forEach(q => {
        q.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      
      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    }
  } catch (error) {
    console.error('Error fetching existing tags:', error);
    return [];
  }
}

/**
 * Suggest tags based on query string
 * Combines existing tags and common tags, sorted by relevance
 */
export async function suggestTags(
  query: string,
  courseId?: string,
  limit: number = 10
): Promise<Array<{ tag: string; count: number; isCommon: boolean }>> {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    // If no query, return most popular existing tags + common tags
    const existingTags = await getExistingTags(courseId);
    const suggestions = existingTags.slice(0, limit).map(t => ({ ...t, isCommon: false }));
    
    // Fill remaining with common tags
    const remainingSlots = limit - suggestions.length;
    if (remainingSlots > 0) {
      const commonNotInExisting = ALL_COMMON_TAGS
        .filter(tag => !existingTags.some(et => et.tag === tag))
        .slice(0, remainingSlots)
        .map(tag => ({ tag, count: 0, isCommon: true }));
      
      suggestions.push(...commonNotInExisting);
    }
    
    return suggestions;
  }
  
  // Filter existing tags by query
  const existingTags = await getExistingTags(courseId);
  const matchingExisting = existingTags
    .filter(t => t.tag.includes(normalizedQuery))
    .map(t => ({ ...t, isCommon: false }));
  
  // Filter common tags by query
  const matchingCommon = ALL_COMMON_TAGS
    .filter(tag => tag.includes(normalizedQuery))
    .filter(tag => !matchingExisting.some(et => et.tag === tag))
    .map(tag => ({ tag, count: 0, isCommon: true }));
  
  // Combine and limit
  const combined = [...matchingExisting, ...matchingCommon];
  
  // Sort: exact matches first, then by count, then alphabetically
  combined.sort((a, b) => {
    const aExact = a.tag === normalizedQuery ? 1 : 0;
    const bExact = b.tag === normalizedQuery ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    
    if (a.count !== b.count) return b.count - a.count;
    
    return a.tag.localeCompare(b.tag);
  });
  
  return combined.slice(0, limit);
}

/**
 * Validate tags: ensure they're reasonable length and format
 */
export function validateTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  tags.forEach((tag, index) => {
    if (tag.length === 0) {
      errors.push(`Tag ${index + 1} is empty`);
    } else if (tag.length > 50) {
      errors.push(`Tag "${tag}" is too long (max 50 characters)`);
    } else if (!/^[a-z0-9-]+$/.test(tag)) {
      errors.push(`Tag "${tag}" contains invalid characters (only lowercase letters, numbers, and hyphens allowed)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get tag statistics for a user
 * Returns performance metrics by tag
 */
export async function getUserTagStats(userId: string, courseId?: string) {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('user_tag_stats')
      .select('*')
      .eq('user_id', userId)
      .order('accuracy', { ascending: false });
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user tag stats:', error);
    return [];
  }
}

/**
 * Get weak areas (tags with low accuracy) for a user
 * Useful for recommending practice topics
 */
export async function getWeakAreas(userId: string, threshold: number = 60, limit: number = 5) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('user_tag_stats')
      .select('tag, accuracy, questions_attempted')
      .eq('user_id', userId)
      .lt('accuracy', threshold)
      .gte('questions_attempted', 2) // At least 2 attempts to be statistically relevant
      .order('accuracy', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching weak areas:', error);
    return [];
  }
}

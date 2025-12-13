'use server';

import { createClient } from '@/lib/supabase/server';
import { ALL_COMMON_TAGS, normalizeTags } from './question-tags';

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

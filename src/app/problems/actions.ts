'use server';

import { getProblems } from '@/lib/problems';
import { DifficultyLevel } from '@/types';

export async function fetchMoreProblems(
  page: number,
  filters?: {
    difficulty?: DifficultyLevel;
    category?: string;
    search?: string;
  }
) {
  const limit = 20;
  const offset = page * limit;

  try {
    const problems = await getProblems({
      ...filters,
      limit,
      offset,
    });

    return {
      success: true,
      problems,
      hasMore: problems.length === limit,
    };
  } catch (error) {
    console.error('Error fetching more problems:', error);
    return {
      success: false,
      problems: [],
      hasMore: false,
      error: 'Failed to load more problems',
    };
  }
}

'use server';

import { getUserSubmissions, type SubmissionFilters } from '@/lib/submissions';

export async function fetchMoreSubmissions(
  userId: string,
  page: number,
  filters?: SubmissionFilters
) {
  try {
    const { submissions, hasMore } = await getUserSubmissions(userId, filters, page, 20);

    return {
      success: true,
      submissions,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching more submissions:', error);
    return {
      success: false,
      submissions: [],
      hasMore: false,
      error: 'Failed to fetch submissions',
    };
  }
}

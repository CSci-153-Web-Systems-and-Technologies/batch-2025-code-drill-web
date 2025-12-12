'use client';

import { useState } from 'react';
import type { Submission, SubmissionStats } from '@/lib/submissions';
import SubmissionCard from '@/components/submissions/SubmissionCard';
import SubmissionFilters from '@/components/submissions/SubmissionFilters';
import SubmissionStatsDisplay from '@/components/submissions/SubmissionStatsDisplay';
import { fetchMoreSubmissions } from './actions';

interface Props {
  initialSubmissions: Submission[];
  initialHasMore: boolean;
  stats: SubmissionStats;
  availableLanguages: string[];
  userId: string;
}

export default function SubmissionsClient({
  initialSubmissions,
  initialHasMore,
  stats,
  availableLanguages,
  userId,
}: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const handleFilterChange = async (newFilters: typeof filters) => {
    setFilters(newFilters);
    setIsLoading(true);
    setCurrentPage(1);

    try {
      const result = await fetchMoreSubmissions(userId, 1, newFilters);
      if (result.success) {
        setSubmissions(result.submissions);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;

    try {
      const result = await fetchMoreSubmissions(userId, nextPage, filters);
      if (result.success) {
        setSubmissions([...submissions, ...result.submissions]);
        setHasMore(result.hasMore);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Display */}
      <SubmissionStatsDisplay stats={stats} />

      {/* Filters */}
      <SubmissionFilters
        filters={filters}
        availableLanguages={availableLanguages}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Submissions List */}
      <div className="space-y-4">
        {isLoading && submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-yellow-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-gray-800">
            <p className="text-gray-400 text-lg mb-2">No submissions found</p>
            <p className="text-gray-500 text-sm">
              {filters.language || filters.status || filters.dateFrom || filters.dateTo
                ? 'Try adjusting your filters'
                : 'Start solving problems to see your submission history'}
            </p>
          </div>
        ) : (
          <>
            {submissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent"></div>
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

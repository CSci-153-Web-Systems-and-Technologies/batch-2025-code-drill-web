'use client';

import { useState } from 'react';
import Container from '@/components/shared/Container';
import SearchBar from '@/components/ui/SearchBar';
import Dropdown from '@/components/ui/Dropdown';
import ProblemStats from '@/components/shared/ProblemStats';
import ProblemCard from '@/components/ui/ProblemCard';
import { Problem, DifficultyLevel } from '@/types';
import { fetchMoreProblems } from './actions';

interface ProblemsClientProps {
  initialProblems: Problem[];
  categories: string[];
  stats: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function ProblemsClient({
  initialProblems,
  categories,
  stats,
}: ProblemsClientProps) {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulties');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProblems.length >= 20);
  const [error, setError] = useState<string | null>(null);

  const difficultyOptions = ['All Difficulties', 'Easy', 'Medium', 'Hard'];
  const categoryOptions = ['All Categories', ...categories];

  // Filter problems client-side for now
  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      searchQuery === '' ||
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      selectedDifficulty === 'All Difficulties' ||
      problem.difficulty === selectedDifficulty;

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      problem.category === selectedCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Calculate points based on difficulty
  const getPoints = (difficulty: DifficultyLevel): number => {
    switch (difficulty) {
      case 'Easy':
        return 10;
      case 'Medium':
        return 15;
      case 'Hard':
        return 25;
      default:
        return 10;
    }
  };

  // Load more problems from server
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const filters = {
        difficulty:
          selectedDifficulty !== 'All Difficulties'
            ? (selectedDifficulty as DifficultyLevel)
            : undefined,
        category:
          selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      };

      const result = await fetchMoreProblems(currentPage + 1, filters);

      if (result.success && result.problems) {
        setProblems((prev) => [...prev, ...result.problems]);
        setCurrentPage((prev) => prev + 1);
        setHasMore(result.hasMore);
      } else {
        setError(result.error || 'Failed to load more problems');
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more problems:', err);
      setError('An unexpected error occurred');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Problem Browser</h1>
        <p className="text-gray-600">
          Discover and practice coding problems tailored to your skill level
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar onSearch={handleSearchChange} />
          <Dropdown
            label={selectedDifficulty}
            options={difficultyOptions}
            onChange={handleDifficultyChange}
          />
          <Dropdown
            label={selectedCategory}
            options={categoryOptions}
            onChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Stats */}
      <ProblemStats
        available={filteredProblems.length}
        completed={0}
        totalPoints={filteredProblems.reduce(
          (sum, p) => sum + getPoints(p.difficulty),
          0
        )}
        avgAccuracy={
          problems.length > 0
            ? Math.round(
                problems.reduce((sum, p) => sum + p.acceptanceRate, 0) /
                  problems.length
              )
            : 0
        }
      />

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.length > 0 ? (
          filteredProblems.map((problem) => (
            <ProblemCard
              key={problem.id}
              title={problem.title}
              description={problem.description}
              difficulty={problem.difficulty}
              tags={problem.tags}
              timeEstimate="25 min" // TODO: Calculate based on difficulty
              solvedCount={problem.totalAccepted}
              accuracy={Math.round(problem.acceptanceRate)}
              points={getPoints(problem.difficulty)}
              slug={problem.slug}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No problems found matching your filters.</p>
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && filteredProblems.length >= 20 && (
        <div className="mt-8 text-center">
          {error && (
            <p className="text-red-600 text-sm mb-2">{error}</p>
          )}
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Load More Problems'
            )}
          </button>
        </div>
      )}
    </Container>
  );
}

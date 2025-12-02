'use client';

import { useState } from 'react';
import Container from '@/components/shared/Container';
import SearchBar from '@/components/ui/SearchBar';
import Dropdown from '@/components/ui/Dropdown';
import ProblemStats from '@/components/shared/ProblemStats';
import ProblemCard from '@/components/ui/ProblemCard';
import { Problem, DifficultyLevel } from '@/types';

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

      {/* Load More Button - Hidden for now */}
      {filteredProblems.length >= 20 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              // TODO: Implement pagination
              console.log('Load more problems');
            }}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Problems'}
          </button>
        </div>
      )}
    </Container>
  );
}

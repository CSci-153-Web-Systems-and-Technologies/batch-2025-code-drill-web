import Container from '@/components/shared/Container';
import SearchBar from '@/components/ui/SearchBar';
import Dropdown from '@/components/ui/Dropdown';
import ProblemStats from '@/components/shared/ProblemStats';
import ProblemCard from '@/components/ui/ProblemCard';

export default function ProblemsPage() {
  const problems = [
    {
      title: 'Binary Tree Inorder Traversal',
      description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
      difficulty: 'Medium' as const,
      tags: ['Tree', 'Stack', 'Recursion'],
      timeEstimate: '25 min',
      solvedCount: 892,
      accuracy: 72,
      points: 15,
    },
    {
      title: 'Longest Palindromic Substring',
      description: 'Given a string s, return the longest palindromic substring in s.',
      difficulty: 'Medium' as const,
      tags: ['String', 'Dynamic Programming'],
      timeEstimate: '30 min',
      solvedCount: 678,
      accuracy: 65,
      points: 18,
    },
    {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
      difficulty: 'Easy' as const,
      tags: ['Array', 'Hash Table'],
      timeEstimate: '15 min',
      solvedCount: 1543,
      accuracy: 85,
      points: 10,
    },
    {
      title: 'Merge K Sorted Lists',
      description: 'You are given an array of k linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.',
      difficulty: 'Hard' as const,
      tags: ['Linked List', 'Divide and Conquer', 'Heap'],
      timeEstimate: '45 min',
      solvedCount: 234,
      accuracy: 48,
      points: 25,
    },
  ];

  const difficultyOptions = ['All Difficulties', 'Easy', 'Medium', 'Hard'];
  const categoryOptions = [
    'All Categories',
    'Arrays & Strings',
    'Linked Lists',
    'Trees & Graphs',
    'Dynamic Programming',
    'Sorting & Searching',
    'Hash Tables',
  ];

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
          <SearchBar />
          <Dropdown label="Medium" options={difficultyOptions} />
          <Dropdown label="All Categories" options={categoryOptions} />
        </div>
      </div>

      {/* Stats */}
      <ProblemStats
        available={2}
        completed={0}
        totalPoints={33}
        avgAccuracy={69}
      />

      {/* Problems List */}
      <div className="space-y-4">
        {problems.map((problem) => (
          <ProblemCard key={problem.title} {...problem} />
        ))}
      </div>

      {/* Load More Button */}
      <div className="mt-8 text-center">
        <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
          Load More Problems
        </button>
      </div>
    </Container>
  );
}

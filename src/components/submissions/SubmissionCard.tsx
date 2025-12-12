'use client';

import Link from 'next/link';
import type { Submission } from '@/lib/submissions';
import { formatSolveTime, getDifficultyColor } from '@/lib/scoring';
import { useState } from 'react';
import CodeViewer from './CodeViewer';

interface Props {
  submission: Submission;
}

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  'Wrong Answer': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Time Limit Exceeded': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Runtime Error': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Compilation Error': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const LANGUAGE_DISPLAY: Record<string, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

export default function SubmissionCard({ submission }: Props) {
  const [showCode, setShowCode] = useState(false);

  const statusColor = STATUS_COLORS[submission.status] || STATUS_COLORS.Pending;
  const difficultyColor = submission.problem
    ? getDifficultyColor(submission.problem.difficulty as any)
    : 'text-gray-500';

  const formattedDate = new Date(submission.submittedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {submission.problem && (
            <Link
              href={`/problems/${submission.problem.slug}`}
              className="text-xl font-semibold text-white hover:text-yellow-500 transition-colors"
            >
              {submission.problem.title}
            </Link>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-sm ${difficultyColor} font-medium`}>
              {submission.problem?.difficulty}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">{submission.problem?.category}</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">
              {LANGUAGE_DISPLAY[submission.language] || submission.language}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">{formattedDate}</span>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
          {submission.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-[#0a0a0a] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Test Cases</p>
          <p className="text-lg font-semibold">
            {submission.testCasesPassed}/{submission.totalTestCases}
          </p>
        </div>

        {submission.runtime && (
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Runtime</p>
            <p className="text-lg font-semibold">{submission.runtime}ms</p>
          </div>
        )}

        {submission.memory && (
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Memory</p>
            <p className="text-lg font-semibold">
              {(submission.memory / 1024).toFixed(1)}MB
            </p>
          </div>
        )}

        {submission.pointsEarned > 0 && (
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Points Earned</p>
            <p className="text-lg font-semibold text-yellow-500">
              +{submission.pointsEarned}
            </p>
          </div>
        )}

        {submission.solveTimeSeconds && (
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Solve Time</p>
            <p className="text-lg font-semibold">
              {formatSolveTime(submission.solveTimeSeconds)}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {submission.errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">
            {submission.errorMessage}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCode(!showCode)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {showCode ? 'Hide Code' : 'View Code'}
        </button>

        {submission.problem && (
          <Link
            href={`/problems/${submission.problem.slug}`}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors text-sm font-medium"
          >
            Solve Again
          </Link>
        )}
      </div>

      {/* Code Viewer */}
      {showCode && (
        <div className="mt-4">
          <CodeViewer code={submission.code} language={submission.language} />
        </div>
      )}
    </div>
  );
}

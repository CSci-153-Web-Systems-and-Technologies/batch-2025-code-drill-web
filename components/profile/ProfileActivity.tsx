'use client';

import { useEffect, useState } from 'react';
import { getRecentActivityAction, type RecentActivity } from '@/app/profile/actions';
import Link from 'next/link';

interface ProfileActivityProps {
  userId: string;
}

export function ProfileActivity({ userId }: ProfileActivityProps) {
  const [submissions, setSubmissions] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const data = await getRecentActivityAction(userId, 10);
      setSubmissions(data);
      setLoading(false);
    }

    fetchActivity();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'text-green-700 bg-green-100';
      case 'Wrong Answer':
        return 'text-red-700 bg-red-100';
      case 'Time Limit Exceeded':
        return 'text-orange-700 bg-orange-100';
      case 'Runtime Error':
        return 'text-red-700 bg-red-100';
      case 'Compilation Error':
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-700';
      case 'Medium':
        return 'text-yellow-700';
      case 'Hard':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <Link 
          href="/submissions"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No submissions yet</p>
          <p className="text-sm text-gray-500 mt-1">Start solving problems to see your activity here</p>
          <Link
            href="/problems"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(submission => (
            <div 
              key={submission.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  {submission.problem ? (
                    <Link 
                      href={`/problems/${submission.problem.slug}`}
                      className="text-gray-900 font-medium hover:text-blue-600 truncate"
                    >
                      {submission.problem.title}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium truncate">Problem #{submission.problem_id}</span>
                  )}
                  
                  {submission.problem && (
                    <span className={`text-xs font-medium ${getDifficultyColor(submission.problem.difficulty)}`}>
                      {submission.problem.difficulty}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                  <span>{submission.language}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(submission.created_at)}</span>
                  {submission.points_earned !== null && submission.points_earned > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-700 font-medium">+{submission.points_earned} pts</span>
                    </>
                  )}
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

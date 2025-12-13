'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProfessorStatsProps {
  userId: string;
}

interface Stats {
  courseCount: number;
  questionCount: number;
  publishedQuestions: number;
  draftQuestions: number;
  totalStudents: number;
  recentSubmissions: number;
}

export function ProfessorStats({ userId }: ProfessorStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/courses/stats');
        const data = await response.json();

        if (data.courses) {
          // Calculate stats from courses
          const courseCount = data.courses.length;
          const totalStudents = data.courses.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0);
          const totalQuestions = data.courses.reduce((sum: number, c: any) => sum + (c.question_count || 0), 0);
          const publishedQuestions = data.courses.reduce((sum: number, c: any) => sum + (c.published_questions || 0), 0);
          const draftQuestions = totalQuestions - publishedQuestions;

          // Get recent submissions count (last 7 days)
          const recentSubmissions = data.courses.reduce((sum: number, c: any) => sum + (c.recent_submissions || 0), 0);

          setStats({
            courseCount,
            questionCount: totalQuestions,
            publishedQuestions,
            draftQuestions,
            totalStudents,
            recentSubmissions,
          });
        }
      } catch (error) {
        console.error('Failed to fetch professor stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Teaching Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Link href="/professor-exams" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm text-gray-600">Courses</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.courseCount}</p>
        </Link>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-600">Questions Created</p>
          </div>
          <p className="text-3xl font-bold text-purple-700">{stats.questionCount}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">Published</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.publishedQuestions}</p>
        </div>

        <Link href="/admin/roster" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <p className="text-3xl font-bold text-orange-700">{stats.totalStudents}</p>
        </Link>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-sm text-gray-600">Draft Questions</p>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{stats.draftQuestions}</p>
        </div>

        <Link href="/admin/submissions" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-sm text-gray-600">Recent Submissions</p>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{stats.recentSubmissions}</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/professor-exams"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Manage Courses
          </Link>
          <Link
            href="/admin/submissions"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Review Submissions
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

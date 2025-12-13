'use client';

import { User } from '@/types';
import Link from 'next/link';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isProfessor = user.role === 'professor' || user.role === 'admin';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      {/* Profile Info */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
          {/* Avatar */}
          <div className="relative -mt-16 sm:-mt-16">
            <div className="w-32 h-32 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {initials}
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex-1 mt-4 sm:mt-0 sm:pb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  {isProfessor && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {user.role === 'admin' ? 'Admin' : 'Professor'}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{user.email}</p>
              </div>
              
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors self-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            </div>

            {/* Quick Stats - Only for Students */}
            {!isProfessor && (
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{user.totalPoints}</p>
                    <p className="text-xs text-gray-600">Total Points</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{user.problemsSolved}</p>
                    <p className="text-xs text-gray-600">Problems Solved</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{user.currentStreak}</p>
                    <p className="text-xs text-gray-600">Day Streak</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{user.avgScore}%</p>
                    <p className="text-xs text-gray-600">Avg Score</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { updateUserProfileAction } from '@/app/profile/actions';
import { updateLeaderboardVisibility } from '@/app/leaderboard/actions';

interface EditProfileFormProps {
  user: User;
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [leaderboardVisible, setLeaderboardVisible] = useState(user.leaderboard_visible ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Update profile
    const result = await updateUserProfileAction(user.id, { name });

    if (!result.success) {
      setError(result.error || 'Failed to update profile');
      setLoading(false);
      return;
    }

    // Update leaderboard visibility
    const visibilityResult = await updateLeaderboardVisibility(leaderboardVisible);

    if (!visibilityResult.success) {
      setError(visibilityResult.error || 'Failed to update privacy settings');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/profile');
      router.refresh();
    }, 1500);

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      {/* Name Field */}
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Email Field (Read-only) */}
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={user.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      {/* Leaderboard Privacy Setting - Only for Students */}
      {user.role === 'student' && (
        <div className="mb-6">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={leaderboardVisible}
              onChange={(e) => setLeaderboardVisible(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-gray-700">
                🏆 Show me on the leaderboard
              </span>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, you'll appear on public leaderboards. You can still see your own rank and stats even if disabled.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Profile updated successfully! Redirecting...</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

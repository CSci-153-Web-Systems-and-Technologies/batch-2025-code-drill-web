'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated and needs profile setup
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        // Wait for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user already has a name in database
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (!fetchError && userData && userData.name && userData.name.trim() !== '') {
          // User already has a name, redirect to dashboard
          router.push('/');
          return;
        }

        setCheckingAuth(false);
      } catch (err) {
        console.error('Error checking user:', err);
        setCheckingAuth(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate name length
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters long');
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // First try to update the user name
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id);

      // If update fails (record doesn't exist), create the record
      if (updateError) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email,
              name: name.trim(),
              total_points: 0,
              problems_solved: 0,
              current_streak: 0,
              avg_score: 0,
            },
          ]);

        if (insertError) throw insertError;
      }

      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-900 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
              CD
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Complete your profile</h2>
          <p className="mt-2 text-gray-600">Tell us your name to get started</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Profile Setup Form */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="John Doe"
                minLength={3}
              />
              <p className="mt-2 text-xs text-gray-500">
                This name will be displayed on your profile and leaderboard
              </p>
            </div>

            <div className="space-y-3">
              <Button type="submit" disabled={loading} className="w-full py-3">
                {loading ? 'Saving...' : 'Continue'}
              </Button>
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

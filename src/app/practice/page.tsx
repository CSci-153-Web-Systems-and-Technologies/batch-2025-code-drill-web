'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createPracticeSession, getActiveSession } from './actions';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';
import type { PracticeSessionConfig } from '@/types/practice';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const TIME_LIMIT_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
];

export default function PracticePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(false);

  // Route protection: only students can access practice
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (userData?.role !== 'student') {
          router.push('/');
          return;
        }
        
        setUser(userData as any);
      } else {
        router.push('/login');
      }
    };

    checkUserRole();
  }, [supabase, router]);

  const [config, setConfig] = useState<PracticeSessionConfig>({
    timeLimit: 30,
  });

  const handleStartSession = async () => {
    setLoading(true);
    setError('');

    // Check if there's an active session
    const { data: activeSession } = await getActiveSession();
    if (activeSession) {
      router.push(`/practice/${activeSession.id}`);
      return;
    }

    const result = await createPracticeSession(config);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      router.push(`/practice/${result.data.id}`);
    }
  };

  const handleResumeSession = async () => {
    setCheckingSession(true);
    const { data: activeSession } = await getActiveSession();
    setCheckingSession(false);

    if (activeSession) {
      router.push(`/practice/${activeSession.id}`);
    }
  };

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Practice Mode</h1>
          <p className="text-gray-600">
            Start a timed practice session to sharpen your skills. Problems won't affect your
            rating or streaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Timed Sessions</h3>
            <p className="text-sm text-gray-600">
              Practice under time pressure to improve your problem-solving speed
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Risk-Free</h3>
            <p className="text-sm text-gray-600">
              Practice sessions don't affect your ranking or daily streaks
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-gray-600">
              Review your practice history and see your improvement over time
            </p>
          </Card>
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Configure Your Session</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={config.difficulty || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard' | undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {TIME_LIMIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setConfig({ ...config, timeLimit: option.value })}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      config.timeLimit === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleStartSession}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Starting...' : 'Start Practice Session'}
              </Button>
              <Button
                onClick={handleResumeSession}
                disabled={checkingSession}
                variant="secondary"
              >
                {checkingSession ? 'Checking...' : 'Resume Active'}
              </Button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/practice/history')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Practice History →
              </button>
            </div>
          </div>
        </Card>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Practice Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Start with shorter sessions (15-30 mins) to build consistency</li>
            <li>• Focus on one difficulty level at a time to master concepts</li>
            <li>• Review your practice history to identify patterns and weak areas</li>
            <li>• Use practice mode to experiment with new approaches risk-free</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}

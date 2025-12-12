'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getSessionDetails, updateSessionStatus } from '../actions';
import type { ActiveSessionData } from '@/types/practice';

interface PracticeSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function PracticeSessionPage({ params }: PracticeSessionPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const startTime = new Date(session.started_at).getTime();
    const endTime = startTime + session.time_limit * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleEndSession('completed');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const loadSession = async () => {
    setLoading(true);
    const result = await getSessionDetails(params.sessionId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setSession(result.data);
      
      // Calculate initial time remaining
      if (result.data.status === 'active') {
        const startTime = new Date(result.data.started_at).getTime();
        const endTime = startTime + result.data.time_limit * 60 * 1000;
        const remaining = Math.max(0, endTime - Date.now());
        setTimeRemaining(remaining);
      }
    }

    setLoading(false);
  };

  const handleEndSession = async (status: 'completed' | 'abandoned') => {
    const result = await updateSessionStatus(params.sessionId, status);
    if (!result.error) {
      router.push('/practice/history');
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This practice session does not exist.'}</p>
          <Button onClick={() => router.push('/practice')}>Back to Practice</Button>
        </div>
      </Container>
    );
  }

  if (session.status !== 'active') {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Session Ended</h1>
          <p className="text-gray-600 mb-6">
            This practice session has been {session.status}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/practice')}>Start New Session</Button>
            <Button variant="secondary" onClick={() => router.push('/practice/history')}>
              View History
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const solvedCount = session.session_problems.filter((sp) => sp.status === 'solved').length;
  const attemptedCount = session.session_problems.filter(
    (sp) => sp.status === 'attempted' || sp.status === 'solved'
  ).length;
  const totalCount = session.session_problems.length;

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-8">
        {/* Header with Timer */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Practice Session</h1>
            <p className="text-gray-600">
              {session.difficulty ? (
                <span className="capitalize">{session.difficulty} • </span>
              ) : null}
              {session.time_limit} minutes
            </p>
          </div>

          <Card className="px-6 py-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
              <div
                className={`text-3xl font-bold ${
                  timeRemaining < 5 * 60 * 1000 ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Bar */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{solvedCount}</div>
              <div className="text-sm text-gray-600">Solved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{attemptedCount}</div>
              <div className="text-sm text-gray-600">Attempted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{totalCount}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => handleEndSession('completed')}
              variant="primary"
              className="flex-1"
            >
              Complete Session
            </Button>
            <Button
              onClick={() => handleEndSession('abandoned')}
              variant="secondary"
            >
              Abandon
            </Button>
          </div>
        </Card>

        {/* Problems List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Problems</h2>
          {session.session_problems.map((sp, index) => (
            <Card
              key={sp.id}
              className={`p-6 ${
                sp.status === 'solved'
                  ? 'border-l-4 border-green-500'
                  : sp.status === 'attempted'
                  ? 'border-l-4 border-orange-500'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
                  <div className="flex-1">
                    <Link
                      href={`/problems/${sp.problem.slug}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {sp.problem.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-sm px-2 py-0.5 rounded ${
                          sp.problem.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : sp.problem.difficulty === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {sp.problem.difficulty}
                      </span>
                      {sp.status !== 'pending' && (
                        <span
                          className={`text-sm px-2 py-0.5 rounded ${
                            sp.status === 'solved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {sp.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Link href={`/problems/${sp.problem.slug}`}>
                    <Button>Solve</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {timeRemaining < 5 * 60 * 1000 && timeRemaining > 0 && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <div className="font-semibold">⏰ Less than 5 minutes remaining!</div>
            <div className="text-sm opacity-90">Finish up your current problem</div>
          </div>
        )}
      </div>
    </Container>
  );
}

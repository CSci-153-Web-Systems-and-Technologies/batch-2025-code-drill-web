'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getPracticeHistory } from '../actions';
import type { PracticeSession } from '@/types/practice';

export default function PracticeHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const result = await getPracticeHistory();
    if (result.data) {
      setSessions(result.data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'N/A';

    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);

    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const calculateAccuracy = (session: PracticeSession) => {
    if (session.problems_attempted === 0) return 0;
    return Math.round((session.problems_solved / session.problems_attempted) * 100);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-5xl mx-auto py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Practice History</h1>
            <p className="text-gray-600">Review your past practice sessions</p>
          </div>
          <Button onClick={() => router.push('/practice')}>New Session</Button>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">No Practice Sessions Yet</h2>
            <p className="text-gray-600 mb-6">
              Start your first practice session to track your progress
            </p>
            <Button onClick={() => router.push('/practice')}>Start Practicing</Button>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {sessions.reduce((acc, s) => acc + s.problems_solved, 0)}
                </div>
                <div className="text-sm text-gray-600">Problems Solved</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {sessions.reduce((acc, s) => acc + s.problems_attempted, 0)}
                </div>
                <div className="text-sm text-gray-600">Problems Attempted</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {sessions.filter((s) => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </Card>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {session.difficulty ? (
                            <span className="capitalize">{session.difficulty} • </span>
                          ) : (
                            'Mixed • '
                          )}
                          {session.time_limit} minutes
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{formatDate(session.started_at)}</span>
                        <span>Duration: {formatDuration(session.started_at, session.completed_at)}</span>
                        {session.problems_attempted > 0 && (
                          <span>Accuracy: {calculateAccuracy(session)}%</span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700">
                            {session.problems_solved}
                          </div>
                          <div className="text-xs text-gray-500">solved</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700">
                            {session.problems_attempted}
                          </div>
                          <div className="text-xs text-gray-500">attempted</div>
                        </div>
                        {session.total_score > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">
                              {session.total_score}
                            </div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {session.problems_attempted > 0 && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${calculateAccuracy(session)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/practice/${session.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Container>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getChallengeById, joinChallenge, getChallengeLeaderboard } from '../actions';
import type { ChallengeWithStats, ChallengeLeaderboardEntry } from '@/types/challenge';

interface ChallengeDetailPageProps {
  params: {
    id: string;
  };
}

export default function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeWithStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadChallenge();
    loadLeaderboard();
  }, [params.id]);

  const loadChallenge = async () => {
    const result = await getChallengeById(params.id);
    if (result.data) {
      setChallenge(result.data);
    }
    setLoading(false);
  };

  const loadLeaderboard = async () => {
    const result = await getChallengeLeaderboard(params.id);
    if (result.data) {
      setLeaderboard(result.data);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    const result = await joinChallenge(params.id);
    if (!result.error) {
      await loadChallenge();
    }
    setJoining(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Challenge ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days, ${hours} hours remaining`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes remaining`;
    return `${minutes} minutes remaining`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading challenge...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 mb-6">This challenge does not exist.</p>
          <Button onClick={() => router.push('/challenges')}>Back to Challenges</Button>
        </div>
      </Container>
    );
  }

  const isActive = challenge.status === 'active';
  const hasJoined = !!challenge.user_participant;
  const hasCompleted = challenge.user_participant?.completed || false;

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/challenges')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Challenges
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Header */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{challenge.title}</h1>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        challenge.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : challenge.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {challenge.status}
                    </span>
                  </div>
                  {isActive && (
                    <div className="text-orange-600 font-medium">
                      ⏰ {getTimeRemaining(challenge.end_date)}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-6">{challenge.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {challenge.participant_count}
                  </div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {challenge.completion_count}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{challenge.max_points}</div>
                  <div className="text-sm text-gray-600">Max Points</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div
                    className={`text-2xl font-bold ${
                      challenge.difficulty === 'easy'
                        ? 'text-green-600'
                        : challenge.difficulty === 'medium'
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  >
                    {challenge.difficulty.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>Start:</strong> {formatDate(challenge.start_date)}
                  </div>
                  <div>
                    <strong>End:</strong> {formatDate(challenge.end_date)}
                  </div>
                </div>
              </div>

              {hasJoined && hasCompleted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎉</div>
                    <div>
                      <div className="font-semibold text-green-900">Challenge Completed!</div>
                      <div className="text-sm text-green-700">
                        Score: {challenge.user_participant?.score} points
                        {challenge.user_participant?.rank && (
                          <span> • Rank: #{challenge.user_participant.rank}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Problem Details */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Problem</h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Link
                    href={`/problems/${challenge.problem.slug}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {challenge.problem.title}
                  </Link>
                  <div className="mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        challenge.problem.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : challenge.problem.difficulty === 'medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {challenge.problem.difficulty}
                    </span>
                  </div>
                </div>
                <Link href={`/problems/${challenge.problem.slug}`}>
                  <Button>{hasJoined ? 'Solve Problem' : 'View Problem'}</Button>
                </Link>
              </div>
            </Card>

            {/* Leaderboard */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>No completions yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.is_current_user ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-lg font-bold ${
                            entry.rank === 1
                              ? 'text-yellow-600'
                              : entry.rank === 2
                              ? 'text-gray-400'
                              : entry.rank === 3
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {entry.user_name}
                            {entry.is_current_user && (
                              <span className="ml-2 text-xs text-blue-600">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTimeAgo(entry.completed_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-purple-600">{entry.score} pts</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="p-6">
              {!hasJoined ? (
                <>
                  <h3 className="font-semibold text-lg mb-4">Join Challenge</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Join this challenge to compete on the leaderboard and earn points
                  </p>
                  <Button
                    onClick={handleJoin}
                    disabled={joining || !isActive}
                    className="w-full"
                  >
                    {joining ? 'Joining...' : isActive ? 'Join Challenge' : 'Challenge Ended'}
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-lg mb-4">Your Progress</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={hasCompleted ? 'text-green-600 font-medium' : 'text-orange-600'}>
                        {hasCompleted ? 'Completed ✓' : 'In Progress'}
                      </span>
                    </div>
                    {hasCompleted && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-semibold">{challenge.user_participant?.score} pts</span>
                        </div>
                        {challenge.user_participant?.rank && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rank:</span>
                            <span className="font-semibold">#{challenge.user_participant.rank}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Link href={`/problems/${challenge.problem.slug}`}>
                    <Button className="w-full">
                      {hasCompleted ? 'Improve Score' : 'Continue Solving'}
                    </Button>
                  </Link>
                </>
              )}
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-lg mb-3">💡 Challenge Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Points are awarded for correct solutions</li>
                <li>• Faster solutions may earn bonus points</li>
                <li>• You can submit multiple times to improve</li>
                <li>• Only your best score counts</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}

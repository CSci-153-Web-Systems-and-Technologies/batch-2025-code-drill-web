'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getActiveChallenges } from '@/app/challenges/actions';
import type { ChallengeWithStats } from '@/types/challenge';

export default function ActiveChallenges() {
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const result = await getActiveChallenges();
    if (result.data) {
      setChallenges(result.data);
    }
    setLoading(false);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🏆 Active Challenges</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🏆 Active Challenges</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600 mb-4">No active challenges at the moment</p>
          <Link href="/challenges">
            <Button variant="secondary" className="text-sm">
              View All Challenges
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🏆 Active Challenges</h2>
        <Link href="/challenges" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  {challenge.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      challenge.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : challenge.difficulty === 'medium'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {challenge.difficulty}
                  </span>
                  {challenge.user_participant?.completed && (
                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>{challenge.participant_count} participants</span>
                <span className="text-orange-600 font-medium">
                  {getTimeRemaining(challenge.end_date)}
                </span>
              </div>
            </div>

            {!challenge.user_participant && (
              <Link href={`/challenges/${challenge.id}`}>
                <Button variant="secondary" className="w-full mt-3 text-sm">
                  Join Challenge
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

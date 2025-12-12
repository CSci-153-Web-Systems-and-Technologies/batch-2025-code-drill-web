'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getChallenges } from './actions';
import { createClient } from '@/lib/supabase/client';
import type { ChallengeWithStats } from '@/types/challenge';

type TabType = 'all' | 'active' | 'upcoming' | 'completed';

export default function ChallengesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [challenges, setChallenges] = useState<ChallengeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  useEffect(() => {
    // Route protection: only students can access challenges
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
      } else {
        router.push('/login');
        return;
      }

      loadChallenges();
    };

    checkUserRole();
  }, [activeTab, supabase, router]);

  const loadChallenges = async () => {
    setLoading(true);
    const status = activeTab === 'all' ? undefined : activeTab;
    const result = await getChallenges(status);
    if (result.data) {
      setChallenges(result.data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const tabs = [
    { id: 'active' as const, label: 'Active', icon: '🔥' },
    { id: 'upcoming' as const, label: 'Upcoming', icon: '📅' },
    { id: 'completed' as const, label: 'Completed', icon: '✅' },
    { id: 'all' as const, label: 'All', icon: '📋' },
  ];

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Weekly Challenges</h1>
          <p className="text-gray-600">
            Compete with the community in time-limited coding challenges
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏆</div>
            <div>
              <h3 className="font-semibold text-lg mb-2">How Challenges Work</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Join active challenges and solve the featured problem</li>
                <li>• Earn points based on your solution quality and speed</li>
                <li>• Climb the leaderboard to compete with other developers</li>
                <li>• Challenges run for one week with new ones starting every Monday</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading challenges...</p>
            </div>
          </div>
        ) : challenges.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold mb-2">No Challenges Yet</h2>
            <p className="text-gray-600 mb-6">
              {activeTab === 'active'
                ? 'No active challenges at the moment. Check back soon!'
                : activeTab === 'upcoming'
                ? 'No upcoming challenges scheduled yet.'
                : 'No completed challenges to show.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{challenge.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          challenge.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : challenge.difficulty === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {challenge.difficulty}
                      </span>
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

                    <p className="text-gray-600 mb-4">{challenge.description}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>{challenge.participant_count} participants</span>
                      </div>
                      {challenge.completion_count > 0 && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
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
                          <span>{challenge.completion_count} completed</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
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
                        <span>
                          {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                        </span>
                      </div>
                    </div>

                    {challenge.status === 'active' && (
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-orange-600">
                          ⏰ {getTimeRemaining(challenge.end_date)}
                        </div>
                        {challenge.user_participant && (
                          <div className="text-sm">
                            {challenge.user_participant.completed ? (
                              <span className="text-green-600 font-medium">
                                ✓ Completed • Score: {challenge.user_participant.score}
                              </span>
                            ) : (
                              <span className="text-blue-600 font-medium">Joined</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <Link href={`/challenges/${challenge.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

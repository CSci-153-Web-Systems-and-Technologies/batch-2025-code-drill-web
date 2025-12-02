import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Container from '@/components/shared/Container';
import WeeklyGoal from '@/components/shared/WeeklyGoal';
import SkillProgress from '@/components/shared/SkillProgress';
import RankCard from '@/components/shared/RankCard';
import Challenges from '@/components/shared/Challenges';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  const skills = [
    { name: 'Arrays & Strings', current: 17, total: 20 },
    { name: 'Linked Lists', current: 10, total: 15 },
    { name: 'Trees & Graphs', current: 11, total: 25 },
    { name: 'Dynamic Programming', current: 6, total: 20 },
  ];

  const challenges = [
    {
      id: '1',
      title: 'Weekly Algorithms Challenge',
      description: 'Dynamic Programming Focus',
      participants: 234,
      points: 100,
      daysLeft: 2,
    },
    {
      id: '2',
      title: 'Data Structures Sprint',
      description: 'Trees and Graphs',
      participants: 156,
      points: 75,
      daysLeft: 5,
    },
  ];

  return (
    <Container className="py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            {user.problemsSolved === 0 
              ? "Start your coding journey today!" 
              : "Ready to continue your coding journey?"}
          </p>
        </div>
        <Button size="lg">
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Start Practice Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          }
          value={user.totalPoints.toString()}
          label="Total Points"
          color="bg-yellow-50"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          value={user.problemsSolved.toString()}
          label="Problems Solved"
          color="bg-green-50"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          value={user.currentStreak === 0 ? "0 days" : `${user.currentStreak} days`}
          label="Current Streak"
          color="bg-orange-50"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          value={`${user.avgScore}%`}
          label="Avg Score"
          color="bg-purple-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Weekly Goal & Skill Progress */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyGoal current={7} goal={10} />
          <SkillProgress skills={skills} />
        </div>

        {/* Right Column - Rank & Challenges */}
        <div className="space-y-6">
          <RankCard rank={12} />
          <Challenges challenges={challenges} />
        </div>
      </div>
    </Container>
  );
}

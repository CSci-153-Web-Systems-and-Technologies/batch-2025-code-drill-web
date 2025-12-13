import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Container from '@/components/shared/Container';
import WeeklyGoal from '@/components/shared/WeeklyGoal';
import SkillProgress from '@/components/shared/SkillProgress';
import RankCard from '@/components/shared/RankCard';
import { StreakWarning } from '@/components/streaks/StreakWarning';
import { StreakStats } from '@/components/streaks/StreakStats';
import { StreakCalendar } from '@/components/streaks/StreakCalendar';
import ActiveChallenges from '@/components/challenges/ActiveChallenges';
import { getCurrentUserWithRole } from '@/lib/auth-roles';
import { getProfessorDashboardStats } from '@/lib/professor-dashboard';
import { getWeeklyProblemsSolved } from '@/lib/dashboard-stats';
import { DashboardQuickActions } from '@/components/admin/DashboardQuickActions';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect('/login');
  }

  // Student Dashboard
  if (user.role === 'student') {
    // Get weekly problems solved
    const weeklyProblemsSolved = await getWeeklyProblemsSolved(user.id);

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
          <Button size="lg" className="transition-all duration-300 hover:scale-105 hover:shadow-lg touch-manipulation min-h-[44px]">
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Start Practice Session
          </Button>
        </div>

        {/* Streak Warning */}
        <StreakWarning />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            }
            value={user.totalPoints}
            label="Total Points"
            color="bg-yellow-50"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={user.problemsSolved}
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
            pulse={user.currentStreak > 0}
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
            <WeeklyGoal current={weeklyProblemsSolved} goal={10} />
            <SkillProgress />
            <StreakCalendar />
          </div>

          {/* Right Column - Rank & Challenges */}
          <div className="space-y-6">
            <RankCard />
            <StreakStats />
            <ActiveChallenges />
          </div>
        </div>
      </Container>
    );
  }

  // Professor/Admin Dashboard
  const stats = await getProfessorDashboardStats();

  return (
    <Container className="py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          {user.role === 'admin' 
            ? "Manage the platform, courses, and user activities" 
            : "Create and manage exam content for your courses"}
        </p>
      </div>

      {/* Professor/Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          value={stats.courseCount.toString()}
          label="Active Courses"
          color="bg-blue-50"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          value={stats.templateCount.toString()}
          label="Exam Templates"
          color="bg-purple-50"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          value={stats.submissionCount.toString()}
          label="Student Submissions"
          color="bg-green-50"
        />
      </div>

      <DashboardQuickActions />

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <a
          href="/professor-exams/submissions"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Submissions</h3>
          <p className="text-sm text-gray-600">Review & grade</p>
        </a>
        <a
          href="/admin/analytics"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 text-purple-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
          <p className="text-sm text-gray-600">Student performance</p>
        </a>
        <a
          href="/admin/roster"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Roster</h3>
          <p className="text-sm text-gray-600">Class management</p>
        </a>
        <a
          href="/admin/announcements"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Announcements</h3>
          <p className="text-sm text-gray-600">Post updates</p>
        </a>
        <a
          href="/admin/reports"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 text-indigo-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Reports</h3>
          <p className="text-sm text-gray-600">Item analysis</p>
        </a>
      </div>
    </Container>
  );
}

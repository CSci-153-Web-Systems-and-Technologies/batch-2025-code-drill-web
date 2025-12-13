'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeaderboardEntry, UserRank } from './actions';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import BadgeDisplay from '@/components/leaderboard/BadgeDisplay';
import RankHistoryChart from '@/components/leaderboard/RankHistoryChart';
import { exportLeaderboardCSV } from './actions';

interface LeaderboardClientProps {
  initialLeaderboard: LeaderboardEntry[];
  initialUserRank: UserRank | null;
  courses: Array<{ id: string; name: string }>;
  isProfessor: boolean;
  initialTab: string;
  initialCourseId?: string;
}

export default function LeaderboardClient({
  initialLeaderboard,
  initialUserRank,
  courses,
  isProfessor,
  initialTab,
  initialCourseId,
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(initialTab);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [isExporting, setIsExporting] = useState(false);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    if (newTab === 'global') {
      params.delete('course');
      setSelectedCourse(undefined);
    }
    router.push(`?${params.toString()}`);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const params = new URLSearchParams(searchParams.toString());
    if (courseId) {
      params.set('course', courseId);
      params.set('tab', 'courses');
      setTab('courses');
    } else {
      params.delete('course');
    }
    router.push(`?${params.toString()}`);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    const result = await exportLeaderboardCSV(selectedCourse);
    setIsExporting(false);

    if (result.success && result.csv) {
      // Download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leaderboard-${selectedCourse || 'global'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      alert(result.error || 'Failed to export CSV');
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* User Rank Banner */}
      {initialUserRank && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {getMedalEmoji(initialUserRank.rank) || '🎯'}
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  Rank #{initialUserRank.rank}
                </h3>
                <p className="text-muted-foreground">
                  out of {initialUserRank.total_users} students
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {initialUserRank.total_points}
                </div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {initialUserRank.problems_solved}
                </div>
                <div className="text-sm text-muted-foreground">Solved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {initialUserRank.current_streak}
                </div>
                <div className="text-sm text-muted-foreground">Streak</div>
              </div>
            </div>
            {initialUserRank.badges.length > 0 && (
              <div className="flex gap-2">
                {initialUserRank.badges.slice(0, 3).map((badge, idx) => (
                  <BadgeDisplay key={idx} badge={badge} size="lg" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rank History Chart */}
      {initialUserRank && (
        <RankHistoryChart courseId={selectedCourse} />
      )}

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('global')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'global'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => handleTabChange('courses')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'courses'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            📚 Courses
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'categories'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            🏷️ Categories
          </button>
        </div>

        <div className="flex gap-3">
          {/* Course Filter */}
          {(tab === 'courses' || selectedCourse) && courses.length > 0 && (
            <select
              value={selectedCourse || ''}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-background"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          )}

          {/* Export CSV (Professors only) */}
          {isProfessor && (
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isExporting ? '⏳ Exporting...' : '📥 Export CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      {tab === 'categories' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs'].map(
            (category) => (
              <button
                key={category}
                onClick={() =>
                  router.push(`/leaderboard/category/${category.toLowerCase().replace(' ', '-')}`)
                }
                className="p-6 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors group"
              >
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {category}
                </h3>
                <p className="text-muted-foreground">
                  View rankings for {category.toLowerCase()} problems
                </p>
              </button>
            )
          )}
        </div>
      ) : (
        <LeaderboardTable
          entries={initialLeaderboard}
          currentUserId={initialUserRank ? undefined : undefined}
        />
      )}
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserSubmissions, getSubmissionStats, getLanguagesUsed } from '@/lib/submissions';
import SubmissionsClient from './SubmissionsClient';

export const metadata = {
  title: 'Submission History | CodeDrill',
  description: 'View your code submission history and performance metrics',
};

export default async function SubmissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch initial data
  const [{ submissions, hasMore }, stats, languages] = await Promise.all([
    getUserSubmissions(user.id, undefined, 1, 20),
    getSubmissionStats(user.id),
    getLanguagesUsed(user.id),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submission History</h1>
          <p className="text-gray-400">
            View and analyze your code submissions and performance
          </p>
        </div>

        <SubmissionsClient
          initialSubmissions={submissions}
          initialHasMore={hasMore}
          stats={stats}
          availableLanguages={languages}
          userId={user.id}
        />
      </div>
    </div>
  );
}

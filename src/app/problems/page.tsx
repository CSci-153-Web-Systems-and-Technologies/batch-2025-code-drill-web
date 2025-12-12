import { getProblems, getCategories, getProblemStats } from '@/lib/problems';
import { getCurrentUserWithRole } from '@/lib/auth-roles';
import { redirect } from 'next/navigation';
import ProblemsClient from './ProblemsClient';

export default async function ProblemsPage() {
  // Route protection: only students can access problems
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== 'student') {
    redirect('/');
  }

  const [problems, categories, stats] = await Promise.all([
    getProblems({ limit: 20 }),
    getCategories(),
    getProblemStats(),
  ]);

  return (
    <ProblemsClient
      initialProblems={problems}
      categories={categories}
      stats={stats}
    />
  );
}

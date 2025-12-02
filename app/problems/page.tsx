import { getProblems, getCategories, getProblemStats } from '@/lib/problems';
import ProblemsClient from './ProblemsClient';

export default async function ProblemsPage() {
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

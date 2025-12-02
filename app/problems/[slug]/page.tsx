import { notFound } from 'next/navigation';
import { getProblemBySlug } from '@/lib/problems';
import ProblemDetailClient from './ProblemDetailClient';

export default async function ProblemDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const problem = await getProblemBySlug(params.slug);

  if (!problem) {
    notFound();
  }

  return <ProblemDetailClient problem={problem} />;
}

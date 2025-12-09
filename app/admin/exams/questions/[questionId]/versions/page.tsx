import { redirect, notFound } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getQuestionVersionHistory, compareQuestionVersions } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface VersionsPageProps { params: { questionId: string } }

export default async function VersionsPage({ params }: VersionsPageProps) {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const versions = await getQuestionVersionHistory(params.questionId);
  if (!versions || versions.length < 2) notFound();

  const latest = versions[0].version_number;
  const previous = versions[1].version_number;
  const diff = await compareQuestionVersions(params.questionId, previous, latest);

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Version Comparison</h1>
        <Link href={`/admin/exams/questions/${params.questionId}/edit`}>
          <Button variant="secondary">Back to Editor</Button>
        </Link>
      </div>

      {!diff.success ? (
        <Card><p className="text-red-400">{diff.error}</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-2">Previous (v{previous})</h2>
            <div className="space-y-3">
              {Object.entries(diff.version1).map(([key, value]) => (
                key !== 'version_number' && (
                  <div key={key}>
                    <p className="text-sm text-gray-400">{key}</p>
                    <pre className="bg-gray-900 p-3 rounded text-gray-300 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                  </div>
                )
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-white mb-2">Latest (v{latest})</h2>
            <div className="space-y-3">
              {Object.entries(diff.version2).map(([key, value]) => (
                key !== 'version_number' && (
                  <div key={key}>
                    <p className="text-sm text-gray-400">{key}</p>
                    <pre className="bg-gray-900 p-3 rounded text-gray-300 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                  </div>
                )
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-2">Differences</h2>
        {diff.success && diff.differences.length === 0 ? (
          <p className="text-gray-400">No differences detected.</p>
        ) : (
          <div className="space-y-2">
            {diff.success && diff.differences.map((d:any) => (
              <div key={d.field} className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded">
                <p className="text-yellow-300 font-semibold">{d.field}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-sm text-gray-400">Old</p>
                    <pre className="bg-gray-900 p-3 rounded text-gray-300 whitespace-pre-wrap">{JSON.stringify(d.old_value, null, 2)}</pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">New</p>
                    <pre className="bg-gray-900 p-3 rounded text-gray-300 whitespace-pre-wrap">{JSON.stringify(d.new_value, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}

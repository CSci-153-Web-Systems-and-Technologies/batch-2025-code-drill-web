import { redirect, notFound } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getQuestionWithAnswer, getQuestionVersionHistory, publishQuestion, unpublishQuestion, rollbackQuestionToVersion, generatePreviewToken } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface EditPageProps {
  params: { questionId: string };
}

export default async function EditQuestionPage({ params }: EditPageProps) {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const question = await getQuestionWithAnswer(params.questionId);
  if (!question) notFound();

  const versions = await getQuestionVersionHistory(params.questionId);

  async function handlePublish() {
    'use server';
    await publishQuestion(params.questionId);
    redirect(`/admin/exams/questions/${params.questionId}/edit`);
  }

  async function handleUnpublish() {
    'use server';
    await unpublishQuestion(params.questionId);
    redirect(`/admin/exams/questions/${params.questionId}/edit`);
  }

  async function handleRollback(formData: FormData) {
    'use server';
    const versionNumber = Number(formData.get('versionNumber'));
    await rollbackQuestionToVersion(params.questionId, versionNumber);
    redirect(`/admin/exams/questions/${params.questionId}/edit`);
  }

  async function handlePreviewToken() {
    'use server';
    await generatePreviewToken(params.questionId, 7, 10, 'Editor generated');
    redirect(`/admin/exams/questions/${params.questionId}/edit`);
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Edit Question</h1>
        <div className="flex gap-2">
          <Link href={`/professor-exams/preview/${params.questionId}`}>
            <Button variant="secondary">Preview</Button>
          </Link>
          {question.is_published ? (
            <form action={handleUnpublish}><Button variant="secondary">Unpublish</Button></form>
          ) : (
            <form action={handlePublish}><Button className="bg-green-600 hover:bg-green-700">Publish</Button></form>
          )}
          <form action={handlePreviewToken}><Button>Share Preview</Button></form>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Type</p>
            <p className="text-white capitalize">{question.question_type?.replace('_',' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Difficulty</p>
            <p className="text-white">{question.difficulty || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Published</p>
            <p className="text-white">{question.is_published ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Content</h2>
        <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
        <div className="text-gray-300 whitespace-pre-wrap mb-4">{question.question_text}</div>
        {question.code_snippet && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Code Snippet</p>
            <pre className="bg-gray-900 p-3 rounded"><code>{question.code_snippet}</code></pre>
          </div>
        )}
        {question.expected_output && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Expected Output</p>
            <pre className="bg-gray-900 p-3 rounded"><code>{question.expected_output}</code></pre>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Version History</h2>
          <Link href={`/admin/exams/questions/${params.questionId}/versions`}>
            <Button variant="secondary">Compare Versions</Button>
          </Link>
        </div>
        {versions.length === 0 ? (
          <p className="text-gray-400">No versions yet.</p>
        ) : (
          <div className="space-y-3">
            {versions.map((v:any) => (
              <div key={v.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded">
                <div>
                  <p className="text-white font-semibold">Version {v.version_number}</p>
                  <p className="text-sm text-gray-400">{new Date(v.changed_at).toLocaleString()} • {v.user_email || 'unknown'}</p>
                  {v.change_description && (
                    <p className="text-sm text-gray-300">{v.change_description}</p>
                  )}
                </div>
                <form action={handleRollback}>
                  <input type="hidden" name="versionNumber" value={v.version_number} />
                  <Button variant="secondary">Rollback</Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}

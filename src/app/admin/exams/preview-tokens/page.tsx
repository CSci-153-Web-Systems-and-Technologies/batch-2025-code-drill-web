import { redirect } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getUserPreviewTokens } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default async function PreviewTokensPage() {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const tokens = await getUserPreviewTokens();

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Preview Tokens</h1>
        <p className="text-gray-400">
          Manage preview links for sharing unpublished questions
        </p>
      </div>

      {tokens.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <p className="text-gray-400 mb-4">No preview tokens created yet</p>
            <p className="text-sm text-gray-500">
              Create tokens from the question editor to share previews
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token: any) => {
            const isExpired = new Date(token.expires_at) < new Date();
            const viewsLeft = token.allowed_views - token.view_count;
            const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/professor-exams/preview/share/${token.token}`;

            return (
              <Card key={token.id} className={isExpired ? 'opacity-50' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">
                        {token.exam_questions?.title || 'Unknown Question'}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize">
                        {token.exam_questions?.question_type?.replace('_', ' ')}
                      </span>
                      {isExpired && (
                        <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                          Expired
                        </span>
                      )}
                      {!token.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-600/20 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-400 mb-3">
                      <p>
                        Created: {new Date(token.created_at).toLocaleDateString()}
                      </p>
                      <p>
                        Expires: {new Date(token.expires_at).toLocaleDateString()}
                      </p>
                      <p>
                        Views: {token.view_count} / {token.allowed_views} used
                        {viewsLeft > 0 && ` (${viewsLeft} remaining)`}
                      </p>
                      {token.notes && (
                        <p className="text-gray-500 italic">{token.notes}</p>
                      )}
                    </div>

                    {!isExpired && token.is_active && (
                      <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded">
                        <input
                          type="text"
                          value={previewUrl}
                          readOnly
                          className="flex-1 bg-transparent text-gray-300 text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(previewUrl)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!isExpired && token.is_active && (
                      <Link href={previewUrl} target="_blank">
                        <Button variant="secondary" className="text-sm">
                          Open
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/exams/questions/${token.question_id}/edit`}>
                      <Button variant="secondary" className="text-sm">
                        Edit Question
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              How Preview Tokens Work
            </h3>
            <p className="text-sm text-gray-400">
              Tokens expire after 7 days or 10 views. Generate new tokens from question editors.
            </p>
          </div>
          <Link href="/admin/exams">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </Container>
  );
}

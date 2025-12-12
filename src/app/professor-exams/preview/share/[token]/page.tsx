import { notFound } from 'next/navigation';
import { getQuestionByPreviewToken } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';

interface SharedPreviewPageProps {
  params: {
    token: string;
  };
}

export default async function SharedPreviewPage({
  params,
}: SharedPreviewPageProps) {
  // Validate token and get question (this also increments view count)
  const result = await getQuestionByPreviewToken(params.token);

  if (!result.success || !result.question) {
    notFound();
  }

  const { question, views_remaining } = result;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <Container>
        {/* Shared Preview Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 text-white p-2 rounded-lg">
              <svg
                className="w-6 h-6"
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
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-400">
                Shared Question Preview
              </h2>
              <p className="text-sm text-gray-400">
                This is a preview shared by a professor •{' '}
                {views_remaining !== undefined && views_remaining >= 0
                  ? `${views_remaining} view${views_remaining !== 1 ? 's' : ''} remaining`
                  : 'View count not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Question Metadata */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Question Type</p>
              <p className="font-semibold text-white capitalize">
                {question.question_type?.replace('_', ' ') || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Difficulty</p>
              <p className="font-semibold text-white">
                {question.difficulty || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Points</p>
              <p className="font-semibold text-white">{question.points}</p>
            </div>
          </div>
        </Card>

        {/* Question Content */}
        <Card>
          <h1 className="text-2xl font-bold text-white mb-4">
            {question.title}
          </h1>
          <div className="text-gray-300 mb-6 whitespace-pre-wrap">
            {question.question_text}
          </div>

          {/* Code Analysis Preview */}
          {question.question_type === 'fill_blanks' && (
            <div>
              {question.code_snippet && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Code Snippet:
                  </h3>
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-green-400">
                      {question.code_snippet}
                    </code>
                  </pre>
                </div>
              )}

              {question.blanks && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Expected Answers:
                  </h3>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    {Object.entries(question.blanks).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="text-blue-400">Blank {key}:</span>{' '}
                        <span className="text-white font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.hints && question.hints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hints:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {question.hints.map((hint: string, index: number) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Output Tracing Preview */}
          {question.question_type === 'trace_output' && (
            <div>
              {question.code_snippet && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Code Snippet:
                  </h3>
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-green-400">
                      {question.code_snippet}
                    </code>
                  </pre>
                </div>
              )}

              {question.expected_output && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Expected Output:
                  </h3>
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-yellow-400">
                      {question.expected_output}
                    </code>
                  </pre>
                </div>
              )}

              {question.output_tips && question.output_tips.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Output Tips:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {question.output_tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Essay Preview */}
          {question.question_type === 'essay' && (
            <div>
              {question.essay_context && (
                <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">
                    Context:
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {question.essay_context}
                  </p>
                </div>
              )}

              {question.essay_requirements && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Requirements:
                  </h3>
                  <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="text-gray-400">Word Count:</span>{' '}
                      <span className="text-white">
                        {question.essay_requirements.word_count?.[0]} -{' '}
                        {question.essay_requirements.word_count?.[1]} words
                      </span>
                    </div>
                    {question.essay_requirements.key_concepts &&
                      question.essay_requirements.key_concepts.length > 0 && (
                        <div>
                          <span className="text-gray-400">Key Concepts:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {question.essay_requirements.key_concepts.map(
                              (concept, index) => (
                                <span
                                  key={index}
                                  className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm"
                                >
                                  {concept}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    <div>
                      <span className="text-gray-400">Examples Required:</span>{' '}
                      <span className="text-white">
                        {question.essay_requirements.examples_required
                          ? 'Yes'
                          : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {question.essay_structure_guide && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Structure Guide:
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {question.essay_structure_guide}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            This preview link is time-limited and will expire. Do not share this
            link publicly.
          </p>
        </div>
      </Container>
    </div>
  );
}

import { notFound, redirect } from 'next/navigation';
import { getQuestionWithAnswer } from '@/app/professor-exams/actions';
import { checkProfessorRole } from '@/lib/auth-roles';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface PreviewPageProps {
  params: {
    questionId: string;
  };
}

export default async function PreviewQuestionPage({ params }: PreviewPageProps) {
  // Check professor role
  const user = await checkProfessorRole();
  if (!user) {
    redirect('/professor-exams');
  }

  // Get question data
  const questionData = await getQuestionWithAnswer(params.questionId);
  
  if (!questionData) {
    notFound();
  }

  const { question } = questionData;

  return (
    <Container>
      {/* Preview Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 text-white p-2 rounded-lg">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">
                PREVIEW MODE - NOT PUBLISHED
              </h2>
              <p className="text-sm text-gray-400">
                This question is only visible to professors and admins
              </p>
            </div>
          </div>
          <Link href="/admin/exams">
            <Button variant="secondary">
              Back to Dashboard
            </Button>
          </Link>
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
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Last Updated</p>
          <p className="text-white">
            {new Date(question.updated_at).toLocaleString()}
          </p>
        </div>
      </Card>

      {/* Question Content */}
      <Card>
        <h1 className="text-2xl font-bold text-white mb-4">{question.title}</h1>
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
                  <code className="text-green-400">{question.code_snippet}</code>
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
                      <span className="text-white font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.hints && question.hints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Hints:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {question.hints.map((hint, index) => (
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
                  <code className="text-green-400">{question.code_snippet}</code>
                </pre>
              </div>
            )}

            {question.expected_output && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Expected Output:
                </h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-yellow-400">{question.expected_output}</code>
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
    </Container>
  );
}

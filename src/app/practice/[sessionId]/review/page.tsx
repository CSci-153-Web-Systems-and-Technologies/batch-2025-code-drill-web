'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CodeWithBlanks from '@/components/practice/CodeWithBlanks';
import { createClient } from '@/lib/supabase/client';
import type { ExamQuestion } from '@/types/professor-exam';

interface ReviewPageProps {
  params: {
    sessionId: string;
  };
}

interface PracticeExamQuestion {
  id: string;
  session_id: string;
  exam_question_id: string;
  answered_at: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  exam_question: ExamQuestion;
}

interface PracticeSessionData {
  id: string;
  user_id: string;
  question_source: 'coding' | 'exam';
  course_id: string | null;
  time_limit: number;
  started_at: string;
  completed_at: string | null;
  status: 'active' | 'completed' | 'abandoned';
  practice_exam_questions?: PracticeExamQuestion[];
}

export default function SessionReviewPage({ params }: ReviewPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<PracticeSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  const loadSession = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        practice_exam_questions (
          *,
          exam_question:exam_questions (*)
        )
      `)
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !sessionData) {
      setError('Session not found');
      setLoading(false);
      return;
    }

    setSession(sessionData as PracticeSessionData);
    setLoading(false);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading review...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This practice session does not exist.'}</p>
          <Button onClick={() => router.push('/practice')}>Back to Practice</Button>
        </div>
      </Container>
    );
  }

  const questions = session.practice_exam_questions || [];
  const answeredCount = questions.filter(q => q.answered_at).length;
  const correctCount = questions.filter(q => q.is_correct === true).length;
  const duration = session.completed_at 
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : session.time_limit;

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Practice Session Review</h1>
          <p className="text-gray-600">
            {session.status === 'completed' ? 'Session Completed' : 'Session Abandoned'} • {duration} minutes
          </p>
        </div>

        {/* Summary Stats */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{answeredCount}</div>
              <div className="text-sm text-gray-600 mt-1">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-600 mt-1">Correct (Auto-graded)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">{questions.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {answeredCount > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Completion</div>
            </div>
          </div>
        </Card>

        {/* Questions Review */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Question Review</h2>
          
          {questions.map((item, index) => {
            const question = item.exam_question;
            const answered = item.answered_at !== null;
            const isCorrect = item.is_correct;

            return (
              <Card
                key={item.id}
                className={`p-6 ${
                  isCorrect === true
                    ? 'border-l-4 border-green-500'
                    : isCorrect === false
                    ? 'border-l-4 border-red-500'
                    : answered
                    ? 'border-l-4 border-gray-400'
                    : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                        {question.question_type_category.replace('_', ' ').toUpperCase()}
                      </span>
                      {isCorrect === true && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                          ✓ Correct
                        </span>
                      )}
                      {isCorrect === false && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium">
                          ✗ Incorrect
                        </span>
                      )}
                      {!answered && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                          Not Answered
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600">{question.points} points</span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{question.question_text}</p>
                </div>

                {/* Show code snippet if applicable */}
                {question.code_snippet && question.question_type_category === 'code_analysis' && question.blanks && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Your Answer (with auto-grading):</h4>
                    <CodeWithBlanks
                      codeSnippet={question.code_snippet}
                      blanks={question.blanks}
                      userAnswers={
                        typeof item.user_answer === 'object' && item.user_answer
                          ? item.user_answer as Record<string, string>
                          : {}
                      }
                      onChange={() => {}} // Read-only in review mode
                      showCorrectness={true} // Show auto-grading
                    />
                    <div className="mt-4 bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Correct Answers:</h4>
                      <div className="text-green-700 text-sm space-y-1">
                        {Object.entries(question.blanks).map(([key, value]) => (
                          <p key={key}>
                            <strong>Blank {key}:</strong> <code className="bg-green-100 px-2 py-1 rounded">{value}</code>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {question.code_snippet && question.question_type_category !== 'code_analysis' && (
                  <div className="mb-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{question.code_snippet}</code>
                    </pre>
                  </div>
                )}

                {/* Show correct answer for auto-gradable questions */}
                {question.question_type_category === 'multiple_choice' && question.choices && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Correct Answer:</h4>
                    <p className="text-green-700">
                      {question.choices.find((c: any) => c.id === question.correct_answer)?.text || 'N/A'}
                    </p>
                  </div>
                )}

                {question.question_type_category === 'true_false' && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Correct Answer:</h4>
                    <p className="text-green-700 font-semibold">
                      {question.correct_boolean ? 'True' : 'False'}
                    </p>
                  </div>
                )}

                {/* For code_analysis, output_tracing, essay - show expected answer/tips */}
                {question.question_type_category === 'output_tracing' && question.expected_output && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Expected Output:</h4>
                    <pre className="text-blue-700 font-mono text-sm whitespace-pre-wrap">{question.expected_output}</pre>
                    {question.output_tips && (
                      <p className="text-blue-600 text-sm mt-2">💡 {question.output_tips}</p>
                    )}
                  </div>
                )}

                {question.question_type_category === 'essay' && (
                  <div className="mt-4 space-y-3">
                    {question.essay_requirements && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Requirements:</h4>
                        <div className="text-blue-700 text-sm space-y-2">
                          {typeof question.essay_requirements === 'object' ? (
                            <>
                              {question.essay_requirements.word_count && (
                                <p>
                                  <strong>Word Count:</strong> {question.essay_requirements.word_count[0]} - {question.essay_requirements.word_count[1]} words
                                </p>
                              )}
                              {question.essay_requirements.key_concepts && question.essay_requirements.key_concepts.length > 0 && (
                                <p>
                                  <strong>Key Concepts:</strong> {question.essay_requirements.key_concepts.join(', ')}
                                </p>
                              )}
                              {question.essay_requirements.examples_required !== undefined && (
                                <p>
                                  <strong>Examples Required:</strong> {question.essay_requirements.examples_required ? 'Yes' : 'No'}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap">{question.essay_requirements}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {question.essay_structure_guide && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Structure Guide:</h4>
                        <p className="text-purple-700 text-sm whitespace-pre-wrap">{question.essay_structure_guide}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center">
          <Button onClick={() => router.push('/practice')}>
            Start New Practice
          </Button>
          <Button variant="secondary" onClick={() => router.push('/practice/history')}>
            View History
          </Button>
        </div>

        {/* Self-Review Note */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Self-Review</h3>
          <p className="text-sm text-blue-800">
            Practice sessions are designed for self-improvement. Review the correct answers and explanations above to
            understand your mistakes. For essay and code analysis questions, compare your answers with the provided
            requirements and tips. Remember: practice is risk-free and won't affect your grades!
          </p>
        </div>
      </div>
    </Container>
  );
}

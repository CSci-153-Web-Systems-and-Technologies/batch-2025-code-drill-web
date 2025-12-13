'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { updateSessionStatus } from '../actions';
import { recordQuestionAnswer } from '@/lib/question-selection';
import type { ExamQuestion, QuestionTypeCategory } from '@/types/professor-exam';

interface PracticeSessionPageProps {
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

export default function PracticeSessionPage({ params }: PracticeSessionPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<PracticeSessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const startTime = new Date(session.started_at).getTime();
    const endTime = startTime + session.time_limit * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleEndSession('completed');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

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
    
    // Calculate initial time remaining
    if (sessionData.status === 'active') {
      const startTime = new Date(sessionData.started_at).getTime();
      const endTime = startTime + sessionData.time_limit * 60 * 1000;
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(remaining);
    }
    
    setLoading(false);
  };

  const handleEndSession = async (status: 'completed' | 'abandoned') => {
    const result = await updateSessionStatus(params.sessionId, status);
    if (!result.error) {
      router.push(`/practice/${params.sessionId}/review`);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAnswer = async () => {
    if (!session?.practice_exam_questions) return;
    
    const currentQuestion = session.practice_exam_questions[currentQuestionIndex];
    const answer = answers[currentQuestion.exam_question_id];
    
    if (!answer) {
      alert('Please provide an answer before submitting');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Determine if answer is correct (for auto-gradable types)
      let isCorrect: boolean | null = null;
      const question = currentQuestion.exam_question;
      
      if (question.question_type_category === 'multiple_choice') {
        isCorrect = answer === question.correct_answer;
      } else if (question.question_type_category === 'true_false') {
        isCorrect = answer === question.correct_boolean;
      }
      // For code_analysis, output_tracing, essay: isCorrect stays null (needs manual grading or self-review)
      
      // Update practice_exam_questions record
      await supabase
        .from('practice_exam_questions')
        .update({
          answered_at: new Date().toISOString(),
          is_correct: isCorrect,
        })
        .eq('id', currentQuestion.id);
      
      // Record answer in user_question_history
      if (isCorrect !== null) {
        await recordQuestionAnswer(user.id, currentQuestion.exam_question_id, isCorrect);
      }
      
      // Move to next question or end session
      if (currentQuestionIndex < session.practice_exam_questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // All questions answered, complete session
        await handleEndSession('completed');
      }
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session...</p>
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

  if (session.status !== 'active') {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Session Ended</h1>
          <p className="text-gray-600 mb-6">
            This practice session has been {session.status}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/practice')}>Start New Session</Button>
            <Button variant="secondary" onClick={() => router.push(`/practice/${session.id}/review`)}>
              View Review
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Handle exam-based practice
  if (session.question_source === 'exam' && session.practice_exam_questions) {
    const questions = session.practice_exam_questions;
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return null;
    }
    
    const question = currentQuestion.exam_question;
    const answeredCount = questions.filter(q => q.answered_at).length;

    return (
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Practice Session</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <Card className="px-6 py-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
                <div
                  className={`text-3xl font-bold ${
                    timeRemaining < 5 * 60 * 1000 ? 'text-red-600' : 'text-blue-600'
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{answeredCount} / {questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                  {question.question_type_category.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-600">{question.points} points</span>
              </div>
              
              <h2 className="text-xl font-bold mb-4">{question.title}</h2>
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap">{question.question_text}</p>
              </div>
            </div>

            {/* Question Type Specific Rendering */}
            {question.question_type_category === 'code_analysis' && (
              <div className="space-y-4">
                {question.code_snippet && (
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{question.code_snippet}</code>
                    </pre>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    rows={6}
                    placeholder="Enter your code or analysis..."
                  />
                </div>
              </div>
            )}

            {question.question_type_category === 'output_tracing' && (
              <div className="space-y-4">
                {question.code_snippet && (
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{question.code_snippet}</code>
                    </pre>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is the output?
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    rows={4}
                    placeholder="Enter the expected output..."
                  />
                </div>
                {question.output_tips && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    💡 Tip: {question.output_tips}
                  </div>
                )}
              </div>
            )}

            {question.question_type_category === 'essay' && (
              <div className="space-y-4">
                {question.essay_context && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Context:</h4>
                    <p className="text-sm whitespace-pre-wrap">{question.essay_context}</p>
                  </div>
                )}
                {question.essay_requirements && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <div className="text-sm space-y-2">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Essay
                  </label>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={12}
                    placeholder="Write your essay here..."
                  />
                </div>
                {question.essay_structure_guide && (
                  <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                    📝 Structure Guide: {question.essay_structure_guide}
                  </div>
                )}
              </div>
            )}

            {question.question_type_category === 'multiple_choice' && question.choices && (
              <div className="space-y-3">
                {question.choices.map((choice: any, index: number) => (
                  <label
                    key={choice.id}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === choice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice.id}
                      checked={answers[question.id] === choice.id}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {choice.text}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {question.question_type_category === 'true_false' && (
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === true
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === true}
                    onChange={() => handleAnswerChange(question.id, true)}
                  />
                  <span className="font-medium">True</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === false
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === false}
                    onChange={() => handleAnswerChange(question.id, false)}
                  />
                  <span className="font-medium">False</span>
                </label>
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => handleEndSession('abandoned')}
              >
                Abandon Session
              </Button>
              
              <Button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answers[question.id]}
              >
                {submitting 
                  ? 'Submitting...' 
                  : currentQuestionIndex === questions.length - 1 
                  ? 'Submit & Finish' 
                  : 'Submit & Next →'}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Fallback for coding problems (existing implementation would go here)
  return (
    <Container>
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p>Coding problem practice mode - use existing implementation</p>
      </div>
    </Container>
  );
}

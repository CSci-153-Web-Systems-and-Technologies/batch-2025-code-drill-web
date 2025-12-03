'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  startExamSession, 
  submitOutputAnswer,
  trackHintUsage 
} from '@/app/professor-exams/actions';
import { ExamSessionData } from '@/types/professor-exam';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Props = {
  courseId: string;
  templateId: string;
};

export default function OutputTracingExam({ courseId, templateId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<ExamSessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [outputAnswer, setOutputAnswer] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; points: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Initialize exam session
  useEffect(() => {
    const init = async () => {
      try {
        const data = await startExamSession(courseId, templateId);
        setSessionData(data);
        
        // Initialize timer (in seconds)
        setTimeLeft(data.template.duration_minutes * 60);
        
        // Load existing answer for current question
        if (data.questions.length > 0) {
          const existingAnswer = data.answers.find(
            a => a.question_id === data.questions[0].id
          );
          if (existingAnswer?.output_answer) {
            setOutputAnswer(existingAnswer.output_answer);
          }
        }
      } catch (error) {
        console.error('Failed to start exam:', error);
        alert('Failed to start exam. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [courseId, templateId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = () => {
    if (timeLeft > 300) return 'text-blue-400'; // > 5 min
    if (timeLeft > 120) return 'text-yellow-400'; // 2-5 min
    return 'text-red-400'; // < 2 min
  };

  // Handle question change
  const changeQuestion = useCallback((newIndex: number) => {
    if (!sessionData) return;
    
    setCurrentQuestionIndex(newIndex);
    setShowTips(false);
    setFeedback(null);
    setQuestionStartTime(Date.now());
    
    // Load existing answer for new question
    const existingAnswer = sessionData.answers.find(
      a => a.question_id === sessionData.questions[newIndex].id
    );
    if (existingAnswer?.output_answer) {
      setOutputAnswer(existingAnswer.output_answer);
    } else {
      setOutputAnswer('');
    }
  }, [sessionData]);

  // Handle tips toggle
  const handleShowTips = async () => {
    if (!sessionData || !showTips) {
      setShowTips(!showTips);
      
      // Track hint usage
      if (!showTips) {
        try {
          await trackHintUsage(
            sessionData!.questions[currentQuestionIndex].id,
            sessionData!.progress.id
          );
        } catch (error) {
          console.error('Failed to track hint:', error);
        }
      }
    } else {
      setShowTips(false);
    }
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!sessionData) return;

    const currentQuestion = sessionData.questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setSubmitting(true);
    try {
      const result = await submitOutputAnswer(
        currentQuestion.id,
        sessionData.progress.id,
        outputAnswer,
        timeSpent
      );

      setFeedback({
        show: true,
        correct: result.is_correct,
        points: result.points_earned,
      });

      // Reload session data to update progress
      const updatedData = await startExamSession(courseId, templateId);
      setSessionData(updatedData);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (!sessionData) return;
    if (currentQuestionIndex < sessionData.questions.length - 1) {
      changeQuestion(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      changeQuestion(currentQuestionIndex - 1);
    }
  };

  if (loading || !sessionData) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading exam...</p>
          </div>
        </div>
      </Container>
    );
  }

  const currentQuestion = sessionData.questions[currentQuestionIndex];

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">{sessionData.template.title}</h1>
          <p className="text-gray-400">
            Question {currentQuestionIndex + 1} of {sessionData.questions.length}
          </p>
        </div>
        <div className={`text-2xl font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-400">
            {sessionData.progress.questions_completed}/{sessionData.progress.total_questions} completed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{
              width: `${(sessionData.progress.questions_completed / sessionData.progress.total_questions) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question */}
          <Card>
            <h2 className="text-xl font-bold mb-4">{currentQuestion.title}</h2>
            <p className="text-gray-300 mb-6">{currentQuestion.question_text}</p>

            {/* Code Snippet */}
            {currentQuestion.code_snippet && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase">Code</span>
                </div>
                <pre className="font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {currentQuestion.code_snippet}
                </pre>
              </div>
            )}

            {/* Output Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Expected Output
              </label>
              <textarea
                value={outputAnswer}
                onChange={(e) => setOutputAnswer(e.target.value)}
                placeholder="Enter the expected output here...&#10;&#10;Each line should match exactly what the program prints.&#10;Include all spaces, punctuation, and line breaks."
                className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-green-500 resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Make sure to include exact spacing, punctuation, and line breaks
              </p>
            </div>

            {/* Feedback */}
            {feedback?.show && (
              <div
                className={`p-4 rounded-lg mb-6 ${
                  feedback.correct
                    ? 'bg-green-500/20 border border-green-500'
                    : 'bg-red-500/20 border border-red-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {feedback.correct ? (
                    <>
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-bold text-green-400">Correct!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-bold text-red-400">Incorrect</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-300">
                  Points earned: {feedback.points} / {currentQuestion.points}
                </p>
                {!feedback.correct && (
                  <p className="text-xs text-gray-400 mt-2">
                    Check for exact spacing, capitalization, and line breaks
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !outputAnswer.trim()}
                variant="primary"
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Checking...' : 'Check Output'}
              </Button>
              <Button onClick={handleShowTips} variant="secondary">
                {showTips ? 'Hide Tips' : 'Show Tips'}
              </Button>
            </div>
          </Card>

          {/* Navigation */}
          <Card>
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="secondary"
              >
                ← Previous
              </Button>
              <span className="text-gray-400">
                {currentQuestionIndex + 1} / {sessionData.questions.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === sessionData.questions.length - 1}
                variant="secondary"
              >
                Next →
              </Button>
            </div>
          </Card>

          {/* Question Navigator */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Question Overview</h3>
            <div className="flex flex-wrap gap-2">
              {sessionData.questions.map((q, idx) => {
                const answered = sessionData.answers.find(a => a.question_id === q.id && a.submitted_at);
                return (
                  <button
                    key={q.id}
                    onClick={() => changeQuestion(idx)}
                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                      idx === currentQuestionIndex
                        ? 'bg-green-600 text-white'
                        : answered
                        ? 'bg-green-600/30 text-green-400 border border-green-600'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips Panel */}
          {showTips && currentQuestion.output_tips && currentQuestion.output_tips.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-yellow-400 mb-4">Tips</h3>
              <ul className="space-y-2">
                {currentQuestion.output_tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400">{idx + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Instructions */}
          {sessionData.template.instructions && (
            <Card>
              <h3 className="text-lg font-bold mb-4">Instructions</h3>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">
                {sessionData.template.instructions}
              </p>
            </Card>
          )}

          {/* Output Guidelines */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Output Guidelines</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Trace through the code line by line</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Pay attention to variable values as they change</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Include exact spacing and punctuation</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Each print statement creates a new line</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Double-check for typos before submitting</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}

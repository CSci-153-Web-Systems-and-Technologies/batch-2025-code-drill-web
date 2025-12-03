'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  startExamSession, 
  submitBlanksAnswer,
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

export default function CodeAnalysisExam({ courseId, templateId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<ExamSessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState(false);
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
        
        // Load existing answers for current question
        if (data.questions.length > 0) {
          const existingAnswer = data.answers.find(
            a => a.question_id === data.questions[0].id
          );
          if (existingAnswer?.blank_answers) {
            setBlankAnswers(existingAnswer.blank_answers);
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
    setShowHints(false);
    setFeedback(null);
    setQuestionStartTime(Date.now());
    
    // Load existing answers for new question
    const existingAnswer = sessionData.answers.find(
      a => a.question_id === sessionData.questions[newIndex].id
    );
    if (existingAnswer?.blank_answers) {
      setBlankAnswers(existingAnswer.blank_answers);
    } else {
      setBlankAnswers({});
    }
  }, [sessionData]);

  // Handle blank input change
  const handleBlankChange = (blankNum: string, value: string) => {
    setBlankAnswers(prev => ({ ...prev, [blankNum]: value }));
  };

  // Handle hint toggle
  const handleShowHints = async () => {
    if (!sessionData || !showHints) {
      setShowHints(!showHints);
      
      // Track hint usage
      if (!showHints) {
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
      setShowHints(false);
    }
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!sessionData) return;

    const currentQuestion = sessionData.questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setSubmitting(true);
    try {
      const result = await submitBlanksAnswer(
        currentQuestion.id,
        sessionData.progress.id,
        blankAnswers,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading exam...</p>
          </div>
        </div>
      </Container>
    );
  }

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const blanks = currentQuestion.blanks || {};
  const blankCount = Object.keys(blanks).length;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">{sessionData.template.title}</h1>
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
            className="bg-blue-500 h-2 rounded-full transition-all"
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

            {/* Code Snippet with Blanks */}
            {currentQuestion.code_snippet && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {currentQuestion.code_snippet
                    .split(/(__BLANK\d+__)/)
                    .map((part, idx) => {
                      const blankMatch = part.match(/__BLANK(\d+)__/);
                      if (blankMatch) {
                        const blankNum = blankMatch[1];
                        return (
                          <span key={idx} className="inline-block">
                            <input
                              type="text"
                              value={blankAnswers[blankNum] || ''}
                              onChange={(e) => handleBlankChange(blankNum, e.target.value)}
                              className="inline-block bg-blue-500/20 border border-blue-500 rounded px-2 py-1 text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Blank ${blankNum}`}
                              style={{ minWidth: '100px' }}
                            />
                          </span>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    })}
                </pre>
              </div>
            )}

            {/* Blank Inputs */}
            <div className="space-y-3 mb-6">
              {Object.keys(blanks).map((blankNum) => (
                <div key={blankNum} className="flex items-center gap-3">
                  <label className="text-gray-400 font-semibold w-24">
                    Blank {blankNum}:
                  </label>
                  <input
                    type="text"
                    value={blankAnswers[blankNum] || ''}
                    onChange={(e) => handleBlankChange(blankNum, e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter your answer"
                  />
                </div>
              ))}
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(blankAnswers).length !== blankCount}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Checking...' : 'Check Answer'}
              </Button>
              <Button onClick={handleShowHints} variant="secondary">
                {showHints ? 'Hide Hints' : 'Show Hints'}
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
                        ? 'bg-blue-600 text-white'
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
          {/* Hints Panel */}
          {showHints && currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-yellow-400 mb-4">Hints</h3>
              <ul className="space-y-2">
                {currentQuestion.hints.map((hint, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400">{idx + 1}.</span>
                    <span>{hint}</span>
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

          {/* Tips */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Read the code carefully before filling blanks</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Pay attention to variable types and scope</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Match the coding style shown in the snippet</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Use hints if you&apos;re stuck, but try first</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}

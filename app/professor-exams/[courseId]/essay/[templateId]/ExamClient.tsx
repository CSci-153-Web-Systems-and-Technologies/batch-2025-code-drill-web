'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  startExamSession, 
  submitEssayAnswer,
  autoSaveEssay,
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

export default function EssayExam({ courseId, templateId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [sessionData, setSessionData] = useState<ExamSessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showStructure, setShowStructure] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
          if (existingAnswer?.essay_answer) {
            setEssayAnswer(existingAnswer.essay_answer);
            setWordCount(existingAnswer.word_count || 0);
            setSubmitted(!!existingAnswer.submitted_at);
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

  // Auto-save essay every 3 seconds
  useEffect(() => {
    if (!sessionData || !essayAnswer.trim() || submitted) return;

    const autoSaveTimer = setTimeout(async () => {
      setAutoSaving(true);
      try {
        await autoSaveEssay(
          sessionData.questions[currentQuestionIndex].id,
          sessionData.progress.id,
          essayAnswer,
          wordCount
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [essayAnswer, wordCount, currentQuestionIndex, sessionData, submitted]);

  // Update word count when essay changes
  useEffect(() => {
    const words = essayAnswer.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [essayAnswer]);

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
    setShowStructure(false);
    setQuestionStartTime(Date.now());
    
    // Load existing answer for new question
    const existingAnswer = sessionData.answers.find(
      a => a.question_id === sessionData.questions[newIndex].id
    );
    if (existingAnswer?.essay_answer) {
      setEssayAnswer(existingAnswer.essay_answer);
      setWordCount(existingAnswer.word_count || 0);
      setSubmitted(!!existingAnswer.submitted_at);
    } else {
      setEssayAnswer('');
      setWordCount(0);
      setSubmitted(false);
    }
  }, [sessionData]);

  // Submit answer
  const handleSubmit = async () => {
    if (!sessionData) return;

    const currentQuestion = sessionData.questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setSubmitting(true);
    try {
      await submitEssayAnswer(
        currentQuestion.id,
        sessionData.progress.id,
        essayAnswer,
        wordCount,
        timeSpent
      );

      setSubmitted(true);
      alert('Essay submitted successfully! It will be reviewed manually.');

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading exam...</p>
          </div>
        </div>
      </Container>
    );
  }

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const requirements = currentQuestion?.essay_requirements;
  const minWords = requirements?.word_count?.[0] || 200;
  const maxWords = requirements?.word_count?.[1] || 400;
  const meetsMinimum = wordCount >= minWords;
  const exceedsMaximum = wordCount > maxWords;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-purple-400">{sessionData.template.title}</h1>
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
            className="bg-purple-500 h-2 rounded-full transition-all"
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
            <h2 className="text-xl font-bold mb-4">{currentQuestion?.title}</h2>
            <p className="text-gray-300 mb-6">{currentQuestion?.question_text}</p>

            {/* Context */}
            {currentQuestion?.essay_context && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-purple-400 mb-2">Context</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {currentQuestion.essay_context}
                </p>
              </div>
            )}

            {/* Requirements */}
            {requirements && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Requirements</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>
                      Word count: {minWords}-{maxWords} words
                    </span>
                  </li>
                  {requirements.key_concepts && requirements.key_concepts.length > 0 && (
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        Key concepts: {requirements.key_concepts.join(', ')}
                      </span>
                    </li>
                  )}
                  {requirements.examples_required && (
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>Include specific examples</span>
                    </li>
                  )}
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Use clear, professional language</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Essay Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-400">
                  Your Answer
                </label>
                {autoSaving && (
                  <span className="text-xs text-gray-500 animate-pulse">Saving...</span>
                )}
              </div>
              <textarea
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                disabled={submitted}
                placeholder="Write your essay here...&#10;&#10;Make sure to:&#10;- Address all key concepts&#10;- Provide clear examples&#10;- Use proper grammar and punctuation&#10;- Stay within the word count range"
                className="w-full h-80 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Word Count */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Word count:</span>
                <span
                  className={`text-sm font-bold ${
                    !meetsMinimum
                      ? 'text-red-400'
                      : exceedsMaximum
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {wordCount} / {minWords}-{maxWords}
                </span>
              </div>
              {!meetsMinimum && wordCount > 0 && (
                <p className="text-xs text-red-400 mt-1">
                  Need at least {minWords - wordCount} more words
                </p>
              )}
              {exceedsMaximum && (
                <p className="text-xs text-yellow-400 mt-1">
                  Exceeds maximum by {wordCount - maxWords} words
                </p>
              )}
            </div>

            {/* Submitted Message */}
            {submitted && (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-bold text-green-400">Submitted!</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  Your essay has been submitted and will be reviewed manually.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!submitted && (
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !meetsMinimum || exceedsMaximum}
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
                <Button 
                  onClick={() => setShowStructure(!showStructure)} 
                  variant="secondary"
                >
                  {showStructure ? 'Hide Structure' : 'Show Structure'}
                </Button>
              </div>
            )}
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
                        ? 'bg-purple-600 text-white'
                        : answered
                        ? 'bg-purple-600/30 text-purple-400 border border-purple-600'
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
          {/* Structure Guide */}
          {showStructure && currentQuestion?.essay_structure_guide && (
            <Card>
              <h3 className="text-lg font-bold text-purple-400 mb-4">Structure Guide</h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {currentQuestion.essay_structure_guide}
              </div>
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

          {/* Writing Tips */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Writing Tips</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Start with a clear introduction</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Use paragraphs to organize your thoughts</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Support claims with specific examples</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Address all key concepts mentioned</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Conclude with a summary of main points</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Your work auto-saves every 3 seconds</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}

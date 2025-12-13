'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getQuestionsByCategory,
  submitBlanksAnswer,
  submitOutputAnswer,
  submitEssayAnswer,
  submitMultipleChoiceAnswer,
  submitTrueFalseAnswer,
  trackHintUsage,
  submitEssayForGrading
} from '@/app/professor-exams/actions';
import { ExamQuestion, QuestionTypeCategory } from '@/types/professor-exam';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Props = {
  courseId: string;
  questionType: QuestionTypeCategory;
};

export default function QuestionPracticeClient({ courseId, questionType }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Answer states for different question types
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [outputAnswer, setOutputAnswer] = useState('');
  const [essayAnswer, setEssayAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  
  const [showHints, setShowHints] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; points: number } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Initialize practice session
  useEffect(() => {
    const init = async () => {
      try {
        const data = await getQuestionsByCategory(courseId, questionType);
        setQuestions(data);
        
        if (data.length === 0) {
          return;
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
        alert('Failed to load questions. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [courseId, questionType, router]);

  // Handle question change
  const changeQuestion = useCallback((newIndex: number) => {
    setCurrentQuestionIndex(newIndex);
    setShowHints(false);
    setFeedback(null);
    setQuestionStartTime(Date.now());
    
    // Reset all answer states
    setBlankAnswers({});
    setOutputAnswer('');
    setEssayAnswer('');
    setSelectedChoice('');
    setTrueFalseAnswer(null);
  }, []);

  // Handle blank input change (for code_analysis)
  const handleBlankChange = (blankNum: string, value: string) => {
    setBlankAnswers(prev => ({ ...prev, [blankNum]: value }));
  };

  // Handle hint toggle
  const handleShowHints = async () => {
    if (!showHints && questions.length > 0) {
      setShowHints(true);
      
      // Track hint usage - we'll need to create a progress record first
      // For now, just show hints without tracking
      // TODO: Implement category-based progress tracking
    } else {
      setShowHints(false);
    }
  };

  // Submit answer based on question type
  const handleSubmit = async () => {
    if (questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setSubmitting(true);
    try {
      let result: any;

      // For now, we'll call submit functions without progress_id
      // TODO: Implement category-based progress tracking
      // Temporary solution: just validate answers client-side
      
      switch (questionType) {
        case 'code_analysis':
          // Validate blank answers
          const blanks = currentQuestion.blanks || {};
          const allCorrect = Object.entries(blanks).every(([key, expectedValue]) => {
            const userAnswer = blankAnswers[key]?.trim().toLowerCase();
            const expected = (expectedValue as string).trim().toLowerCase();
            return userAnswer === expected;
          });
          
          setFeedback({
            show: true,
            correct: allCorrect,
            points: allCorrect ? currentQuestion.points : 0,
          });
          break;

        case 'output_tracing':
          // Validate output answer
          const outputCorrect = outputAnswer.trim().toLowerCase() === 
            (currentQuestion.expected_output || '').trim().toLowerCase();
          
          setFeedback({
            show: true,
            correct: outputCorrect,
            points: outputCorrect ? currentQuestion.points : 0,
          });
          break;

        case 'essay':
          // Submit essay for manual grading
          const wordCount = essayAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
          
          const essayResult = await submitEssayForGrading({
            questionId: currentQuestion.id,
            courseId,
            questionTypeCategory: questionType,
            essayAnswer,
            wordCount,
            timeSpent,
            hintsUsed: showHints ? 1 : 0,
          });
          
          if (essayResult.success) {
            setFeedback({
              show: true,
              correct: true,
              points: 0, // Will be awarded after manual grading
            });
          } else {
            throw new Error(essayResult.error || 'Failed to submit essay');
          }
          break;

        case 'multiple_choice':
          // Validate multiple choice
          const choiceCorrect = selectedChoice === currentQuestion.correct_answer;
          
          setFeedback({
            show: true,
            correct: choiceCorrect,
            points: choiceCorrect ? currentQuestion.points : 0,
          });
          break;

        case 'true_false':
          // Validate true/false
          const tfCorrect = trueFalseAnswer !== null && 
            trueFalseAnswer.toString() === currentQuestion.correct_answer;
          
          setFeedback({
            show: true,
            correct: tfCorrect,
            points: tfCorrect ? currentQuestion.points : 0,
          });
          break;
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      changeQuestion(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      changeQuestion(currentQuestionIndex - 1);
    }
  };

  // Check if current answer is valid for submission
  const isAnswerValid = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return false;

    switch (questionType) {
      case 'code_analysis':
        const blanks = currentQuestion.blanks || {};
        return Object.keys(blankAnswers).length === Object.keys(blanks).length;
      
      case 'output_tracing':
        return outputAnswer.trim().length > 0;
      
      case 'essay':
        const wordCount = essayAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
        const requirements = currentQuestion.essay_requirements;
        if (!requirements) return essayAnswer.trim().length > 0;
        
        const [minWords, maxWords] = requirements.word_count;
        return wordCount >= minWords && wordCount <= maxWords;
      
      case 'multiple_choice':
        return selectedChoice.length > 0;
      
      case 'true_false':
        return trueFalseAnswer !== null;
      
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading questions...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Check if there are no questions
  if (questions.length === 0) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h2 className="text-xl font-bold text-gray-300 mb-2">No Questions Available</h2>
            <p className="text-gray-400 mb-6">This course doesn&apos;t have any {questionType.replace('_', ' ')} questions yet.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Render question content based on type
  const renderQuestionContent = () => {
    switch (questionType) {
      case 'code_analysis':
        return (
          <>
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
              {Object.keys(currentQuestion.blanks || {}).map((blankNum) => (
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
          </>
        );

      case 'output_tracing':
        return (
          <>
            {/* Code Snippet */}
            {currentQuestion.code_snippet && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {currentQuestion.code_snippet}
                </pre>
              </div>
            )}

            {/* Output Input */}
            <div className="mb-6">
              <label className="block text-gray-400 font-semibold mb-2">
                What will this code output?
              </label>
              <textarea
                value={outputAnswer}
                onChange={(e) => setOutputAnswer(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                rows={4}
                placeholder="Enter the expected output"
              />
            </div>
          </>
        );

      case 'essay':
        const wordCount = essayAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
        const requirements = currentQuestion.essay_requirements;
        const [minWords, maxWords] = requirements?.word_count || [0, 10000];
        const isWordCountValid = wordCount >= minWords && wordCount <= maxWords;
        
        return (
          <div className="mb-6">
            <label className="block text-gray-400 font-semibold mb-2">
              Your Answer:
            </label>
            <textarea
              value={essayAnswer}
              onChange={(e) => setEssayAnswer(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows={8}
              placeholder="Write your answer here..."
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                This answer will be manually graded by your professor.
              </p>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${
                  isWordCountValid 
                    ? 'text-green-400' 
                    : wordCount < minWords 
                      ? 'text-yellow-400' 
                      : 'text-red-400'
                }`}>
                  {wordCount} / {minWords}-{maxWords} words
                </span>
                {!isWordCountValid && (
                  <span className="text-xs text-gray-400">
                    {wordCount < minWords 
                      ? `Need ${minWords - wordCount} more` 
                      : `${wordCount - maxWords} over limit`}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3 mb-6">
            {currentQuestion.choices?.map((choice, idx) => (
              <label
                key={choice.id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedChoice === choice.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="multiple-choice"
                  value={choice.id}
                  checked={selectedChoice === choice.id}
                  onChange={(e) => setSelectedChoice(e.target.value)}
                  className="mt-1"
                />
                <span className="text-gray-300">{choice.text}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex gap-4 mb-6">
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                trueFalseAnswer === true
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="true-false"
                value="true"
                checked={trueFalseAnswer === true}
                onChange={() => setTrueFalseAnswer(true)}
              />
              <span className="text-lg font-semibold text-gray-300">True</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                trueFalseAnswer === false
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="true-false"
                value="false"
                checked={trueFalseAnswer === false}
                onChange={() => setTrueFalseAnswer(false)}
              />
              <span className="text-lg font-semibold text-gray-300">False</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-400 capitalize">
            {questionType.replace('_', ' ')} Practice
          </h1>
          <p className="text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-400">
            {currentQuestionIndex} / {questions.length} viewed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
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

            {/* Render question-type-specific content */}
            {renderQuestionContent()}

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
                  {questionType === 'essay' 
                    ? 'Your answer has been submitted for manual grading.' 
                    : `Points earned: ${feedback.points} / ${currentQuestion.points}`
                  }
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isAnswerValid()}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Checking...' : 'Check Answer'}
              </Button>
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <Button onClick={handleShowHints} variant="secondary">
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </Button>
              )}
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
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
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
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => changeQuestion(idx)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
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

          {/* Tips */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {questionType === 'code_analysis' && (
                <>
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
                </>
              )}
              {questionType === 'output_tracing' && (
                <>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Trace through the code line by line</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Track variable values as they change</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Pay attention to loops and conditionals</span>
                  </li>
                </>
              )}
              {questionType === 'essay' && (
                <>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Organize your thoughts before writing</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Provide specific examples to support your points</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Proofread before submitting</span>
                  </li>
                </>
              )}
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

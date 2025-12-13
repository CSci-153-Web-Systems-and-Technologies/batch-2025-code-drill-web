'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TagInput from '@/components/shared/TagInput';
import { createPracticeSession, getActiveSession } from './actions';
import { getAvailableQuestionCount, getQuestionTypeBreakdown } from '@/lib/question-selection';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';
import type { PracticeSessionConfig } from '@/types/practice';
import type { QuestionTypeCategory } from '@/types/professor-exam';

const QUESTION_TYPE_OPTIONS: { value: QuestionTypeCategory; label: string; icon: string }[] = [
  { value: 'code_analysis', label: 'Code Analysis', icon: '📝' },
  { value: 'output_tracing', label: 'Output Tracing', icon: '🔍' },
  { value: 'essay', label: 'Essay', icon: '✍️' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '☑️' },
  { value: 'true_false', label: 'True/False', icon: '✔️' },
];

const TIME_LIMIT_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
];

export default function PracticePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [typeBreakdown, setTypeBreakdown] = useState<Record<QuestionTypeCategory, number> | null>(null);

  // Route protection: only students can access practice
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (userData?.role !== 'student') {
          router.push('/');
          return;
        }
        
        setUser(userData as any);
        
        // Load courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('professor_courses')
          .select('id, course_code, name')
          .order('course_code');
        
        if (coursesError) {
          console.error('Error loading courses:', coursesError);
        }
        
        console.log('Loaded courses:', coursesData);
        
        if (coursesData) {
          setCourses(coursesData);
        }
      } else {
        router.push('/login');
      }
    };

    checkUserRole();
  }, [supabase, router]);

  const [config, setConfig] = useState<PracticeSessionConfig>({
    timeLimit: 30,
    courseId: undefined,
    tags: [],
    questionTypes: [],
  });

  // Update available question count when filters change
  useEffect(() => {
    const updateCount = async () => {
      if (!config.courseId) {
        setAvailableCount(0);
        setTypeBreakdown(null);
        return;
      }
      
      const count = await getAvailableQuestionCount({
        courseId: config.courseId,
        tags: config.tags,
        questionTypes: config.questionTypes,
      });
      
      setAvailableCount(count);
      
      const breakdown = await getQuestionTypeBreakdown({
        courseId: config.courseId,
        tags: config.tags,
      });
      
      setTypeBreakdown(breakdown);
    };
    
    updateCount();
  }, [config.courseId, config.tags, config.questionTypes]);

  const handleStartSession = async () => {
    setLoading(true);
    setError('');

    // Validate configuration
    if (!config.courseId) {
      setError('Please select a course');
      setLoading(false);
      return;
    }
    
    if (availableCount === 0) {
      setError('No questions available with current filters. Try adjusting your selection.');
      setLoading(false);
      return;
    }

    // Check if there's an active session
    const { data: activeSession } = await getActiveSession();
    if (activeSession) {
      router.push(`/practice/${activeSession.id}`);
      return;
    }

    const result = await createPracticeSession(config);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      router.push(`/practice/${result.data.id}`);
    }
  };

  const handleResumeSession = async () => {
    setCheckingSession(true);
    const { data: activeSession } = await getActiveSession();
    setCheckingSession(false);

    if (activeSession) {
      router.push(`/practice/${activeSession.id}`);
    }
  };

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Practice Mode</h1>
          <p className="text-gray-600">
            Practice exam questions from your courses. Mix question types, filter by topics, and sharpen your skills risk-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Exam Questions</h3>
            <p className="text-sm text-gray-600">
              Practice with real exam questions from professor-created question banks
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Risk-Free</h3>
            <p className="text-sm text-gray-600">
              Practice sessions don't affect your points, ranking, or daily streaks
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Topic Filtering</h3>
            <p className="text-sm text-gray-600">
              Filter questions by topic tags to focus on specific areas you want to practice
            </p>
          </Card>
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Configure Your Session</h2>

          <div className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={config.courseId || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    courseId: e.target.value || undefined,
                    tags: [], // Reset tags when course changes
                    questionTypes: [], // Reset question types when course changes
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the course you want to practice questions from
              </p>
            </div>

            {/* Tag Filtering */}
            {config.courseId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics (Optional)
                </label>
                <TagInput
                  courseId={config.courseId}
                  value={config.tags || []}
                  onChange={(tags) => setConfig({ ...config, tags })}
                  placeholder="Filter by topics (e.g., loops, arrays)..."
                  maxTags={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to practice all topics, or select specific topics to focus on
                </p>
              </div>
            )}

            {/* Question Type Selection */}
            {config.courseId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Types (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {QUESTION_TYPE_OPTIONS.map((option) => {
                    const isSelected = (config.questionTypes || []).includes(option.value);
                    const available = typeBreakdown?.[option.value] || 0;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const currentTypes = config.questionTypes || [];
                          const newTypes = isSelected
                            ? currentTypes.filter(t => t !== option.value)
                            : [...currentTypes, option.value];
                          setConfig({ ...config, questionTypes: newTypes });
                        }}
                        disabled={available === 0}
                        className={`px-3 py-3 rounded-lg border-2 font-medium transition-colors text-sm ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : available === 0
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{option.icon}</div>
                        <div>{option.label}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {available} available
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to mix all question types, or select specific types (max 5 questions total, 1 per type)
                </p>
              </div>
            )}

            {/* Available Question Count */}
            {config.courseId && availableCount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{availableCount} questions</span> available with current filters.
                  {(config.questionTypes || []).length > 0 && (
                    <> You'll practice {Math.min(availableCount, (config.questionTypes || []).length)} questions (1 per selected type).</>
                  )}
                  {(config.questionTypes || []).length === 0 && (
                    <> You'll practice up to 5 questions (1 per type).</>
                  )}
                </p>
              </div>
            )}

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {TIME_LIMIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfig({ ...config, timeLimit: option.value })}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      config.timeLimit === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleStartSession}
                disabled={loading || !config.courseId || availableCount === 0}
                className="flex-1"
              >
                {loading ? 'Starting...' : 'Start Practice Session'}
              </Button>
              <Button
                onClick={handleResumeSession}
                disabled={checkingSession}
                variant="secondary"
              >
                {checkingSession ? 'Checking...' : 'Resume Active'}
              </Button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/practice/history')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Practice History →
              </button>
            </div>
          </div>
        </Card>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Practice Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Start with shorter sessions (15-30 mins) to build consistency</li>
            <li>• Focus on specific topics to master concepts systematically</li>
            <li>• Mix question types to prepare for diverse exam formats</li>
            <li>• Review your answers after each session to reinforce learning</li>
            <li>• Practice sessions are risk-free - experiment and learn without penalty</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}

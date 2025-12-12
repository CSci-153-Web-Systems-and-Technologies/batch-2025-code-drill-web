'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Template {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  duration_minutes: number;
  total_points: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string | null;
  points: number;
  order_index: number;
  difficulty_level: string;
  tags: string[] | null;
}

interface Props {
  template: Template;
  questions: Question[];
}

export default function ExamPreviewClient({ template, questions }: Props) {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
            {template.description && (
              <p className="mt-2 text-gray-600">{template.description}</p>
            )}
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
            Preview Mode
          </span>
        </div>
      </div>

      {/* Template Info */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Exam Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-lg font-medium capitalize">{template.exam_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-medium">{template.duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Points</p>
              <p className="text-lg font-medium">{template.total_points} points</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Questions Preview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Questions ({questions.length})
        </h2>
        
        {questions.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <p className="text-gray-500">No questions added to this template yet.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <div className="p-6">
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-2">
                          {question.question_text}
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                            {question.question_type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded capitalize ${
                            question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty_level}
                          </span>
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex gap-1">
                              {question.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {question.points} pts
                    </span>
                  </div>

                  {/* Question Options (for multiple choice) */}
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="ml-11 space-y-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-3 rounded border ${
                            question.correct_answer === key
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <span className="font-medium">{key}.</span> {value as string}
                          {question.correct_answer === key && (
                            <span className="ml-2 text-green-600 text-sm font-semibold">
                              ✓ Correct Answer
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer for other types */}
                  {question.question_type !== 'multiple_choice' && question.correct_answer && (
                    <div className="ml-11 mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-gray-600 mb-1">Expected Answer:</p>
                      <p className="text-gray-900 font-medium">{question.correct_answer}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-gray-500">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {questions.reduce((sum, q) => sum + q.points, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {questions.filter(q => q.question_type === 'coding').length}
              </div>
              <div className="text-sm text-gray-500">Coding Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {questions.filter(q => q.question_type === 'multiple_choice').length}
              </div>
              <div className="text-sm text-gray-500">Multiple Choice</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

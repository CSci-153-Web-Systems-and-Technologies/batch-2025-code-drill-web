'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  difficulty_level: string;
  tags: string[] | null;
  created_at: string;
}

interface Props {
  courseId: string;
}

export default function QuestionsTab({ courseId }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/questions?course_id=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const questionData = {
          course_id: courseId,
          question_text: formData.get('question_text') as string,
          question_type: formData.get('question_type') as string,
          points: parseInt(formData.get('points') as string),
          difficulty_level: formData.get('difficulty_level') as string,
          tags: formData.get('tags') 
            ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)
            : null,
        };

        const response = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionData),
        });

        if (response.ok) {
          setShowAddModal(false);
          fetchQuestions();
        }
      } catch (error) {
        console.error('Error creating question:', error);
      }
    });
  };

  const handleCloneQuestion = async (questionId: string) => {
    if (!confirm('Clone this question to the current course?')) return;
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/questions/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: questionId,
            target_course_id: courseId,
          }),
        });

        if (response.ok) {
          alert('Question cloned successfully!');
          fetchQuestions();
        }
      } catch (error) {
        console.error('Error cloning question:', error);
      }
    });
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || q.question_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Loading questions...</div>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Questions</h2>
        <Button onClick={() => setShowAddModal(true)}>+ Add Question</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="coding">Coding</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'No questions match your filters' 
                : 'No questions created yet'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>Create First Question</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium line-clamp-2">
                      {question.question_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {question.points} pts
                    </span>
                    <button
                      onClick={() => handleCloneQuestion(question.id)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                    >
                      Clone
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
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
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddQuestion}
          isPending={isPending}
        />
      )}
    </div>
  );
}

interface ModalProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

function AddQuestionModal({ onClose, onSubmit, isPending }: ModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Add Question</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <textarea
                name="question_text"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type *
              </label>
              <select
                name="question_type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="coding">Coding</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points *
                </label>
                <input
                  type="number"
                  name="points"
                  defaultValue={10}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty *
                </label>
                <select
                  name="difficulty_level"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                placeholder="e.g., arrays, loops, recursion"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Question'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

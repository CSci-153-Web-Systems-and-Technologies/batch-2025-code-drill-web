'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import BulkActionsToolbar from '@/app/admin/exams/BulkActionsToolbar';
import { deleteQuestion } from '@/app/professor-exams/actions';

interface Question {
  id: string;
  title: string;
  question_type: string;
  difficulty: string;
  points: number;
  is_published: boolean;
  question_number: number;
  template_id: string;
}

interface QuestionsListProps {
  courseId: string;
  templateId?: string;
}

export default function QuestionsList({ courseId, templateId }: QuestionsListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [templateId, courseId]);

  async function loadQuestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (templateId) params.append('templateId', templateId);
      if (courseId) params.append('courseId', courseId);
      
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQuestions(data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleQuestion(id: string) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setSelectedQuestions(prev =>
      prev.length === questions.length ? [] : questions.map(q => q.id)
    );
  }

  async function handleDelete(questionId: string) {
    setDeleting(true);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        setDeleteConfirm(null);
        loadQuestions();
      } else {
        alert(`Failed to delete question: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred while deleting the question');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Card><p className="text-gray-400">Loading questions...</p></Card>;
  }

  if (questions.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No questions yet</p>
          <Link href={`/admin/exams/questions/new?courseId=${courseId}`}>
            <Button>Create Question</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <BulkActionsToolbar
        selectedQuestions={selectedQuestions}
        questions={questions}
        onActionComplete={() => {
          setSelectedQuestions([]);
          loadQuestions();
        }}
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Questions</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={toggleAll}>
              {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Link href={`/admin/exams/questions/new?courseId=${courseId}`}>
              <Button>Add Question</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          {questions.map(q => (
            <div
              key={q.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                selectedQuestions.includes(q.id)
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedQuestions.includes(q.id)}
                onChange={() => toggleQuestion(q.id)}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm text-gray-400">Q{q.question_number}</span>
                  <h3 className="text-white font-semibold">{q.title}</h3>
                  <span className="text-xs text-gray-500 capitalize">
                    {q.question_type?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded ${
                    q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    q.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="text-gray-400">{q.points} pts</span>
                  <span className={`px-2 py-0.5 rounded ${
                    q.is_published
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {q.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/exams/questions/${q.id}/edit`}>
                  <Button variant="secondary" className="text-sm">Edit</Button>
                </Link>
                <Link href={`/professor-exams/preview/${q.id}`}>
                  <Button variant="secondary" className="text-sm">Preview</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm({ id: q.id, title: q.title })}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Question?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteConfirm.title}"</span>?
              This will also delete all version history and preview tokens. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

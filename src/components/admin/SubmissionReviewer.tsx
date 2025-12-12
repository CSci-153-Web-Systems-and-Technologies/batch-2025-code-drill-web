'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Submission = {
  id: string;
  user_id: string;
  question_id: string;
  blank_answers: any;
  output_answer: string | null;
  essay_answer: string | null;
  is_correct: boolean | null;
  points_earned: number | null;
  submitted_at: string;
  graded_at: string | null;
  feedback: string | null;
  users: { name: string; email: string };
  exam_questions: {
    title: string;
    question_type: string;
    points: number;
  };
};

export function SubmissionReviewer({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [courseId]);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);
      params.append('status', 'pending');

      const res = await fetch(`/api/admin/submissions?${params}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrade() {
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_earned: pointsEarned,
          feedback,
          is_correct: pointsEarned >= (selectedSubmission.exam_questions.points * 0.7),
        }),
      });

      if (res.ok) {
        setSelectedSubmission(null);
        setPointsEarned(0);
        setFeedback('');
        loadSubmissions();
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to grade submission:', error);
    } finally {
      setGrading(false);
    }
  }

  if (loading) {
    return <Card><p className="text-gray-600">Loading submissions...</p></Card>;
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending submissions</h3>
          <p className="text-gray-600">All submissions have been graded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Submissions ({submissions.length})</h2>
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelectedSubmission(submission);
                setPointsEarned(submission.exam_questions.points);
                setFeedback('');
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{submission.exam_questions.title}</h3>
                  <p className="text-sm text-gray-600">{submission.users.name} ({submission.users.email})</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {submission.exam_questions.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSubmission.exam_questions.title}</h3>
                <p className="text-sm text-gray-600">{selectedSubmission.users.name}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Student Answer:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {selectedSubmission.essay_answer && (
                  <pre className="whitespace-pre-wrap text-sm text-gray-900">{selectedSubmission.essay_answer}</pre>
                )}
                {selectedSubmission.output_answer && (
                  <pre className="whitespace-pre-wrap text-sm text-gray-900">{selectedSubmission.output_answer}</pre>
                )}
                {selectedSubmission.blank_answers && (
                  <pre className="text-sm text-gray-900">{JSON.stringify(selectedSubmission.blank_answers, null, 2)}</pre>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Points Earned (out of {selectedSubmission.exam_questions.points})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedSubmission.exam_questions.points}
                  value={pointsEarned}
                  onChange={(e) => setPointsEarned(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback (optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Provide feedback to the student..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                Cancel
              </Button>
              <Button onClick={handleGrade} disabled={grading}>
                {grading ? 'Grading...' : 'Submit Grade'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

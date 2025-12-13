'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { gradeEssayAnswer } from '@/app/professor-exams/actions';

type Submission = {
  answer_id: string;
  student_name: string;
  student_email: string;
  question_title: string;
  question_type: string;
  essay_answer: string | null;
  word_count: number | null;
  submitted_at: string;
  max_points: number;
  essay_requirements: any;
  points_earned: number | null;
  reviewer_feedback: string | null;
  graded_at: string | null;
  graded_by_name: string | null;
};

type Props = {
  courseId: string;
  initialPendingSubmissions: Submission[];
  initialGradedSubmissions: Submission[];
};

export default function SubmissionGradingInterface({ 
  courseId,
  initialPendingSubmissions,
  initialGradedSubmissions 
}: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'graded'>('pending');
  const [pendingSubmissions, setPendingSubmissions] = useState(initialPendingSubmissions);
  const [gradedSubmissions, setGradedSubmissions] = useState(initialGradedSubmissions);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGradeSubmission = async (submission: Submission) => {
    setGradingSubmissionId(submission.answer_id);
    setPointsAwarded(0);
    setFeedback('');
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmissionId) return;

    setIsSubmitting(true);
    try {
      const result = await gradeEssayAnswer({
        answerId: gradingSubmissionId,
        pointsAwarded,
        feedback,
      });

      if (result.success) {
        // Move submission from pending to graded
        const graded = pendingSubmissions.find(s => s.answer_id === gradingSubmissionId);
        if (graded) {
          setPendingSubmissions(prev => prev.filter(s => s.answer_id !== gradingSubmissionId));
          setGradedSubmissions(prev => [{
            ...graded,
            points_earned: pointsAwarded,
            reviewer_feedback: feedback,
            graded_at: new Date().toISOString(),
          }, ...prev]);
        }
        
        // Close grading modal
        setGradingSubmissionId(null);
        setPointsAwarded(0);
        setFeedback('');
      }
    } catch (error) {
      console.error('Failed to grade submission:', error);
      alert('Failed to save grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSubmission = pendingSubmissions.find(s => s.answer_id === gradingSubmissionId);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Pending ({pendingSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('graded')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'graded'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Graded ({gradedSubmissions.length})
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {activeTab === 'pending' && pendingSubmissions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">All caught up!</h3>
              <p className="text-gray-400">No submissions pending review</p>
            </div>
          </Card>
        )}

        {activeTab === 'pending' && pendingSubmissions.map((submission) => (
          <Card key={submission.answer_id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{submission.question_title}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                    {submission.question_type?.replace('_', ' ') || 'Essay'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-400 mb-1">
                  Student: {submission.student_name} ({submission.student_email})
                </p>
                
                <p className="text-sm text-gray-500 mb-3">
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </p>

                {submission.essay_answer && (
                  <div className="mt-3 p-4 bg-gray-800/50 rounded border border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{submission.essay_answer}</p>
                    <p className="text-xs text-gray-500 mt-2">{submission.word_count} words</p>
                  </div>
                )}
              </div>

              <div className="ml-4 text-right">
                <p className="text-sm text-gray-400 mb-2">Max: {submission.max_points} pts</p>
                <Button onClick={() => handleGradeSubmission(submission)}>
                  Grade
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {activeTab === 'graded' && gradedSubmissions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No graded submissions yet</h3>
              <p className="text-gray-400">Grade pending submissions to see them here</p>
            </div>
          </Card>
        )}

        {activeTab === 'graded' && gradedSubmissions.map((submission) => (
          <Card key={submission.answer_id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{submission.question_title}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                    {submission.question_type?.replace('_', ' ') || 'Essay'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-400 mb-1">
                  Student: {submission.student_name} ({submission.student_email})
                </p>
                
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Graded: {submission.graded_at ? new Date(submission.graded_at).toLocaleString() : 'N/A'}
                  {submission.graded_by_name && ` by ${submission.graded_by_name}`}
                </p>

                {submission.essay_answer && (
                  <div className="mt-3 p-4 bg-gray-800/50 rounded border border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">{submission.essay_answer}</p>
                    <p className="text-xs text-gray-500 mt-2">{submission.word_count} words</p>
                  </div>
                )}

                {submission.reviewer_feedback && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-sm font-medium text-blue-400 mb-1">Feedback:</p>
                    <p className="text-sm text-gray-300">{submission.reviewer_feedback}</p>
                  </div>
                )}
              </div>

              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-green-400">
                  {submission.points_earned}/{submission.max_points}
                </div>
                <p className="text-xs text-gray-400 mt-1">points</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Grading Modal */}
      {gradingSubmissionId && currentSubmission && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Grade Submission</h2>
                  <p className="text-gray-400">{currentSubmission.question_title}</p>
                  <p className="text-sm text-gray-500">
                    Student: {currentSubmission.student_name}
                  </p>
                </div>
                <button
                  onClick={() => setGradingSubmissionId(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Student Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student Answer ({currentSubmission.word_count} words)
                  </label>
                  <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {currentSubmission.essay_answer}
                    </p>
                  </div>
                </div>

                {/* Points Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Points Awarded (Max: {currentSubmission.max_points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={currentSubmission.max_points}
                    value={pointsAwarded}
                    onChange={(e) => setPointsAwarded(Math.min(currentSubmission.max_points, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    placeholder="Provide constructive feedback to help the student improve..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setGradingSubmissionId(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveGrade}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Grade'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

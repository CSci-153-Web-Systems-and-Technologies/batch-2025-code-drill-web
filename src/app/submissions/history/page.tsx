'use server';

import { redirect } from 'next/navigation';
import { getStudentSubmissionHistory } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';

export default async function SubmissionHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  let submissions = [];
  let error = null;
  
  try {
    submissions = await getStudentSubmissionHistory();
  } catch (e: any) {
    error = e.message;
    console.error('Failed to fetch submissions:', e);
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Submissions</h1>
        <p className="text-gray-400">View all your submitted answers and grades</p>
      </div>

      {error && (
        <Card className="mb-4 border-red-500/50 bg-red-500/10">
          <div className="p-4">
            <h3 className="text-red-400 font-semibold mb-2">Error Loading Submissions</h3>
            <p className="text-gray-300 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Please make sure the database migration has been applied. Check the console for more details.
            </p>
          </div>
        </Card>
      )}

      {submissions.length === 0 && !error ? (
        <Card>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No submissions yet</h3>
            <p className="text-gray-400">Start practicing questions to see your submissions here</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission: any) => (
            <Card key={submission.answer_id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{submission.question_title}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                      {submission.question_type_category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-1">
                    {submission.course_code} - {submission.course_name}
                  </p>
                  
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </p>

                  {submission.essay_answer && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                      <p className="text-sm text-gray-300 line-clamp-3">{submission.essay_answer}</p>
                      <p className="text-xs text-gray-500 mt-1">{submission.word_count} words</p>
                    </div>
                  )}

                  {submission.reviewer_feedback && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <p className="text-sm font-medium text-blue-400 mb-1">Professor Feedback:</p>
                      <p className="text-sm text-gray-300">{submission.reviewer_feedback}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right">
                  {submission.manually_reviewed ? (
                    <div>
                      <div className={`text-2xl font-bold ${submission.is_correct ? 'text-green-400' : 'text-yellow-400'}`}>
                        {submission.points_earned}/{submission.max_points}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Graded</p>
                      {submission.graded_at && (
                        <p className="text-xs text-gray-500">{new Date(submission.graded_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : submission.requires_grading ? (
                    <div>
                      <div className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded text-sm font-medium">
                        Pending Review
                      </div>
                      <p className="text-xs text-gray-500 mt-1">0/{submission.max_points} pts</p>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-2xl font-bold ${submission.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                        {submission.points_earned}/{submission.max_points}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Auto-graded</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

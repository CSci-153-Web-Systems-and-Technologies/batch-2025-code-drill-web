import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth-roles';
import Container from '@/components/shared/Container';
import { SubmissionReviewer } from '@/components/admin/SubmissionReviewer';

export default async function SubmissionsPage() {
  const user = await getCurrentUserWithRole();

  if (!user || (user.role !== 'professor' && user.role !== 'admin')) {
    redirect('/login');
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Reviewer</h1>
        <p className="text-gray-600">Review and grade student submissions</p>
      </div>

      <SubmissionReviewer />
    </Container>
  );
}

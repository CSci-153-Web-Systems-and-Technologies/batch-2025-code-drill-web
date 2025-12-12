import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth-roles';
import Container from '@/components/shared/Container';
import { StudentAnalyticsDashboard } from '@/components/admin/StudentAnalyticsDashboard';

export default async function AnalyticsPage() {
  const user = await getCurrentUserWithRole();

  if (!user || (user.role !== 'professor' && user.role !== 'admin')) {
    redirect('/login');
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Analytics</h1>
        <p className="text-gray-600">Track student performance and progress</p>
      </div>

      <StudentAnalyticsDashboard />
    </Container>
  );
}

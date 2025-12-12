import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth-roles';
import Container from '@/components/shared/Container';
import { ClassRoster } from '@/components/admin/ClassRoster';

export default async function RosterPage() {
  const user = await getCurrentUserWithRole();

  if (!user || (user.role !== 'professor' && user.role !== 'admin')) {
    redirect('/login');
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Roster</h1>
        <p className="text-gray-600">View and manage enrolled students</p>
      </div>

      <ClassRoster />
    </Container>
  );
}

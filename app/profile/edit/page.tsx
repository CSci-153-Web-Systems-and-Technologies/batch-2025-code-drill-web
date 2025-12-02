import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Container from '@/components/shared/Container';
import { EditProfileForm } from '@/components/profile/EditProfileForm';

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Container className="py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your personal information</p>
      </div>

      <EditProfileForm user={user} />
    </Container>
  );
}

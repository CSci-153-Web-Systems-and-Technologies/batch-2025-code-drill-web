import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Container from '@/components/shared/Container';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileActivity } from '@/components/profile/ProfileActivity';
import { ProfessorStats } from '@/components/profile/ProfessorStats';
import { StreakCalendar } from '@/components/streaks/StreakCalendar';
import { StreakStats } from '@/components/streaks/StreakStats';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isProfessor = user.role === 'professor' || user.role === 'admin';

  return (
    <Container className="py-8">
      <ProfileHeader user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Column - Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {isProfessor ? (
            <>
              <ProfessorStats userId={user.id} />
              {/* Professor Activity could be added here */}
            </>
          ) : (
            <>
              <ProfileStats userId={user.id} />
              <StreakCalendar />
              <ProfileActivity userId={user.id} />
            </>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {!isProfessor && <StreakStats />}
        </div>
      </div>
    </Container>
  );
}

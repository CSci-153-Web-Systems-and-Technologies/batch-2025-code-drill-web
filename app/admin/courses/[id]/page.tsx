import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CourseManagementClient from './CourseManagementClient';

interface Props {
  params: {
    id: string;
  };
}

export default async function CourseManagementPage({ params }: Props) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    redirect('/');
  }

  // Fetch the course
  const { data: course } = await supabase
    .from('professor_courses')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!course) {
    redirect('/admin/courses');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourseManagementClient course={course} />
    </div>
  );
}

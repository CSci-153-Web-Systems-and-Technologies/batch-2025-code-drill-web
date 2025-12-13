import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isProfessor } from '@/lib/auth-roles';
import { getSubmissionsForGrading } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import SubmissionGradingInterface from '@/components/admin/SubmissionGradingInterface';

export default async function CourseSubmissionsPage({ 
  params 
}: { 
  params: { courseId: string } 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !(await isProfessor())) {
    redirect('/');
  }

  const courseId = params.courseId;

  // Fetch course details
  const { data: course } = await supabase
    .from('professor_courses')
    .select('course_code, name')
    .eq('id', courseId)
    .single();

  if (!course) {
    redirect('/professor-exams');
  }

  // Get pending submissions by default
  const pendingSubmissions = await getSubmissionsForGrading(courseId, undefined, 'ungraded');
  const gradedSubmissions = await getSubmissionsForGrading(courseId, undefined, 'graded');

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Grade Submissions - {course.course_code}
        </h1>
        <p className="text-gray-400">{course.name}</p>
      </div>

      <SubmissionGradingInterface 
        courseId={courseId}
        initialPendingSubmissions={pendingSubmissions}
        initialGradedSubmissions={gradedSubmissions}
      />
    </Container>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isProfessor } from '@/lib/auth-roles';
import { getSubmissionsForGrading } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default async function AllSubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !(await isProfessor())) {
    redirect('/');
  }

  // Get all courses for this professor
  const { data: courses } = await supabase
    .from('professor_courses')
    .select('id, course_code, name')
    .eq('professor_id', user.id)
    .order('course_code');

  // Get submission counts for each course
  const coursesWithCounts = await Promise.all(
    (courses || []).map(async (course) => {
      const pendingSubmissions = await getSubmissionsForGrading(course.id, undefined, 'ungraded');
      const gradedSubmissions = await getSubmissionsForGrading(course.id, undefined, 'graded');
      
      return {
        ...course,
        pendingCount: pendingSubmissions.length,
        gradedCount: gradedSubmissions.length,
      };
    })
  );

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Grade Submissions</h1>
        <p className="text-gray-400">Review and grade student submissions across your courses</p>
      </div>

      {coursesWithCounts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-400">Create a course to start receiving submissions</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coursesWithCounts.map((course) => (
            <Card key={course.id} className="hover:border-blue-500 transition-colors">
              <Link href={`/professor-exams/${course.id}/submissions`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{course.course_code}</h3>
                    <p className="text-gray-400">{course.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {course.pendingCount > 0 && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400">{course.pendingCount}</div>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{course.gradedCount}</div>
                      <p className="text-xs text-gray-400">Graded</p>
                    </div>
                    
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

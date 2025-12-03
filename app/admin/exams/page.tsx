import { redirect } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getCourses } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default async function AdminExamsPage() {
  // Check professor role
  const user = await checkProfessorRole();
  if (!user) {
    redirect('/professor-exams');
  }

  // Get all courses
  const courses = await getCourses();

  return (
    <Container>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Exam Management Dashboard
        </h1>
        <p className="text-gray-400">
          Manage courses, templates, and questions. Create, edit, publish, and share exam content.
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/exams/courses/new">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Course
            </Button>
          </Link>
          <Link href="/admin/exams/templates/new">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Create Template
            </Button>
          </Link>
          <Link href="/admin/exams/questions/new">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Create Question
            </Button>
          </Link>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Courses</h2>
        {courses.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-gray-400 mb-4">No courses yet</p>
              <Link href="/admin/exams/courses/new">
                <Button>Create Your First Course</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {course.course_code}
                    </h3>
                    <p className="text-gray-400 text-sm">{course.name}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      course.difficulty === 'Easy'
                        ? 'bg-green-500/20 text-green-400'
                        : course.difficulty === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {course.difficulty}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {course.professor_name}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    {course.student_count} students
                  </div>
                  <div className="flex items-center text-sm text-gray-400 capitalize">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {course.exam_style?.replace('-', ' ')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/exams/courses/${course.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Manage
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/courses/${course.id}/questions`} className="flex-1">
                    <Button className="w-full">
                      Questions
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <Card className="bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Need Help?
            </h3>
            <p className="text-sm text-gray-400">
              Learn how to create and manage exam questions effectively
            </p>
          </div>
          <Button variant="secondary">
            View Documentation
          </Button>
        </div>
      </Card>
    </Container>
  );
}

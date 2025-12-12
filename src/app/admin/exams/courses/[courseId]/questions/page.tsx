import { redirect, notFound } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getCourseById } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import QuestionsList from './QuestionsList';

interface CourseQuestionsPageProps {
  params: { courseId: string };
}

export default async function CourseQuestionsPage({ params }: CourseQuestionsPageProps) {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const course = await getCourseById(params.courseId);
  if (!course) notFound();

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {course.course_code} - Questions
        </h1>
        <p className="text-gray-400">{course.name}</p>
      </div>

      <QuestionsList courseId={params.courseId} />
    </Container>
  );
}

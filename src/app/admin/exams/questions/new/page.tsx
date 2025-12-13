import { redirect, notFound } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getCourseById, createQuestion } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import QuestionForm from '@/components/admin/QuestionForm';

interface NewQuestionPageProps {
  searchParams: { courseId?: string };
}

export default async function NewQuestionPage({ searchParams }: NewQuestionPageProps) {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const { courseId } = searchParams;

  // If no courseId, redirect to admin dashboard to select course
  if (!courseId) {
    redirect('/admin/exams');
  }

  const course = await getCourseById(courseId);
  if (!course) notFound();

  async function handleSubmit(data: any) {
    'use server';
    
    const result = await createQuestion(data);
    
    if (result.success) {
      redirect(`/admin/exams/courses/${courseId}/questions`);
    }
    
    return result;
  }

  async function handleCancel() {
    'use server';
    redirect(`/admin/exams/courses/${courseId}/questions`);
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Create New Question</h1>
        <p className="text-gray-400">
          {course.course_code} - {course.name}
        </p>
      </div>

      <QuestionForm
        courseId={courseId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEdit={false}
      />
    </Container>
  );
}

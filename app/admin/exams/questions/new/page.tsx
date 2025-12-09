import { redirect, notFound } from 'next/navigation';
import { checkProfessorRole } from '@/lib/auth-roles';
import { getCourseById, getCourseExamTemplates, createQuestion } from '@/app/professor-exams/actions';
import Container from '@/components/shared/Container';
import QuestionForm from '@/components/admin/QuestionForm';

interface NewQuestionPageProps {
  searchParams: { courseId?: string; templateId?: string };
}

export default async function NewQuestionPage({ searchParams }: NewQuestionPageProps) {
  const user = await checkProfessorRole();
  if (!user) redirect('/professor-exams');

  const { courseId, templateId } = searchParams;

  // If no courseId, redirect to admin dashboard to select course
  if (!courseId) {
    redirect('/admin/exams');
  }

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const templates = await getCourseExamTemplates(courseId);

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

      {templates.length === 0 ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
          <p className="text-yellow-300 mb-4">
            No exam templates found for this course. Please create a template first.
          </p>
          <a 
            href={`/admin/exams/courses/${courseId}/templates/new`}
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Template
          </a>
        </div>
      ) : !templateId ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Exam Template</h2>
          <p className="text-gray-400 mb-4">Choose which exam this question belongs to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <a
                key={template.id}
                href={`/admin/exams/questions/new?courseId=${courseId}&templateId=${template.id}`}
                className="block p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
              >
                <h3 className="text-white font-semibold mb-1">{template.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{template.exam_type.replace('_', ' ')}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{template.duration_minutes} min</span>
                  <span>{template.question_count} questions</span>
                  <span>{template.total_points} pts</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <QuestionForm
          templateId={templateId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={false}
        />
      )}
    </Container>
  );
}

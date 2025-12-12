import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseById, getCourseExamTemplates, getCourseStats } from '../actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Props = {
  params: {
    courseId: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const course = await getCourseById(params.courseId);
    return {
      title: `${course.course_code} - Professor Exams | CodeDrill`,
      description: `Practice exams for ${course.name}`,
    };
  } catch {
    return {
      title: 'Course Not Found | CodeDrill',
    };
  }
}

export default async function CourseExamsPage({ params }: Props) {
  try {
    const course = await getCourseById(params.courseId);
    const templates = await getCourseExamTemplates(params.courseId);
    const stats = await getCourseStats(params.courseId);

    // Group templates by exam type
    const codeAnalysis = templates.find(t => t.exam_type === 'code_analysis');
    const outputTracing = templates.find(t => t.exam_type === 'output_tracing');
    const essay = templates.find(t => t.exam_type === 'essay');

    return (
      <Container className="py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Course Header */}
            <div className="mb-8">
              <Link 
                href="/professor-exams" 
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Courses
              </Link>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{course.course_code}</h1>
                  <p className="text-xl text-gray-300 mb-2">{course.name}</p>
                  <p className="text-gray-400">{course.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

              <div className="flex items-center gap-6 mt-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{course.professor_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{course.semester}</span>
                </div>
              </div>
            </div>

            {/* Exam Type Cards */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Choose Exam Type</h2>

              {/* Code Analysis Exam */}
              {codeAnalysis && (
                <Link href={`/professor-exams/${params.courseId}/code-analysis/${codeAnalysis.id}`}>
                  <Card className="hover:border-blue-500 transition-colors cursor-pointer bg-blue-500/5">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-400 mb-2">Code Analysis</h3>
                        <p className="text-gray-400 mb-4">
                          {codeAnalysis.description || 'Fill in missing parts of code given snippets and expected outputs'}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>~{codeAnalysis.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{codeAnalysis.question_count} questions</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {codeAnalysis.progress && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-gray-400">
                                {codeAnalysis.progress.questions_completed}/{codeAnalysis.progress.total_questions}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(codeAnalysis.progress.questions_completed / codeAnalysis.progress.total_questions) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Avg Accuracy: {codeAnalysis.progress.accuracy.toFixed(0)}%
                            </p>
                          </div>
                        )}

                        <Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
                          {codeAnalysis.progress ? 'Continue Exam' : 'Start Exam'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Output Tracing Exam */}
              {outputTracing && (
                <Link href={`/professor-exams/${params.courseId}/output-tracing/${outputTracing.id}`}>
                  <Card className="hover:border-green-500 transition-colors cursor-pointer bg-green-500/5">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-400 mb-2">Output Tracing</h3>
                        <p className="text-gray-400 mb-4">
                          {outputTracing.description || 'Write the expected program output for given code snippets'}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>~{outputTracing.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{outputTracing.question_count} questions</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {outputTracing.progress && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-gray-400">
                                {outputTracing.progress.questions_completed}/{outputTracing.progress.total_questions}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(outputTracing.progress.questions_completed / outputTracing.progress.total_questions) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Avg Accuracy: {outputTracing.progress.accuracy.toFixed(0)}%
                            </p>
                          </div>
                        )}

                        <Button variant="primary" className="bg-green-600 hover:bg-green-700">
                          {outputTracing.progress ? 'Continue Exam' : 'Start Exam'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Essay Questions Exam */}
              {essay && (
                <Link href={`/professor-exams/${params.courseId}/essay/${essay.id}`}>
                  <Card className="hover:border-purple-500 transition-colors cursor-pointer bg-purple-500/5">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-purple-400 mb-2">Essay Questions</h3>
                        <p className="text-gray-400 mb-4">
                          {essay.description || 'Answer conceptual questions about programming logic and best practices'}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>~{essay.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{essay.question_count} questions</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {essay.progress && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-gray-400">
                                {essay.progress.questions_completed}/{essay.progress.total_questions}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(essay.progress.questions_completed / essay.progress.total_questions) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Questions Completed
                            </p>
                          </div>
                        )}

                        <Button variant="primary" className="bg-purple-600 hover:bg-purple-700">
                          {essay.progress ? 'Continue Exam' : 'Start Exam'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Course Stats */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Your Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Exams</span>
                  <span className="font-bold">{stats.total_exams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="font-bold text-green-400">{stats.completed_exams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Accuracy</span>
                  <span className="font-bold text-blue-400">{stats.avg_accuracy.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Spent</span>
                  <span className="font-bold">{stats.total_time_spent_minutes} min</span>
                </div>
              </div>
            </Card>

            {/* Quick Tips */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Read code carefully and trace through logic step by step</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">•</span>
                  <span>Pay attention to syntax and formatting in your answers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Take your time to understand the question before answering</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Use hints strategically when you need guidance</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </Container>
    );
  } catch {
    notFound();
  }
}

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseById, getCourseQuestionStats, getCourseStats } from '../actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { QuestionTypeCategory } from '@/types/professor-exam';

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
    const questionStats = await getCourseQuestionStats(params.courseId);
    const stats = await getCourseStats(params.courseId);

    // Define question type categories with their display info
    const questionTypes: Array<{
      category: QuestionTypeCategory;
      title: string;
      description: string;
      color: string;
      icon: React.ReactNode;
    }> = [
      {
        category: 'code_analysis',
        title: 'Code Analysis',
        description: 'Fill in missing parts of code given snippets and expected outputs',
        color: 'blue',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
      },
      {
        category: 'output_tracing',
        title: 'Output Tracing',
        description: 'Write the expected program output for given code snippets',
        color: 'green',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        category: 'essay',
        title: 'Essay Questions',
        description: 'Answer conceptual questions about programming logic and best practices',
        color: 'purple',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
      {
        category: 'multiple_choice',
        title: 'Multiple Choice',
        description: 'Select the correct answer from multiple options',
        color: 'yellow',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        category: 'true_false',
        title: 'True/False',
        description: 'Determine if statements about code and concepts are true or false',
        color: 'orange',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        ),
      },
    ];

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
              <h2 className="text-xl font-bold">Choose Question Type</h2>

              {questionTypes.map((type) => {
                const stat = questionStats?.find((s: any) => s.question_type_category === type.category);
                const questionCount = stat?.published_questions || 0;

                // Skip if no questions for this type
                if (questionCount === 0) return null;

                return (
                  <Link key={type.category} href={`/professor-exams/${params.courseId}/${type.category}`}>
                    <Card className={`hover:border-${type.color}-500 transition-colors cursor-pointer bg-${type.color}-500/5`}>
                      <div className="flex items-start gap-6">
                        {/* Icon */}
                        <div className={`w-16 h-16 bg-${type.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-${type.color}-400`}>
                          {type.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold text-${type.color}-400 mb-2`}>{type.title}</h3>
                          <p className="text-gray-400 mb-4">{type.description}</p>

                          <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{questionCount} questions</span>
                            </div>
                          </div>

                          <Button variant="primary" className={`bg-${type.color}-600 hover:bg-${type.color}-700`}>
                            Start Practice
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
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

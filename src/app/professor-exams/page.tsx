import { Metadata } from 'next';
import Link from 'next/link';
import { getCourses } from './actions';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Professor Exams | CodeDrill',
  description: 'Practice with professor-style exam questions',
};

export default async function ProfessorExamsPage() {
  const courses = await getCourses(true);

  return (
    <Container className="py-8">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Professor Exams</h1>
            <p className="text-gray-400">
              Practice with real exam-style questions from various courses
            </p>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/professor-exams/${course.id}`}>
                <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{course.course_code}</h3>
                        <p className="text-gray-300">{course.name}</p>
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

                    {/* Description */}
                    {course.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Course Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{course.professor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{course.student_count} students</span>
                      </div>
                    </div>

                    {/* Exam Style */}
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-400">Exam Style:</span>
                      <span className="font-semibold text-blue-400">
                        {course.exam_style === 'code-heavy'
                          ? 'Code Heavy'
                          : course.exam_style === 'design-patterns'
                          ? 'Design Patterns'
                          : 'Balanced'}
                      </span>
                    </div>

                    {/* Progress Summary */}
                    {(course.code_analysis_progress || course.output_tracing_progress || course.essay_progress) && (
                      <div className="pt-4 border-t border-gray-700 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Your Progress</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {course.code_analysis_progress && (
                            <div className="text-center">
                              <div className="text-blue-400 font-bold">
                                {course.code_analysis_progress.completed}/{course.code_analysis_progress.total}
                              </div>
                              <div className="text-gray-500">Code</div>
                            </div>
                          )}
                          {course.output_tracing_progress && (
                            <div className="text-center">
                              <div className="text-green-400 font-bold">
                                {course.output_tracing_progress.completed}/{course.output_tracing_progress.total}
                              </div>
                              <div className="text-gray-500">Output</div>
                            </div>
                          )}
                          {course.essay_progress && (
                            <div className="text-center">
                              <div className="text-purple-400 font-bold">
                                {course.essay_progress.completed}/{course.essay_progress.total}
                              </div>
                              <div className="text-gray-500">Essay</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {courses.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-gray-400">No courses available yet.</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Progress Summary Card */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Overall Progress</h3>
            <div className="space-y-4">
              {(() => {
                const codeTotal = courses.reduce((sum, c) => sum + (c.code_analysis_progress?.total || 0), 0);
                const codeCompleted = courses.reduce((sum, c) => sum + (c.code_analysis_progress?.completed || 0), 0);
                const codeAvg = courses.filter(c => c.code_analysis_progress).length > 0
                  ? courses.reduce((sum, c) => sum + (c.code_analysis_progress?.accuracy || 0), 0) / courses.filter(c => c.code_analysis_progress).length
                  : 0;

                const outputTotal = courses.reduce((sum, c) => sum + (c.output_tracing_progress?.total || 0), 0);
                const outputCompleted = courses.reduce((sum, c) => sum + (c.output_tracing_progress?.completed || 0), 0);
                const outputAvg = courses.filter(c => c.output_tracing_progress).length > 0
                  ? courses.reduce((sum, c) => sum + (c.output_tracing_progress?.accuracy || 0), 0) / courses.filter(c => c.output_tracing_progress).length
                  : 0;

                const essayTotal = courses.reduce((sum, c) => sum + (c.essay_progress?.total || 0), 0);
                const essayCompleted = courses.reduce((sum, c) => sum + (c.essay_progress?.completed || 0), 0);
                const essayAvg = courses.filter(c => c.essay_progress).length > 0
                  ? courses.reduce((sum, c) => sum + (c.essay_progress?.accuracy || 0), 0) / courses.filter(c => c.essay_progress).length
                  : 0;

                return (
                  <>
                    {codeTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-400 font-semibold">Code Analysis</span>
                          <span className="text-gray-400">{codeCompleted}/{codeTotal}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${codeTotal > 0 ? (codeCompleted / codeTotal) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Avg: {codeAvg.toFixed(0)}%</p>
                      </div>
                    )}

                    {outputTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-400 font-semibold">Output Tracing</span>
                          <span className="text-gray-400">{outputCompleted}/{outputTotal}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${outputTotal > 0 ? (outputCompleted / outputTotal) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Avg: {outputAvg.toFixed(0)}%</p>
                      </div>
                    )}

                    {essayTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-purple-400 font-semibold">Essay Questions</span>
                          <span className="text-gray-400">{essayCompleted}/{essayTotal}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${essayTotal > 0 ? (essayCompleted / essayTotal) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Avg: {essayAvg.toFixed(0)}%</p>
                      </div>
                    )}

                    {codeTotal === 0 && outputTotal === 0 && essayTotal === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        Start an exam to see your progress
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Quick Tips Card */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Code Analysis tests your ability to fill in missing code</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>Output Tracing checks if you can predict program output</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Essay questions assess your understanding of concepts</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Use hints if you&apos;re stuck, but try without them first</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>Practice regularly to improve your accuracy</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}

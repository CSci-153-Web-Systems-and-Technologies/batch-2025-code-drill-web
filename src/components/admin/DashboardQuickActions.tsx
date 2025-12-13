'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type Course = {
  id: string;
  course_code: string;
  name: string;
};

export function DashboardQuickActions() {
  const router = useRouter();
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [templateCourseId, setTemplateCourseId] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateExamType, setTemplateExamType] = useState<'code_analysis' | 'output_tracing' | 'essay'>('code_analysis');
  const [templateDuration, setTemplateDuration] = useState(60);
  const [templateTotalPoints, setTemplateTotalPoints] = useState(100);
  const [templateInstructions, setTemplateInstructions] = useState('');
  const [isPendingCourse, startCourseTransition] = useTransition();
  const [isPendingTemplate, startTemplateTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const resetCourseForm = () => {
    setCourseCode('');
    setCourseName('');
    setCourseDescription('');
    setError(null);
  };

  const resetTemplateForm = () => {
    setTemplateCourseId('');
    setTemplateTitle('');
    setTemplateDescription('');
    setTemplateExamType('code_analysis');
    setTemplateDuration(60);
    setTemplateTotalPoints(100);
    setTemplateInstructions('');
    setTemplateError(null);
  };

  useEffect(() => {
    if (!openTemplateModal) return;

    const fetchCourses = async () => {
      setCoursesLoading(true);
      setTemplateError(null);
      try {
        const res = await fetch('/api/admin/courses');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load courses');
        }
        const body = await res.json();
        setCourses(body.courses || []);
      } catch (err: any) {
        setTemplateError(err.message || 'Unexpected error');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [openTemplateModal]);

  const handleCreateCourse = async () => {
    setError(null);
    startCourseTransition(async () => {
      try {
        const res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_code: courseCode,
            name: courseName,
            description: courseDescription,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to create course');
        }

        resetCourseForm();
        setOpenCourseModal(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Unexpected error');
      }
    });
  };

  const handleCreateTemplate = async () => {
    setTemplateError(null);
    startTemplateTransition(async () => {
      try {
        const res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: templateCourseId,
            title: templateTitle,
            description: templateDescription || null,
            exam_type: templateExamType,
            duration_minutes: templateDuration,
            total_points: templateTotalPoints,
            instructions: templateInstructions || null,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to create exam template');
        }

        resetTemplateForm();
        setOpenTemplateModal(false);
        router.refresh();
      } catch (err: any) {
        setTemplateError(err.message || 'Unexpected error');
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="w-full" onClick={() => setOpenCourseModal(true)}>
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Course
        </Button>
        <Button className="w-full" variant="outline" onClick={() => setOpenTemplateModal(true)}>
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Exam Template
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => router.push('/professor-exams/submissions')}
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Submissions
        </Button>
      </div>

      {openCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create New Course</h3>
                <p className="text-sm text-gray-600">Add a course to manage exams and submissions.</p>
              </div>
              <button
                onClick={() => setOpenCourseModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Code</label>
                <input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Introduction to CS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Short course description"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => { resetCourseForm(); setOpenCourseModal(false); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse} disabled={isPendingCourse || !courseCode || !courseName}>
                {isPendingCourse ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Exam Template</h3>
                <p className="text-sm text-gray-600">Design a template to reuse across exams for this course.</p>
              </div>
              <button
                onClick={() => setOpenTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course</label>
                  <select
                    value={templateCourseId}
                    onChange={(e) => setTemplateCourseId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">{coursesLoading ? 'Loading courses...' : 'Select a course'}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} — {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Midterm Practice Set"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                  <select
                    value={templateExamType}
                    onChange={(e) => setTemplateExamType(e.target.value as typeof templateExamType)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="code_analysis">Code Analysis</option>
                    <option value="output_tracing">Output Tracing</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={templateDuration}
                      onChange={(e) => setTemplateDuration(Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Points</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={templateTotalPoints}
                      onChange={(e) => setTemplateTotalPoints(Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="What this template covers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructions (optional)</label>
                  <textarea
                    value={templateInstructions}
                    onChange={(e) => setTemplateInstructions(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Guidance for students"
                  />
                </div>
              </div>
            </div>

            {templateError && <p className="text-sm text-red-600">{templateError}</p>}
            {!coursesLoading && courses.length === 0 && (
              <p className="text-sm text-amber-600">Add a course first before creating a template.</p>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => { resetTemplateForm(); setOpenTemplateModal(false); }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={
                  isPendingTemplate ||
                  !templateCourseId ||
                  !templateTitle ||
                  templateDuration < 5 ||
                  templateTotalPoints < 1 ||
                  courses.length === 0
                }
              >
                {isPendingTemplate ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
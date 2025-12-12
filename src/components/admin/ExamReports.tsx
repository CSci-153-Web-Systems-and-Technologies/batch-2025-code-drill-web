'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';

type QuestionStat = {
  question_id: string;
  question_number: number;
  title: string;
  question_type: string;
  difficulty: string;
  points: number;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  avgPoints: number;
  difficultyIndex: number;
  discriminationIndex: number;
};

type ExamReport = {
  templateId: string | null;
  courseId: string | null;
  totalQuestions: number;
  totalAttempts: number;
  avgCorrectRate: number;
  questions: QuestionStat[];
};

type Course = {
  id: string;
  course_code: string;
  name: string;
};

type Template = {
  id: string;
  title: string;
  exam_type: string;
};

export function ExamReports() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [report, setReport] = useState<ExamReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadTemplates();
    } else {
      setTemplates([]);
      setSelectedTemplate('');
    }
  }, [selectedCourse]);

  async function loadCourses() {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch(`/api/admin/templates?course_id=${selectedCourse}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  async function loadReport() {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?template_id=${selectedTemplate}`);
      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficultyIndex: number) => {
    if (difficultyIndex >= 70) return 'text-green-600';
    if (difficultyIndex >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDiscriminationLabel = (discriminationIndex: number) => {
    if (discriminationIndex >= 40) return { label: 'Excellent', color: 'text-green-600' };
    if (discriminationIndex >= 30) return { label: 'Good', color: 'text-blue-600' };
    if (discriminationIndex >= 20) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Item Analysis Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} — {course.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={!selectedCourse}
            >
              <option value="">Choose a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} ({template.exam_type})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={!selectedTemplate || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </Card>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900">{report.totalQuestions}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-blue-600">{report.totalAttempts}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Avg Correct Rate</p>
                <p className="text-3xl font-bold text-green-600">{report.avgCorrectRate.toFixed(1)}%</p>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Item Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Q#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Title</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Attempts</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Correct %</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Avg Points</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Difficulty</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Discrimination</th>
                  </tr>
                </thead>
                <tbody>
                  {report.questions.map((q) => {
                    const discLabel = getDiscriminationLabel(q.discriminationIndex);
                    return (
                      <tr key={q.question_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{q.question_number}</td>
                        <td className="py-3 px-4 text-gray-900">{q.title}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">{q.question_type}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{q.totalAttempts}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-semibold ${getDifficultyColor(q.correctRate)}`}>
                            {q.correctRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {q.avgPoints.toFixed(1)} / {q.points}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-semibold ${getDifficultyColor(q.difficultyIndex)}`}>
                            {q.difficultyIndex.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-semibold ${discLabel.color}`}>
                            {q.discriminationIndex.toFixed(0)}%
                          </span>
                          <div className="text-xs text-gray-500">{discLabel.label}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Understanding the Metrics</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Difficulty Index:</strong> % of students who answered correctly (higher = easier)</li>
                <li><strong>Discrimination Index:</strong> Ability to differentiate high/low performers (higher = better)</li>
                <li><strong>Good items:</strong> Difficulty 30-70%, Discrimination &gt; 30%</li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card>
          <div className="text-center py-12 text-gray-600">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Select a course and template to generate an item analysis report</p>
          </div>
        </Card>
      )}
    </div>
  );
}

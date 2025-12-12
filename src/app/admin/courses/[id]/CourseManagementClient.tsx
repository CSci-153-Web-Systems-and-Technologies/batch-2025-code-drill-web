'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import TemplatesTab from './TemplatesTab';
import QuestionsTab from './QuestionsTab';

interface Course {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Props {
  course: Course;
}

type Tab = 'templates' | 'questions' | 'students' | 'settings';

export default function CourseManagementClient({ course }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('templates');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'templates', label: 'Exam Templates', icon: '📋' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/courses')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
        {course.description && (
          <p className="mt-2 text-gray-600">{course.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'templates' && <TemplatesTab courseId={course.id} />}
        {activeTab === 'questions' && <QuestionsTab courseId={course.id} />}
        {activeTab === 'students' && <StudentsTab courseId={course.id} />}
        {activeTab === 'settings' && <SettingsTab course={course} />}
      </div>
    </div>
  );
}

// Placeholder components for tabs
function StudentsTab({ courseId }: { courseId: string }) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Students</h2>
        <p className="text-gray-600">Student management will be implemented here.</p>
      </div>
    </Card>
  );
}

function SettingsTab({ course }: { course: Course }) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Course Settings</h2>
        <p className="text-gray-600">Course settings will be implemented here.</p>
      </div>
    </Card>
  );
}

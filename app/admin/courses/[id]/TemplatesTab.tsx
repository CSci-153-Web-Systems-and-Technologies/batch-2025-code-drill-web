'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Template {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  duration_minutes: number;
  total_points: number;
  created_at: string;
}

interface Props {
  courseId: string;
}

export default function TemplatesTab({ courseId }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchTemplates();
  }, [courseId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/admin/templates?course_id=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const templateData = {
          course_id: courseId,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          exam_type: formData.get('exam_type') as string,
          duration_minutes: parseInt(formData.get('duration_minutes') as string),
          total_points: parseInt(formData.get('total_points') as string),
        };

        const response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData),
        });

        if (response.ok) {
          setShowAddModal(false);
          fetchTemplates();
        }
      } catch (error) {
        console.error('Error creating template:', error);
      }
    });
  };

  const handleCloneTemplate = async (templateId: string) => {
    if (!confirm('Clone this template to the current course?')) return;
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/templates/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: templateId,
            target_course_id: courseId,
          }),
        });

        if (response.ok) {
          alert('Template cloned successfully!');
          fetchTemplates();
        }
      } catch (error) {
        console.error('Error cloning template:', error);
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Loading templates...</div>
      </Card>
    );
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Exam Templates</h2>
        <Button onClick={() => setShowAddModal(true)}>+ Add Template</Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No templates created yet</p>
            <Button onClick={() => setShowAddModal(true)}>Create First Template</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.title}
                </h3>
                {template.description && (
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                )}
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{template.exam_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium">{template.duration_minutes} min</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Points:</span>
                    <p className="font-medium">{template.total_points}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCloneTemplate(template.id)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Clone Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Template Modal */}
      {showAddModal && (
        <AddTemplateModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTemplate}
          isPending={isPending}
        />
      )}
    </div>
  );
}

interface ModalProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

function AddTemplateModal({ onClose, onSubmit, isPending }: ModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Add Exam Template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Type *
              </label>
              <select
                name="exam_type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="coding">Coding</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  defaultValue={60}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Points *
                </label>
                <input
                  type="number"
                  name="total_points"
                  defaultValue={100}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

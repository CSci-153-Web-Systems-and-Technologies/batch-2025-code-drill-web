'use client';

import React, { useState } from 'react';
import { Question, questionSchema } from '@/lib/validations/question-schemas';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FillInBlanksForm from './question-types/FillInBlanksForm';
import OutputTracingForm from './question-types/OutputTracingForm';
import EssayForm from './question-types/EssayForm';
import { MultipleChoiceForm } from './question-types/MultipleChoiceForm';
import { TrueFalseForm } from './question-types/TrueFalseForm';
import { IdentificationForm } from './question-types/IdentificationForm';

interface QuestionFormProps {
  initialData?: Partial<Question> & { id?: string; course_id?: string; question_type_category?: string };
  courseId: string;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string; questionId?: string }>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function QuestionForm({ 
  initialData, 
  courseId,
  onSubmit, 
  onCancel,
  isEdit = false 
}: QuestionFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    question_text: initialData?.question_text || '',
    question_type_category: initialData?.question_type_category || ('code_analysis' as const),
    question_type: initialData?.question_type || ('fill_blanks' as const),
    difficulty: initialData?.difficulty || ('Easy' as const),
    points: initialData?.points || 10,
    hints: initialData?.hints || [],
    time_estimate_minutes: initialData?.time_estimate_minutes || 5,
    
    // Type-specific fields
    code_snippet: initialData?.code_snippet || null,
    blanks: initialData?.blanks || null,
    expected_output: initialData?.expected_output || null,
    output_tips: initialData?.output_tips || null,
    essay_context: initialData?.essay_context || null,
    essay_requirements: initialData?.essay_requirements || null,
    essay_structure_guide: initialData?.essay_structure_guide || null,
    
    // New question type fields
    choices: initialData?.choices || null,
    correct_answer: initialData?.correct_answer || null,
    correct_boolean: initialData?.correct_boolean || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleBaseFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeSpecificChange = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    setErrors({});

    // Validate with Zod
    const validation = questionSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    // Prepare submission data
    const submitData = {
      ...validation.data,
      ...(initialData?.id && { id: initialData.id }),
      course_id: courseId,
      question_type_category: formData.question_type_category,
    };

    try {
      const result = await onSubmit(submitData);
      if (!result.success) {
        setSubmitError(result.error || 'Failed to save question');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Card className="bg-red-500/10 border-red-500/50">
          <p className="text-red-400">{submitError}</p>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleBaseFieldChange('title', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="E.g., Array Sum Function"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Question Type Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.question_type_category}
              onChange={(e) => {
                const category = e.target.value as any;
                // Auto-map category to appropriate question_type
                let question_type = formData.question_type;
                if (category === 'code_analysis') question_type = 'fill_blanks';
                else if (category === 'output_tracing') question_type = 'trace_output';
                else if (category === 'essay') question_type = 'essay';
                else if (category === 'multiple_choice') question_type = 'multiple_choice';
                else if (category === 'true_false') question_type = 'true_false';
                
                setFormData(prev => ({ 
                  ...prev, 
                  question_type_category: category,
                  question_type: question_type
                }));
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="code_analysis">Code Analysis (Fill in the Blanks)</option>
              <option value="output_tracing">Output Tracing</option>
              <option value="essay">Essay</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
            </select>
            {errors.question_type_category && <p className="text-red-400 text-sm mt-1">{errors.question_type_category}</p>}
          </div>

          {/* Difficulty and Points Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleBaseFieldChange('difficulty', e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              {errors.difficulty && <p className="text-red-400 text-sm mt-1">{errors.difficulty}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Points <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => handleBaseFieldChange('points', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              {errors.points && <p className="text-red-400 text-sm mt-1">{errors.points}</p>}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => handleBaseFieldChange('question_text', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter the question description..."
            />
            {errors.question_text && <p className="text-red-400 text-sm mt-1">{errors.question_text}</p>}
          </div>

          {/* Time Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.time_estimate_minutes || ''}
              onChange={(e) => handleBaseFieldChange('time_estimate_minutes', e.target.value ? parseInt(e.target.value) : null)}
              min="1"
              max="180"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            {errors.time_estimate_minutes && <p className="text-red-400 text-sm mt-1">{errors.time_estimate_minutes}</p>}
          </div>
        </div>
      </Card>

      {/* Type-Specific Form Section */}
      {formData.question_type_category === 'code_analysis' && (
        <FillInBlanksForm
          data={{
            code_snippet: formData.code_snippet,
            blanks: formData.blanks,
            expected_output: formData.expected_output,
            output_tips: formData.output_tips,
          }}
          onChange={handleTypeSpecificChange}
          errors={errors}
        />
      )}

      {formData.question_type_category === 'output_tracing' && (
        <OutputTracingForm
          data={{
            code_snippet: formData.code_snippet,
            expected_output: formData.expected_output,
            output_tips: formData.output_tips,
          }}
          onChange={handleTypeSpecificChange}
          errors={errors}
        />
      )}

      {formData.question_type_category === 'essay' && (
        <EssayForm
          data={{
            essay_context: formData.essay_context,
            essay_requirements: formData.essay_requirements,
            essay_structure_guide: formData.essay_structure_guide,
          }}
          onChange={handleTypeSpecificChange}
          errors={errors}
        />
      )}

      {formData.question_type_category === 'multiple_choice' && (
        <Card>
          <h2 className="text-xl font-semibold text-white mb-4">Multiple Choice Options</h2>
          <MultipleChoiceForm
            choices={formData.choices || undefined}
            correctAnswer={formData.correct_answer || undefined}
            onChange={(choices, correctAnswer) => {
              handleTypeSpecificChange({
                choices,
                correct_answer: correctAnswer,
                // Clear other type-specific fields
                blanks: null,
                expected_output: null,
                output_tips: null,
                essay_context: null,
                essay_requirements: null,
                essay_structure_guide: null,
                correct_boolean: null,
              });
            }}
          />
          {errors.choices && <p className="text-red-400 text-sm mt-2">{errors.choices}</p>}
          {errors.correct_answer && <p className="text-red-400 text-sm mt-2">{errors.correct_answer}</p>}
        </Card>
      )}

      {formData.question_type_category === 'true_false' && (
        <Card>
          <h2 className="text-xl font-semibold text-white mb-4">True/False Answer</h2>
          <TrueFalseForm
            correctAnswer={formData.correct_boolean !== null ? formData.correct_boolean : undefined}
            onChange={(correctBoolean) => {
              handleTypeSpecificChange({
                correct_boolean: correctBoolean,
                // Clear other type-specific fields
                blanks: null,
                expected_output: null,
                output_tips: null,
                essay_context: null,
                essay_requirements: null,
                essay_structure_guide: null,
                choices: null,
                correct_answer: null,
              });
            }}
          />
          {errors.correct_boolean && <p className="text-red-400 text-sm mt-2">{errors.correct_boolean}</p>}
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}

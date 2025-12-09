'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionForm from '@/components/admin/QuestionForm';
import { updateQuestion } from '@/app/professor-exams/actions';

interface EditQuestionFormProps {
  question: any;
  courseId: string;
}

export default function EditQuestionForm({ question, courseId }: EditQuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: any) {
    setIsSubmitting(true);
    try {
      const result = await updateQuestion({ ...data, id: question.id });
      
      if (result.success) {
        router.push(`/admin/exams/courses/${courseId}/questions`);
        router.refresh();
      }
      
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push(`/admin/exams/courses/${courseId}/questions`);
  }

  return (
    <QuestionForm
      initialData={question}
      templateId={question.template_id}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isEdit={true}
    />
  );
}

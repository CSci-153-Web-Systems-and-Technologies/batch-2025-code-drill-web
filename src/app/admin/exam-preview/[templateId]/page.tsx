import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ExamPreviewClient from './ExamPreviewClient';

interface Props {
  params: {
    templateId: string;
  };
}

export default async function ExamPreviewPage({ params }: Props) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
    redirect('/');
  }

  // Fetch the template
  const { data: template } = await supabase
    .from('exam_templates')
    .select('*')
    .eq('id', params.templateId)
    .single();

  if (!template) {
    redirect('/admin/courses');
  }

  // Fetch questions for this template
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('template_id', params.templateId)
    .order('order_index', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamPreviewClient template={template} questions={questions || []} />
    </div>
  );
}

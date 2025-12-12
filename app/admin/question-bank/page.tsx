import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuestionBankClient from './QuestionBankClient';

export default async function QuestionBankPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-2 text-gray-600">Browse and manage your reusable question library</p>
        </div>
        
        <QuestionBankClient />
      </div>
    </div>
  );
}

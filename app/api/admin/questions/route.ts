import { NextResponse } from 'next/server';
import { getQuestionsWithPublishStatus } from '@/app/professor-exams/actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId') || undefined;
  const publishedOnly = searchParams.get('publishedOnly') === 'true';

  const questions = await getQuestionsWithPublishStatus(templateId, publishedOnly);
  return NextResponse.json(questions);
}

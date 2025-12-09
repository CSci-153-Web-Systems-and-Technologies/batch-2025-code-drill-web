import { NextResponse } from 'next/server';
import { getQuestionsWithPublishStatus } from '@/app/professor-exams/actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;
  const publishedOnly = searchParams.get('publishedOnly') === 'true';

  const questions = await getQuestionsWithPublishStatus(templateId, publishedOnly, courseId);
  return NextResponse.json(questions);
}

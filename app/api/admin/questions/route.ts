import { NextResponse } from 'next/server';
import { getQuestionsWithPublishStatus, createQuestion, updateQuestion } from '@/app/professor-exams/actions';
import { validateCreateQuestion, validateUpdateQuestion } from '@/lib/validations/question-schemas';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;
  const publishedOnly = searchParams.get('publishedOnly') === 'true';

  const questions = await getQuestionsWithPublishStatus(templateId, publishedOnly, courseId);
  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateCreateQuestion(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    // Create question
    const result = await createQuestion(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/questions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateUpdateQuestion(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    // Update question
    const result = await updateQuestion(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/admin/questions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

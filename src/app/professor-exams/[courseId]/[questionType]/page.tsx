import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QuestionPracticeClient from './QuestionPracticeClient';
import { QuestionTypeCategory } from '@/types/professor-exam';

type Props = {
  params: {
    courseId: string;
    questionType: string;
  };
};

const VALID_QUESTION_TYPES: QuestionTypeCategory[] = [
  'code_analysis',
  'output_tracing',
  'essay',
  'multiple_choice',
  'true_false',
];

const QUESTION_TYPE_TITLES: Record<QuestionTypeCategory, string> = {
  code_analysis: 'Code Analysis',
  output_tracing: 'Output Tracing',
  essay: 'Essay Questions',
  multiple_choice: 'Multiple Choice',
  true_false: 'True/False',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const questionType = params.questionType as QuestionTypeCategory;
  
  if (!VALID_QUESTION_TYPES.includes(questionType)) {
    return {
      title: 'Not Found | CodeDrill',
    };
  }

  return {
    title: `${QUESTION_TYPE_TITLES[questionType]} | CodeDrill`,
    description: `Practice ${QUESTION_TYPE_TITLES[questionType].toLowerCase()} questions`,
  };
}

export default function QuestionPracticePage({ params }: Props) {
  const questionType = params.questionType as QuestionTypeCategory;

  // Validate question type
  if (!VALID_QUESTION_TYPES.includes(questionType)) {
    notFound();
  }

  return (
    <QuestionPracticeClient
      courseId={params.courseId}
      questionType={questionType}
    />
  );
}

import { Metadata } from 'next';
import ExamClient from './ExamClient';

type Props = {
  params: {
    courseId: string;
    templateId: string;
  };
};

export const metadata: Metadata = {
  title: 'Essay Questions Exam | CodeDrill',
  description: 'Answer conceptual questions with detailed essays',
};

export default function EssayExamPage({ params }: Props) {
  return <ExamClient courseId={params.courseId} templateId={params.templateId} />;
}

import { Metadata } from 'next';
import ExamClient from './ExamClient';

type Props = {
  params: {
    courseId: string;
    templateId: string;
  };
};

export const metadata: Metadata = {
  title: 'Code Analysis Exam | CodeDrill',
  description: 'Fill in the blanks to complete the code',
};

export default function CodeAnalysisExamPage({ params }: Props) {
  return <ExamClient courseId={params.courseId} templateId={params.templateId} />;
}

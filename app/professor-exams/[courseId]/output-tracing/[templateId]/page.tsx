import { Metadata } from 'next';
import ExamClient from './ExamClient';

type Props = {
  params: {
    courseId: string;
    templateId: string;
  };
};

export const metadata: Metadata = {
  title: 'Output Tracing Exam | CodeDrill',
  description: 'Predict the program output',
};

export default function OutputTracingExamPage({ params }: Props) {
  return <ExamClient courseId={params.courseId} templateId={params.templateId} />;
}

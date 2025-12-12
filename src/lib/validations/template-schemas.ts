import { z } from 'zod';

const examTypes = ['code_analysis', 'output_tracing', 'essay'] as const;

export const createTemplateSchema = z.object({
  course_id: z.string().uuid('course_id must be a valid UUID'),
  exam_type: z.enum(examTypes, {
    errorMap: () => ({ message: 'exam_type must be code_analysis, output_tracing, or essay' }),
  }),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(5000).optional().nullable(),
  duration_minutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(240, 'Duration cannot exceed 240 minutes').default(60),
  question_count: z.number().int().min(0).default(0),
  total_points: z.number().int().min(1, 'Total points must be at least 1').max(500, 'Total points cannot exceed 500').default(100),
  instructions: z.string().max(5000).optional().nullable(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
import { z } from 'zod';

// Base schema for common question fields
export const baseQuestionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  question_text: z.string().min(10, 'Question text must be at least 10 characters'),
  question_type: z.enum(['fill_blanks', 'trace_output', 'essay']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  points: z.number().min(1, 'Points must be at least 1').max(100, 'Points cannot exceed 100'),
  hints: z.array(z.string()).optional(),
  time_estimate_minutes: z.number().min(1).max(180).optional(),
});

// Fill-in-the-blanks (Code Analysis) schema
export const fillInBlanksSchema = baseQuestionSchema.extend({
  question_type: z.literal('fill_blanks'),
  code_snippet: z.string().min(10, 'Code snippet is required for fill-in-the-blanks questions'),
  blanks: z.record(z.string(), z.string()).refine(
    (blanks) => Object.keys(blanks).length > 0,
    { message: 'At least one blank is required' }
  ),
  expected_output: z.string().optional(),
  output_tips: z.array(z.string()).optional(),
  essay_context: z.null().optional(),
  essay_requirements: z.null().optional(),
  essay_structure_guide: z.null().optional(),
});

// Output tracing schema
export const outputTracingSchema = baseQuestionSchema.extend({
  question_type: z.literal('trace_output'),
  code_snippet: z.string().min(10, 'Code snippet is required for output tracing questions'),
  expected_output: z.string().min(1, 'Expected output is required'),
  output_tips: z.array(z.string()).optional(),
  blanks: z.null().optional(),
  essay_context: z.null().optional(),
  essay_requirements: z.null().optional(),
  essay_structure_guide: z.null().optional(),
});

// Essay question schema
export const essaySchema = baseQuestionSchema.extend({
  question_type: z.literal('essay'),
  essay_context: z.string().min(10, 'Essay context is required'),
  essay_requirements: z.object({
    word_count: z.tuple([
      z.number().min(50, 'Minimum word count must be at least 50'),
      z.number().max(5000, 'Maximum word count cannot exceed 5000')
    ]).refine(
      ([min, max]) => min < max,
      { message: 'Minimum word count must be less than maximum' }
    ),
    key_concepts: z.array(z.string()).min(1, 'At least one key concept is required'),
    examples_required: z.boolean(),
  }),
  essay_structure_guide: z.string().optional(),
  code_snippet: z.null().optional(),
  blanks: z.null().optional(),
  expected_output: z.null().optional(),
  output_tips: z.null().optional(),
});

// Combined discriminated union schema for all question types
export const questionSchema = z.discriminatedUnion('question_type', [
  fillInBlanksSchema,
  outputTracingSchema,
  essaySchema,
]);

// Schema for creating a new question (includes template_id)
export const createQuestionSchema = z.object({
  template_id: z.string().uuid('Invalid template ID'),
  question_number: z.number().int().positive().optional(), // Auto-generated if not provided
}).and(questionSchema);

// Schema for updating a question (makes all fields optional except id and question_type)
export const updateQuestionSchema = z.object({
  id: z.string().uuid('Invalid question ID'),
  template_id: z.string().uuid().optional(),
  question_number: z.number().int().positive().optional(),
  title: z.string().min(3).max(200).optional(),
  question_text: z.string().min(10).optional(),
  question_type: z.enum(['fill_blanks', 'trace_output', 'essay']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  points: z.number().min(1).max(100).optional(),
  code_snippet: z.string().nullable().optional(),
  blanks: z.record(z.string(), z.string()).nullable().optional(),
  expected_output: z.string().nullable().optional(),
  output_tips: z.array(z.string()).nullable().optional(),
  essay_context: z.string().nullable().optional(),
  essay_requirements: z.object({
    word_count: z.tuple([z.number(), z.number()]),
    key_concepts: z.array(z.string()),
    examples_required: z.boolean(),
  }).nullable().optional(),
  essay_structure_guide: z.string().nullable().optional(),
  hints: z.array(z.string()).optional(),
  time_estimate_minutes: z.number().min(1).max(180).optional(),
});

// Type exports
export type BaseQuestion = z.infer<typeof baseQuestionSchema>;
export type FillInBlanksQuestion = z.infer<typeof fillInBlanksSchema>;
export type OutputTracingQuestion = z.infer<typeof outputTracingSchema>;
export type EssayQuestion = z.infer<typeof essaySchema>;
export type Question = z.infer<typeof questionSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

// Helper function to validate question data
export function validateQuestion(data: unknown) {
  return questionSchema.safeParse(data);
}

// Helper function to validate create question data
export function validateCreateQuestion(data: unknown) {
  return createQuestionSchema.safeParse(data);
}

// Helper function to validate update question data
export function validateUpdateQuestion(data: unknown) {
  return updateQuestionSchema.safeParse(data);
}

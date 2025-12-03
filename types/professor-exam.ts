// Professor Exam System Types
// Defines interfaces for course-based exam simulation with three types

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ExamStyle = 'code-heavy' | 'design-patterns' | 'balanced';
export type ExamType = 'code_analysis' | 'output_tracing' | 'essay';
export type QuestionType = 'fill_blanks' | 'trace_output' | 'essay';
export type ProgressStatus = 'in_progress' | 'completed' | 'abandoned';

// ============================================================================
// COURSE INTERFACES
// ============================================================================

export interface ProfessorCourse {
  id: string;
  course_code: string;
  name: string;
  description: string | null;
  professor_name: string;
  semester: string;
  student_count: number;
  exam_style: ExamStyle;
  difficulty: DifficultyLevel;
  created_at: string;
  updated_at: string;
}

export interface ExamTemplate {
  id: string;
  course_id: string;
  exam_type: ExamType;
  title: string;
  description: string | null;
  duration_minutes: number;
  question_count: number;
  total_points: number;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUESTION INTERFACES
// ============================================================================

export interface BlankDefinition {
  blank_number: number;
  expected: string;
  hint?: string;
}

export interface EssayRequirements {
  word_count: [number, number]; // [min, max]
  key_concepts: string[];
  examples_required: boolean;
}

export interface ExamQuestion {
  id: string;
  template_id: string;
  question_number: number;
  title: string;
  question_text: string;
  question_type: QuestionType;
  
  // For code analysis and output tracing
  code_snippet: string | null;
  
  // For fill-in-the-blanks (code analysis)
  blanks: Record<string, string> | null; // { "1": "expected_answer", "2": "expected_answer" }
  
  // For output tracing
  expected_output: string | null;
  output_tips: string[] | null;
  
  // For essay questions
  essay_context: string | null;
  essay_requirements: EssayRequirements | null;
  essay_structure_guide: string | null;
  
  points: number;
  difficulty: DifficultyLevel | null;
  hints: string[] | null;
  time_estimate_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROGRESS & ANSWER INTERFACES
// ============================================================================

export interface UserExamProgress {
  id: string;
  user_id: string;
  course_id: string;
  template_id: string;
  
  questions_completed: number;
  total_questions: number;
  correct_answers: number;
  total_points: number;
  max_points: number;
  accuracy: number;
  
  started_at: string;
  last_practiced_at: string;
  completed_at: string | null;
  time_spent_seconds: number;
  
  status: ProgressStatus;
  created_at: string;
  updated_at: string;
}

export interface UserExamAnswer {
  id: string;
  user_id: string;
  question_id: string;
  progress_id: string;
  
  // For fill-in-the-blanks
  blank_answers: Record<string, string> | null; // { "1": "user_answer", "2": "user_answer" }
  
  // For output tracing
  output_answer: string | null;
  
  // For essay questions
  essay_answer: string | null;
  word_count: number | null;
  
  is_correct: boolean | null;
  points_earned: number;
  auto_graded: boolean;
  manually_reviewed: boolean;
  reviewer_feedback: string | null;
  
  hints_used: number;
  time_spent_seconds: number;
  attempt_count: number;
  
  first_attempted_at: string | null;
  last_attempted_at: string;
  submitted_at: string | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES (WITH JOINS)
// ============================================================================

export interface ExamTemplateWithProgress extends ExamTemplate {
  progress?: UserExamProgress;
}

export interface CourseWithProgress extends ProfessorCourse {
  code_analysis_progress?: {
    completed: number;
    total: number;
    accuracy: number;
  };
  output_tracing_progress?: {
    completed: number;
    total: number;
    accuracy: number;
  };
  essay_progress?: {
    completed: number;
    total: number;
    accuracy: number;
  };
}

export interface ExamQuestionWithAnswer extends ExamQuestion {
  user_answer?: UserExamAnswer;
}

export interface ExamSessionData {
  template: ExamTemplate;
  questions: ExamQuestion[];
  progress: UserExamProgress;
  answers: UserExamAnswer[];
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface BlankAnswerInput {
  [blankNumber: string]: string; // { "1": "user answer", "2": "user answer" }
}

export interface OutputAnswerInput {
  output: string;
}

export interface EssayAnswerInput {
  essay: string;
  word_count: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AnswerCheckResult {
  is_correct: boolean;
  points_earned: number;
  answer_id: string;
}

export interface ExamResults {
  progress: UserExamProgress;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  total_points: number;
  max_points: number;
  accuracy: number;
  time_spent_minutes: number;
  status: ProgressStatus;
}

export interface CourseStats {
  course: ProfessorCourse;
  total_exams: number;
  completed_exams: number;
  avg_accuracy: number;
  total_time_spent_minutes: number;
}

// ============================================================================
// VERSIONING INTERFACES
// ============================================================================

export interface QuestionVersion {
  id: string;
  question_id: string;
  version_number: number;
  question_data: Record<string, any>; // JSONB snapshot of question fields
  changed_by: string; // User ID
  changed_at: string;
  change_description: string | null;
  created_at: string;
}

export interface QuestionVersionWithUser extends QuestionVersion {
  user_name: string | null;
  user_email: string | null;
}

export interface VersionComparison {
  field: string;
  old_value: any;
  new_value: any;
  changed: boolean;
}

export interface QuestionWithVersions extends ExamQuestion {
  versions: QuestionVersion[];
  current_version: number;
  total_versions: number;
}

// ============================================================================
// PREVIEW TOKEN INTERFACES
// ============================================================================

export interface PreviewToken {
  id: string;
  token: string;
  question_id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  allowed_views: number;
  view_count: number;
  is_active: boolean;
  notes: string | null;
}

export interface PreviewTokenWithQuestion extends PreviewToken {
  question: ExamQuestion;
  creator_name: string | null;
  creator_email: string | null;
}

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  question_id?: string;
  views_remaining?: number;
}

// ============================================================================
// PUBLISH STATUS INTERFACES
// ============================================================================

export interface QuestionWithPublishStatus extends ExamQuestion {
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  publisher_name?: string | null;
}

export interface PublishResult {
  success: boolean;
  message?: string;
  error?: string;
  published_count?: number;
  unpublished_count?: number;
}

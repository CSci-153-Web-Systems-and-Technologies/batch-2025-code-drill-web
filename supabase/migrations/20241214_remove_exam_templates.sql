-- Remove Exam Templates System Migration
-- This migration restructures the exam system to manage questions directly by type
-- under courses without the intermediate exam_templates table

-- Step 1: Create question_type_category ENUM
CREATE TYPE question_type_category AS ENUM (
  'code_analysis',
  'output_tracing', 
  'essay',
  'multiple_choice',
  'true_false'
);

-- Step 2: Add new columns to exam_questions
ALTER TABLE exam_questions 
  ADD COLUMN course_id UUID REFERENCES professor_courses(id) ON DELETE CASCADE,
  ADD COLUMN question_type_category question_type_category;

-- Step 3: Migrate data - Set course_id from template's course_id
-- and map question_type_category based on question_type
UPDATE exam_questions eq
SET 
  course_id = et.course_id,
  question_type_category = CASE 
    WHEN eq.question_type = 'fill_blanks' THEN 'code_analysis'::question_type_category
    WHEN eq.question_type = 'trace_output' THEN 'output_tracing'::question_type_category
    WHEN eq.question_type = 'essay' THEN 'essay'::question_type_category
    WHEN eq.question_type = 'multiple_choice' THEN 'multiple_choice'::question_type_category
    WHEN eq.question_type = 'true_false' THEN 'true_false'::question_type_category
    ELSE 'code_analysis'::question_type_category -- default fallback
  END
FROM exam_templates et
WHERE eq.template_id = et.id;

-- Step 4: Make new columns NOT NULL after data migration
ALTER TABLE exam_questions 
  ALTER COLUMN course_id SET NOT NULL,
  ALTER COLUMN question_type_category SET NOT NULL;

-- Step 5: Create index on new columns for performance
CREATE INDEX idx_exam_questions_course ON exam_questions(course_id);
CREATE INDEX idx_exam_questions_category ON exam_questions(question_type_category);
CREATE INDEX idx_exam_questions_course_category ON exam_questions(course_id, question_type_category);

-- Step 6: Update user_exam_progress table structure
-- Add course_id and question_type_category, migrate data
ALTER TABLE user_exam_progress
  ADD COLUMN course_id UUID REFERENCES professor_courses(id) ON DELETE CASCADE,
  ADD COLUMN question_type_category question_type_category;

-- Migrate user_exam_progress data
UPDATE user_exam_progress uep
SET 
  course_id = et.course_id,
  question_type_category = et.exam_type::question_type_category
FROM exam_templates et
WHERE uep.template_id = et.id;

-- Make new columns NOT NULL
ALTER TABLE user_exam_progress
  ALTER COLUMN course_id SET NOT NULL,
  ALTER COLUMN question_type_category SET NOT NULL;

-- Create new composite unique constraint
CREATE UNIQUE INDEX idx_user_exam_progress_course_type 
  ON user_exam_progress(user_id, course_id, question_type_category);

-- Step 7: Drop old template_id foreign key constraints
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_template_id_fkey;
ALTER TABLE user_exam_progress DROP CONSTRAINT IF EXISTS user_exam_progress_template_id_fkey;
ALTER TABLE user_exam_answers DROP CONSTRAINT IF EXISTS user_exam_answers_template_id_fkey;

-- Step 8: Drop old columns
ALTER TABLE exam_questions DROP COLUMN IF EXISTS template_id;
ALTER TABLE user_exam_progress DROP COLUMN IF EXISTS template_id;
ALTER TABLE user_exam_answers DROP COLUMN IF EXISTS template_id;

-- Step 9: Drop the exam_templates table
DROP TABLE IF EXISTS exam_templates CASCADE;

-- Step 10: Update RLS policies for exam_questions
DROP POLICY IF EXISTS "Users can view published questions" ON exam_questions;
DROP POLICY IF EXISTS "Professors can manage their questions" ON exam_questions;

CREATE POLICY "Users can view published questions"
  ON exam_questions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Professors can manage questions in their courses"
  ON exam_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM professor_courses pc
      WHERE pc.id = exam_questions.course_id
      AND pc.professor_id = auth.uid()
    )
  );

-- Step 11: Update RLS policies for user_exam_progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_exam_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_exam_progress;

CREATE POLICY "Users can view own progress"
  ON user_exam_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own progress"
  ON user_exam_progress FOR ALL
  USING (user_id = auth.uid());

-- Step 12: Recreate RPC functions without template_id dependency

-- Function to get questions by course and category
CREATE OR REPLACE FUNCTION get_questions_by_course_and_category(
  p_course_id UUID,
  p_category question_type_category
)
RETURNS SETOF exam_questions
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM exam_questions
  WHERE course_id = p_course_id
    AND question_type_category = p_category
    AND is_published = true
  ORDER BY question_number;
$$;

-- Function to get or create progress record
CREATE OR REPLACE FUNCTION get_or_create_exam_progress(
  p_user_id UUID,
  p_course_id UUID,
  p_category question_type_category
)
RETURNS user_exam_progress
LANGUAGE plpgsql
AS $$
DECLARE
  v_progress user_exam_progress;
BEGIN
  -- Try to get existing progress
  SELECT * INTO v_progress
  FROM user_exam_progress
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND question_type_category = p_category;
  
  -- If not found, create new progress record
  IF NOT FOUND THEN
    INSERT INTO user_exam_progress (
      user_id,
      course_id,
      question_type_category,
      current_question_index,
      total_questions,
      score,
      status
    )
    SELECT 
      p_user_id,
      p_course_id,
      p_category,
      0,
      COUNT(*),
      0,
      'not_started'
    FROM exam_questions
    WHERE course_id = p_course_id
      AND question_type_category = p_category
      AND is_published = true
    RETURNING * INTO v_progress;
  END IF;
  
  RETURN v_progress;
END;
$$;

-- Function to update progress
CREATE OR REPLACE FUNCTION update_exam_progress(
  p_user_id UUID,
  p_course_id UUID,
  p_category question_type_category,
  p_current_index INT,
  p_score INT,
  p_status VARCHAR
)
RETURNS user_exam_progress
LANGUAGE plpgsql
AS $$
DECLARE
  v_progress user_exam_progress;
BEGIN
  UPDATE user_exam_progress
  SET 
    current_question_index = p_current_index,
    score = p_score,
    status = p_status,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND question_type_category = p_category
  RETURNING * INTO v_progress;
  
  RETURN v_progress;
END;
$$;

-- Function to get course statistics
CREATE OR REPLACE FUNCTION get_course_question_stats(p_course_id UUID)
RETURNS TABLE (
  question_type_category question_type_category,
  total_questions BIGINT,
  published_questions BIGINT,
  draft_questions BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    question_type_category,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE is_published = true) as published_questions,
    COUNT(*) FILTER (WHERE is_published = false) as draft_questions
  FROM exam_questions
  WHERE course_id = p_course_id
  GROUP BY question_type_category;
$$;

-- Add comment documenting the migration
COMMENT ON TABLE exam_questions IS 'Stores exam questions directly under courses, organized by question_type_category';
COMMENT ON COLUMN exam_questions.question_type_category IS 'High-level category: code_analysis, output_tracing, essay, multiple_choice, true_false';
COMMENT ON COLUMN exam_questions.question_type IS 'Technical implementation type: fill_blanks, trace_output, essay, multiple_choice, true_false, identification';

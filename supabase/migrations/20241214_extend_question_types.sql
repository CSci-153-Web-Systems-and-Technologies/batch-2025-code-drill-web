-- Migration: Extend Question Types
-- Description: Adds support for multiple_choice, true_false, and identification question types
-- Date: 2024-12-14

-- ============================================================================
-- EXTEND EXAM_QUESTIONS TABLE
-- ============================================================================

-- Add new columns for additional question types
ALTER TABLE exam_questions
ADD COLUMN IF NOT EXISTS choices JSONB, -- Array of choices for multiple choice: [{"id": "a", "text": "Choice A"}, ...]
ADD COLUMN IF NOT EXISTS correct_answer TEXT, -- Correct answer for multiple choice and identification
ADD COLUMN IF NOT EXISTS correct_boolean BOOLEAN; -- Correct answer for true/false questions

-- Update the question_type CHECK constraint to include new types
ALTER TABLE exam_questions
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions
ADD CONSTRAINT exam_questions_question_type_check
CHECK (question_type IN ('fill_blanks', 'trace_output', 'essay', 'multiple_choice', 'true_false', 'identification'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_type ON exam_questions(question_type);

-- Add comments
COMMENT ON COLUMN exam_questions.choices IS 'JSONB array of choices for multiple choice questions';
COMMENT ON COLUMN exam_questions.correct_answer IS 'Correct answer for multiple choice (choice id) and identification (text)';
COMMENT ON COLUMN exam_questions.correct_boolean IS 'Correct answer for true/false questions';

-- ============================================================================
-- EXTEND USER_EXAM_ANSWERS TABLE
-- ============================================================================

-- Add new columns for storing user answers to new question types
ALTER TABLE user_exam_answers
ADD COLUMN IF NOT EXISTS selected_choice TEXT, -- Selected choice id for multiple choice
ADD COLUMN IF NOT EXISTS identification_answer TEXT; -- User's text answer for identification questions

-- Add comments
COMMENT ON COLUMN user_exam_answers.selected_choice IS 'Selected choice id for multiple choice questions';
COMMENT ON COLUMN user_exam_answers.identification_answer IS 'User answer for identification questions';

-- ============================================================================
-- RPC FUNCTION: Check Multiple Choice Answer
-- ============================================================================

CREATE OR REPLACE FUNCTION check_multiple_choice_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_selected_choice TEXT,
  p_time_spent INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_correct_answer TEXT;
  v_question_points INTEGER;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER := 0;
  v_answer_id UUID;
BEGIN
  -- Get correct answer and points
  SELECT correct_answer, points INTO v_correct_answer, v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Check if answer is correct
  v_is_correct := p_selected_choice = v_correct_answer;
  
  -- Calculate points (simple correct/incorrect scoring)
  IF v_is_correct THEN
    v_points_earned := v_question_points;
  END IF;
  
  -- Insert or update answer
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, selected_choice,
    is_correct, points_earned, auto_graded, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_selected_choice,
    v_is_correct, v_points_earned, true, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    selected_choice = p_selected_choice,
    is_correct = v_is_correct,
    points_earned = v_points_earned,
    time_spent_seconds = user_exam_answers.time_spent_seconds + p_time_spent,
    attempt_count = user_exam_answers.attempt_count + 1,
    last_attempted_at = NOW(),
    submitted_at = NOW()
  RETURNING id INTO v_answer_id;
  
  -- Update progress
  UPDATE user_exam_progress
  SET 
    questions_completed = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    correct_answers = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND is_correct = true
    ),
    total_points = (
      SELECT COALESCE(SUM(points_earned), 0) FROM user_exam_answers 
      WHERE progress_id = p_progress_id
    ),
    accuracy = (
      SELECT CASE WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / COUNT(*)) * 100 
        ELSE 0 
      END
      FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    last_practiced_at = NOW()
  WHERE id = p_progress_id;
  
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'answer_id', v_answer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION: Check True/False Answer
-- ============================================================================

CREATE OR REPLACE FUNCTION check_true_false_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_answer_boolean BOOLEAN,
  p_time_spent INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_correct_boolean BOOLEAN;
  v_question_points INTEGER;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER := 0;
  v_answer_id UUID;
BEGIN
  -- Get correct answer and points
  SELECT correct_boolean, points INTO v_correct_boolean, v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Check if answer is correct
  v_is_correct := p_answer_boolean = v_correct_boolean;
  
  -- Calculate points
  IF v_is_correct THEN
    v_points_earned := v_question_points;
  END IF;
  
  -- Insert or update answer (store as text for consistency)
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, identification_answer,
    is_correct, points_earned, auto_graded, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_answer_boolean::TEXT,
    v_is_correct, v_points_earned, true, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    identification_answer = p_answer_boolean::TEXT,
    is_correct = v_is_correct,
    points_earned = v_points_earned,
    time_spent_seconds = user_exam_answers.time_spent_seconds + p_time_spent,
    attempt_count = user_exam_answers.attempt_count + 1,
    last_attempted_at = NOW(),
    submitted_at = NOW()
  RETURNING id INTO v_answer_id;
  
  -- Update progress
  UPDATE user_exam_progress
  SET 
    questions_completed = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    correct_answers = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND is_correct = true
    ),
    total_points = (
      SELECT COALESCE(SUM(points_earned), 0) FROM user_exam_answers 
      WHERE progress_id = p_progress_id
    ),
    accuracy = (
      SELECT CASE WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / COUNT(*)) * 100 
        ELSE 0 
      END
      FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    last_practiced_at = NOW()
  WHERE id = p_progress_id;
  
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'answer_id', v_answer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION: Check Identification Answer (Case-Insensitive)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_identification_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_identification_answer TEXT,
  p_time_spent INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_correct_answer TEXT;
  v_question_points INTEGER;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER := 0;
  v_answer_id UUID;
BEGIN
  -- Get correct answer and points
  SELECT correct_answer, points INTO v_correct_answer, v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Check if answer is correct (case-insensitive, trimmed)
  v_is_correct := LOWER(TRIM(p_identification_answer)) = LOWER(TRIM(v_correct_answer));
  
  -- Calculate points
  IF v_is_correct THEN
    v_points_earned := v_question_points;
  END IF;
  
  -- Insert or update answer
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, identification_answer,
    is_correct, points_earned, auto_graded, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_identification_answer,
    v_is_correct, v_points_earned, true, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    identification_answer = p_identification_answer,
    is_correct = v_is_correct,
    points_earned = v_points_earned,
    time_spent_seconds = user_exam_answers.time_spent_seconds + p_time_spent,
    attempt_count = user_exam_answers.attempt_count + 1,
    last_attempted_at = NOW(),
    submitted_at = NOW()
  RETURNING id INTO v_answer_id;
  
  -- Update progress
  UPDATE user_exam_progress
  SET 
    questions_completed = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    correct_answers = (
      SELECT COUNT(*) FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND is_correct = true
    ),
    total_points = (
      SELECT COALESCE(SUM(points_earned), 0) FROM user_exam_answers 
      WHERE progress_id = p_progress_id
    ),
    accuracy = (
      SELECT CASE WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / COUNT(*)) * 100 
        ELSE 0 
      END
      FROM user_exam_answers 
      WHERE progress_id = p_progress_id AND submitted_at IS NOT NULL
    ),
    last_practiced_at = NOW()
  WHERE id = p_progress_id;
  
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'answer_id', v_answer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for RPC functions
COMMENT ON FUNCTION check_multiple_choice_answer IS 'Auto-grades multiple choice question answers';
COMMENT ON FUNCTION check_true_false_answer IS 'Auto-grades true/false question answers';
COMMENT ON FUNCTION check_identification_answer IS 'Auto-grades identification question answers with case-insensitive matching';

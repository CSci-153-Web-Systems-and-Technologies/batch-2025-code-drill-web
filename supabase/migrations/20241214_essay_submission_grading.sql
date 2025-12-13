-- Migration: Add essay submission and manual grading system

-- Add grading-related columns to user_exam_answers if they don't exist
ALTER TABLE user_exam_answers 
  ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manual_points INTEGER,
  ADD COLUMN IF NOT EXISTS grading_rubric_scores JSONB, -- Store scores for each rubric criterion
  ADD COLUMN IF NOT EXISTS requires_grading BOOLEAN DEFAULT false;

-- Create index for faster queries of ungraded submissions
CREATE INDEX IF NOT EXISTS idx_user_answers_requires_grading 
  ON user_exam_answers(requires_grading, question_id) 
  WHERE requires_grading = true;

CREATE INDEX IF NOT EXISTS idx_user_answers_graded_by 
  ON user_exam_answers(graded_by);

-- Function to submit essay answer
CREATE OR REPLACE FUNCTION submit_essay_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_course_id UUID,
  p_question_type_category question_type_category,
  p_essay_answer TEXT,
  p_word_count INTEGER,
  p_time_spent INTEGER DEFAULT 0,
  p_hints_used INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_progress_id UUID;
  v_answer_id UUID;
  v_question_points INTEGER;
BEGIN
  -- Get or create progress record
  SELECT id INTO v_progress_id
  FROM user_exam_progress
  WHERE user_id = p_user_id 
    AND course_id = p_course_id
    AND question_type_category = p_question_type_category;
  
  IF v_progress_id IS NULL THEN
    INSERT INTO user_exam_progress (
      user_id,
      course_id,
      question_type_category,
      status,
      started_at
    ) VALUES (
      p_user_id,
      p_course_id,
      p_question_type_category,
      'in_progress',
      NOW()
    )
    RETURNING id INTO v_progress_id;
  END IF;
  
  -- Get question points
  SELECT points INTO v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Insert or update answer
  INSERT INTO user_exam_answers (
    user_id,
    question_id,
    progress_id,
    essay_answer,
    word_count,
    time_spent_seconds,
    hints_used,
    is_correct,
    points_earned,
    auto_graded,
    manually_reviewed,
    requires_grading,
    first_attempted_at,
    last_attempted_at,
    submitted_at
  ) VALUES (
    p_user_id,
    p_question_id,
    v_progress_id,
    p_essay_answer,
    p_word_count,
    p_time_spent,
    p_hints_used,
    NULL, -- Can't auto-grade essays
    0, -- No points until manually graded
    false,
    false,
    true, -- Requires manual grading
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    essay_answer = EXCLUDED.essay_answer,
    word_count = EXCLUDED.word_count,
    time_spent_seconds = user_exam_answers.time_spent_seconds + EXCLUDED.time_spent_seconds,
    hints_used = GREATEST(user_exam_answers.hints_used, EXCLUDED.hints_used),
    attempt_count = user_exam_answers.attempt_count + 1,
    last_attempted_at = NOW(),
    submitted_at = NOW(),
    requires_grading = true,
    updated_at = NOW()
  RETURNING id INTO v_answer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'answer_id', v_answer_id,
    'progress_id', v_progress_id,
    'requires_grading', true,
    'message', 'Essay submitted successfully. Your professor will grade it soon.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grade essay answer
CREATE OR REPLACE FUNCTION grade_essay_answer(
  p_answer_id UUID,
  p_grader_id UUID,
  p_points_awarded INTEGER,
  p_feedback TEXT DEFAULT NULL,
  p_rubric_scores JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_question_points INTEGER;
  v_user_id UUID;
  v_question_id UUID;
BEGIN
  -- Get answer details
  SELECT 
    ua.user_id,
    ua.question_id,
    eq.points
  INTO v_user_id, v_question_id, v_question_points
  FROM user_exam_answers ua
  JOIN exam_questions eq ON ua.question_id = eq.id
  WHERE ua.id = p_answer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Answer not found');
  END IF;
  
  -- Validate points
  IF p_points_awarded < 0 OR p_points_awarded > v_question_points THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Points must be between 0 and %s', v_question_points)
    );
  END IF;
  
  -- Update the answer with grading
  UPDATE user_exam_answers
  SET
    points_earned = p_points_awarded,
    manual_points = p_points_awarded,
    is_correct = (p_points_awarded = v_question_points),
    manually_reviewed = true,
    requires_grading = false,
    reviewer_feedback = p_feedback,
    grading_rubric_scores = p_rubric_scores,
    graded_by = p_grader_id,
    graded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_answer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'answer_id', p_answer_id,
    'points_awarded', p_points_awarded,
    'message', 'Essay graded successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing functions if they exist (to allow changing return types)
DROP FUNCTION IF EXISTS get_submissions_for_grading(uuid, question_type_category, text);
DROP FUNCTION IF EXISTS get_student_submission_history(uuid, uuid);

-- Function to get submissions requiring grading for a course
CREATE OR REPLACE FUNCTION get_submissions_for_grading(
  p_course_id UUID,
  p_question_type_category question_type_category DEFAULT NULL,
  p_graded_status TEXT DEFAULT 'ungraded' -- 'ungraded', 'graded', 'all'
)
RETURNS TABLE (
  answer_id UUID,
  question_id UUID,
  question_title VARCHAR(255),
  question_type VARCHAR(50),
  student_id UUID,
  student_name VARCHAR(255),
  student_email VARCHAR(255),
  essay_answer TEXT,
  word_count INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER,
  max_points INTEGER,
  requires_grading BOOLEAN,
  manually_reviewed BOOLEAN,
  reviewer_feedback TEXT,
  graded_by UUID,
  graded_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,
  hints_used INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id as answer_id,
    eq.id as question_id,
    eq.title as question_title,
    eq.question_type::VARCHAR(50) as question_type,
    u.id as student_id,
    u.name::VARCHAR(255) as student_name,
    u.email::VARCHAR(255) as student_email,
    ua.essay_answer,
    ua.word_count,
    ua.submitted_at,
    ua.points_earned,
    eq.points as max_points,
    ua.requires_grading,
    ua.manually_reviewed,
    ua.reviewer_feedback,
    ua.graded_by,
    ua.graded_at,
    ua.time_spent_seconds,
    ua.hints_used
  FROM user_exam_answers ua
  JOIN exam_questions eq ON ua.question_id = eq.id
  JOIN users u ON ua.user_id = u.id
  WHERE eq.course_id = p_course_id
    AND ua.essay_answer IS NOT NULL
    AND (p_question_type_category IS NULL OR eq.question_type_category = p_question_type_category)
    AND (
      (p_graded_status = 'ungraded' AND ua.requires_grading = true) OR
      (p_graded_status = 'graded' AND ua.manually_reviewed = true) OR
      (p_graded_status = 'all')
    )
  ORDER BY 
    CASE WHEN p_graded_status = 'ungraded' THEN ua.submitted_at END ASC,
    ua.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's submission history
CREATE OR REPLACE FUNCTION get_student_submission_history(
  p_user_id UUID,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
  answer_id UUID,
  question_id UUID,
  question_title VARCHAR(255),
  question_type VARCHAR(50),
  question_type_category VARCHAR(50),
  course_id UUID,
  course_name VARCHAR(255),
  course_code VARCHAR(20),
  essay_answer TEXT,
  word_count INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER,
  max_points INTEGER,
  is_correct BOOLEAN,
  manually_reviewed BOOLEAN,
  requires_grading BOOLEAN,
  reviewer_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id as answer_id,
    eq.id as question_id,
    eq.title as question_title,
    eq.question_type::VARCHAR(50) as question_type,
    eq.question_type_category::VARCHAR(50) as question_type_category,
    pc.id as course_id,
    pc.name as course_name,
    pc.course_code,
    ua.essay_answer,
    ua.word_count,
    ua.submitted_at,
    ua.points_earned,
    eq.points as max_points,
    ua.is_correct,
    ua.manually_reviewed,
    ua.requires_grading,
    ua.reviewer_feedback,
    ua.graded_at,
    ua.time_spent_seconds
  FROM user_exam_answers ua
  JOIN exam_questions eq ON ua.question_id = eq.id
  JOIN professor_courses pc ON eq.course_id = pc.id
  WHERE ua.user_id = p_user_id
    AND ua.submitted_at IS NOT NULL
    AND (p_course_id IS NULL OR pc.id = p_course_id)
  ORDER BY ua.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON COLUMN user_exam_answers.requires_grading IS 'True if submission needs manual grading';
COMMENT ON COLUMN user_exam_answers.graded_by IS 'Professor who graded this submission';
COMMENT ON COLUMN user_exam_answers.graded_at IS 'When this was graded';
COMMENT ON COLUMN user_exam_answers.manual_points IS 'Points awarded through manual grading';
COMMENT ON COLUMN user_exam_answers.grading_rubric_scores IS 'JSON object with rubric criterion scores';

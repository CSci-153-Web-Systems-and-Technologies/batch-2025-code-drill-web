-- Migration: Fix question versioning trigger to remove template_id references
-- This updates the trigger created in 20241203_question_versioning.sql to work with the template-free system

-- Drop existing triggers first
DROP TRIGGER IF EXISTS exam_question_version_trigger ON exam_questions;
DROP TRIGGER IF EXISTS trigger_version_question_on_insert ON exam_questions;
DROP TRIGGER IF EXISTS trigger_version_question_on_update ON exam_questions;

-- Drop the function with CASCADE to remove any remaining dependencies
DROP FUNCTION IF EXISTS create_question_version() CASCADE;

-- Recreate the function without template_id
CREATE OR REPLACE FUNCTION create_question_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INT;
BEGIN
  -- Get the next version number for this question
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM exam_question_versions 
  WHERE question_id = NEW.id;
  
  -- Insert the version record with OLD data (before update)
  -- On INSERT, we use NEW data as the first version
  INSERT INTO exam_question_versions (
    question_id,
    version_number,
    question_data,
    changed_by,
    change_description
  )
  VALUES (
    NEW.id,
    next_version,
    jsonb_build_object(
      'course_id', NEW.course_id,
      'question_type_category', NEW.question_type_category,
      'question_number', NEW.question_number,
      'title', NEW.title,
      'question_text', NEW.question_text,
      'question_type', NEW.question_type,
      'code_snippet', NEW.code_snippet,
      'blanks', NEW.blanks,
      'expected_output', NEW.expected_output,
      'output_tips', NEW.output_tips,
      'essay_context', NEW.essay_context,
      'essay_requirements', NEW.essay_requirements,
      'essay_structure_guide', NEW.essay_structure_guide,
      'choices', NEW.choices,
      'correct_answer', NEW.correct_answer,
      'correct_boolean', NEW.correct_boolean,
      'points', NEW.points,
      'difficulty', NEW.difficulty,
      'hints', NEW.hints,
      'time_estimate_minutes', NEW.time_estimate_minutes
    ),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Initial version'
      ELSE 'Question updated'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER exam_question_version_trigger
  AFTER INSERT OR UPDATE ON exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION create_question_version();

-- Also update the rollback function to use course_id instead of template_id
DROP FUNCTION IF EXISTS rollback_question_to_version(UUID, INT);

CREATE OR REPLACE FUNCTION rollback_question_to_version(
  p_question_id UUID,
  p_version_number INT
)
RETURNS BOOLEAN AS $$
DECLARE
  version_data JSONB;
BEGIN
  -- Get the version data
  SELECT question_data INTO version_data
  FROM exam_question_versions
  WHERE question_id = p_question_id 
    AND version_number = p_version_number;
  
  IF version_data IS NULL THEN
    RAISE EXCEPTION 'Version % not found for question %', p_version_number, p_question_id;
  END IF;
  
  -- Update the question with the version data
  UPDATE exam_questions
  SET
    course_id = (version_data->>'course_id')::UUID,
    question_type_category = (version_data->>'question_type_category')::question_type_category,
    question_number = (version_data->>'question_number')::INT,
    title = version_data->>'title',
    question_text = version_data->>'question_text',
    question_type = version_data->>'question_type',
    code_snippet = version_data->>'code_snippet',
    blanks = version_data->'blanks',
    expected_output = version_data->>'expected_output',
    output_tips = version_data->'output_tips',
    essay_context = version_data->>'essay_context',
    essay_requirements = version_data->'essay_requirements',
    essay_structure_guide = version_data->>'essay_structure_guide',
    choices = version_data->'choices',
    correct_answer = version_data->>'correct_answer',
    correct_boolean = (version_data->>'correct_boolean')::BOOLEAN,
    points = (version_data->>'points')::INT,
    difficulty = version_data->>'difficulty',
    hints = version_data->'hints',
    time_estimate_minutes = (version_data->>'time_estimate_minutes')::INT,
    updated_at = NOW()
  WHERE id = p_question_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

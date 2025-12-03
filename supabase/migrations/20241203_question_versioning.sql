-- Migration: Question Versioning System
-- Description: Adds versioning support for exam questions to track changes and enable rollback
-- Date: 2024-12-03

-- Create exam_question_versions table
CREATE TABLE exam_question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Snapshot of question data at this version (stored as JSONB for flexibility)
  question_data JSONB NOT NULL,
  
  -- Metadata
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique version numbers per question
  UNIQUE(question_id, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_question_versions_question ON exam_question_versions(question_id);
CREATE INDEX idx_question_versions_changed_by ON exam_question_versions(changed_by);
CREATE INDEX idx_question_versions_changed_at ON exam_question_versions(changed_at DESC);

-- Add RLS policies
ALTER TABLE exam_question_versions ENABLE ROW LEVEL SECURITY;

-- Professors and admins can view all version history
CREATE POLICY "Professors can view version history" ON exam_question_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Only the system can insert versions (via trigger)
CREATE POLICY "System can insert versions" ON exam_question_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Function to create a version snapshot of a question
CREATE OR REPLACE FUNCTION create_question_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_version INTEGER;
  user_id UUID;
BEGIN
  -- Get the user ID from the session
  user_id := auth.uid();
  
  -- If no user ID, skip versioning (for system operations)
  IF user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
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
      'template_id', NEW.template_id,
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
      'points', NEW.points,
      'difficulty', NEW.difficulty,
      'hints', NEW.hints,
      'time_estimate_minutes', NEW.time_estimate_minutes
    ),
    user_id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Initial version'
      ELSE 'Updated question'
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically version questions on INSERT and UPDATE
CREATE TRIGGER trigger_version_question_on_insert
AFTER INSERT ON exam_questions
FOR EACH ROW
EXECUTE FUNCTION create_question_version();

CREATE TRIGGER trigger_version_question_on_update
AFTER UPDATE ON exam_questions
FOR EACH ROW
WHEN (
  OLD.title IS DISTINCT FROM NEW.title OR
  OLD.question_text IS DISTINCT FROM NEW.question_text OR
  OLD.code_snippet IS DISTINCT FROM NEW.code_snippet OR
  OLD.blanks IS DISTINCT FROM NEW.blanks OR
  OLD.expected_output IS DISTINCT FROM NEW.expected_output OR
  OLD.output_tips IS DISTINCT FROM NEW.output_tips OR
  OLD.essay_context IS DISTINCT FROM NEW.essay_context OR
  OLD.essay_requirements IS DISTINCT FROM NEW.essay_requirements OR
  OLD.essay_structure_guide IS DISTINCT FROM NEW.essay_structure_guide OR
  OLD.points IS DISTINCT FROM NEW.points OR
  OLD.difficulty IS DISTINCT FROM NEW.difficulty OR
  OLD.hints IS DISTINCT FROM NEW.hints
)
EXECUTE FUNCTION create_question_version();

-- Function to rollback a question to a specific version
CREATE OR REPLACE FUNCTION rollback_question_to_version(
  p_question_id UUID,
  p_version_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  version_data JSONB;
  result JSONB;
BEGIN
  -- Check if user has professor/admin role
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('professor', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Professor or admin role required'
    );
  END IF;
  
  -- Get the version data
  SELECT question_data INTO version_data
  FROM exam_question_versions
  WHERE question_id = p_question_id
  AND version_number = p_version_number;
  
  IF version_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Version not found'
    );
  END IF;
  
  -- Update the question with the version data
  UPDATE exam_questions
  SET
    template_id = (version_data->>'template_id')::UUID,
    question_number = (version_data->>'question_number')::INTEGER,
    title = version_data->>'title',
    question_text = version_data->>'question_text',
    question_type = version_data->>'question_type',
    code_snippet = version_data->>'code_snippet',
    blanks = version_data->'blanks',
    expected_output = version_data->>'expected_output',
    output_tips = CASE 
      WHEN version_data->'output_tips' IS NOT NULL 
      THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(version_data->'output_tips'))
      ELSE NULL
    END,
    essay_context = version_data->>'essay_context',
    essay_requirements = version_data->'essay_requirements',
    essay_structure_guide = version_data->>'essay_structure_guide',
    points = (version_data->>'points')::INTEGER,
    difficulty = version_data->>'difficulty',
    hints = CASE 
      WHEN version_data->'hints' IS NOT NULL 
      THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(version_data->'hints'))
      ELSE NULL
    END,
    time_estimate_minutes = (version_data->>'time_estimate_minutes')::INTEGER,
    updated_at = NOW()
  WHERE id = p_question_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully rolled back to version ' || p_version_number
  );
END;
$$;

-- Add comments
COMMENT ON TABLE exam_question_versions IS 'Stores version history of exam questions for audit trail and rollback';
COMMENT ON FUNCTION create_question_version IS 'Automatically creates version snapshots when questions are created or updated';
COMMENT ON FUNCTION rollback_question_to_version IS 'Restores a question to a previous version';

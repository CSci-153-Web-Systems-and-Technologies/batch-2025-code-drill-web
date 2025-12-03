-- Migration: Publish Status and Preview Tokens
-- Description: Adds publish/unpublish functionality and preview token sharing
-- Date: 2024-12-03

-- Add publish status columns to exam_questions table
ALTER TABLE exam_questions
ADD COLUMN is_published BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN published_by UUID REFERENCES users(id);

-- Create index on is_published for faster filtering
CREATE INDEX idx_exam_questions_published ON exam_questions(is_published);
CREATE INDEX idx_exam_questions_published_at ON exam_questions(published_at DESC);

-- Add comments
COMMENT ON COLUMN exam_questions.is_published IS 'Whether the question is published and visible to students';
COMMENT ON COLUMN exam_questions.published_at IS 'Timestamp when the question was published';
COMMENT ON COLUMN exam_questions.published_by IS 'User who published the question';

-- Update RLS policy for students to only see published questions
DROP POLICY IF EXISTS "Public can view exam questions" ON exam_questions;

CREATE POLICY "Students can view published questions" ON exam_questions
  FOR SELECT
  TO authenticated
  USING (
    is_published = true OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Create preview_tokens table for secure question preview sharing
CREATE TABLE preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  
  -- Token metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Usage tracking
  allowed_views INTEGER DEFAULT 10,
  view_count INTEGER DEFAULT 0,
  
  -- Additional options
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_preview_tokens_token ON preview_tokens(token);
CREATE INDEX idx_preview_tokens_question ON preview_tokens(question_id);
CREATE INDEX idx_preview_tokens_created_by ON preview_tokens(created_by);
CREATE INDEX idx_preview_tokens_expires_at ON preview_tokens(expires_at);

-- Add RLS policies for preview_tokens
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;

-- Professors can view their own tokens
CREATE POLICY "Professors can view their tokens" ON preview_tokens
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Professors can create tokens
CREATE POLICY "Professors can create tokens" ON preview_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Professors can update their own tokens
CREATE POLICY "Professors can update their tokens" ON preview_tokens
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Professors can delete their own tokens
CREATE POLICY "Professors can delete their tokens" ON preview_tokens
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to publish a question
CREATE OR REPLACE FUNCTION publish_question(p_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- Check if user has professor/admin role
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND role IN ('professor', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Professor or admin role required'
    );
  END IF;
  
  -- Check if question exists
  IF NOT EXISTS (
    SELECT 1 FROM exam_questions
    WHERE id = p_question_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Question not found'
    );
  END IF;
  
  -- Publish the question
  UPDATE exam_questions
  SET
    is_published = true,
    published_at = NOW(),
    published_by = user_id,
    updated_at = NOW()
  WHERE id = p_question_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Question published successfully'
  );
END;
$$;

-- Function to unpublish a question
CREATE OR REPLACE FUNCTION unpublish_question(p_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  -- Unpublish the question
  UPDATE exam_questions
  SET
    is_published = false,
    published_at = NULL,
    published_by = NULL,
    updated_at = NOW()
  WHERE id = p_question_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Question unpublished successfully'
  );
END;
$$;

-- Function to bulk publish questions
CREATE OR REPLACE FUNCTION bulk_publish_questions(p_question_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  published_count INTEGER;
BEGIN
  user_id := auth.uid();
  
  -- Check if user has professor/admin role
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND role IN ('professor', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Professor or admin role required'
    );
  END IF;
  
  -- Publish all questions in the array
  UPDATE exam_questions
  SET
    is_published = true,
    published_at = NOW(),
    published_by = user_id,
    updated_at = NOW()
  WHERE id = ANY(p_question_ids)
  AND is_published = false;
  
  GET DIAGNOSTICS published_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully published ' || published_count || ' question(s)',
    'published_count', published_count
  );
END;
$$;

-- Function to bulk unpublish questions
CREATE OR REPLACE FUNCTION bulk_unpublish_questions(p_question_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unpublished_count INTEGER;
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
  
  -- Unpublish all questions in the array
  UPDATE exam_questions
  SET
    is_published = false,
    published_at = NULL,
    published_by = NULL,
    updated_at = NOW()
  WHERE id = ANY(p_question_ids)
  AND is_published = true;
  
  GET DIAGNOSTICS unpublished_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully unpublished ' || unpublished_count || ' question(s)',
    'unpublished_count', unpublished_count
  );
END;
$$;

-- Function to validate and increment preview token view count
CREATE OR REPLACE FUNCTION validate_preview_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Get the token record
  SELECT * INTO token_record
  FROM preview_tokens
  WHERE token = p_token
  AND is_active = true;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or inactive token'
    );
  END IF;
  
  -- Check if token has expired
  IF token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Token has expired'
    );
  END IF;
  
  -- Check if view limit has been reached
  IF token_record.view_count >= token_record.allowed_views THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'View limit reached'
    );
  END IF;
  
  -- Increment view count
  UPDATE preview_tokens
  SET view_count = view_count + 1
  WHERE token = p_token;
  
  -- Return success with question_id
  RETURN jsonb_build_object(
    'valid', true,
    'question_id', token_record.question_id,
    'views_remaining', token_record.allowed_views - token_record.view_count - 1
  );
END;
$$;

-- Add comments
COMMENT ON TABLE preview_tokens IS 'Secure tokens for sharing unpublished question previews';
COMMENT ON FUNCTION publish_question IS 'Publish a question to make it visible to students';
COMMENT ON FUNCTION unpublish_question IS 'Unpublish a question to hide it from students';
COMMENT ON FUNCTION bulk_publish_questions IS 'Publish multiple questions at once';
COMMENT ON FUNCTION bulk_unpublish_questions IS 'Unpublish multiple questions at once';
COMMENT ON FUNCTION validate_preview_token IS 'Validate a preview token and increment view count';

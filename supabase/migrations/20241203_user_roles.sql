-- Migration: Add role system to users table
-- Description: Adds role column with ENUM type to support student/professor/admin roles
-- Date: 2024-12-03

-- Create role enum type
CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');

-- Add role column to users table with default 'student'
ALTER TABLE users
ADD COLUMN role user_role DEFAULT 'student' NOT NULL;

-- Create index on role column for faster lookups
CREATE INDEX idx_users_role ON users(role);

-- Add comment to document role column
COMMENT ON COLUMN users.role IS 'User role: student (default), professor (can manage exams), admin (full access)';

-- Add RLS policies for exam_questions table to allow professor/admin write access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Professors can insert questions" ON exam_questions;
DROP POLICY IF EXISTS "Professors can update questions" ON exam_questions;
DROP POLICY IF EXISTS "Professors can delete questions" ON exam_questions;

-- Create new policies for professor/admin write access
CREATE POLICY "Professors can insert questions" ON exam_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can update questions" ON exam_questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can delete questions" ON exam_questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Add RLS policies for exam_templates table
DROP POLICY IF EXISTS "Professors can insert templates" ON exam_templates;
DROP POLICY IF EXISTS "Professors can update templates" ON exam_templates;
DROP POLICY IF EXISTS "Professors can delete templates" ON exam_templates;

CREATE POLICY "Professors can insert templates" ON exam_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can update templates" ON exam_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can delete templates" ON exam_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Add RLS policies for professor_courses table
DROP POLICY IF EXISTS "Professors can insert courses" ON professor_courses;
DROP POLICY IF EXISTS "Professors can update courses" ON professor_courses;
DROP POLICY IF EXISTS "Professors can delete courses" ON professor_courses;

CREATE POLICY "Professors can insert courses" ON professor_courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can update courses" ON professor_courses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Professors can delete courses" ON professor_courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('professor', 'admin')
    )
  );

-- Function to promote user to professor role
-- Usage: SELECT promote_user_to_professor('user_email@example.com');
CREATE OR REPLACE FUNCTION promote_user_to_professor(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE users
  SET role = 'professor'
  WHERE email = user_email;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 0 THEN
    RETURN 'User not found with email: ' || user_email;
  ELSE
    RETURN 'Successfully promoted ' || user_email || ' to professor';
  END IF;
END;
$$;

-- Function to promote user to admin role
-- Usage: SELECT promote_user_to_admin('user_email@example.com');
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE users
  SET role = 'admin'
  WHERE email = user_email;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 0 THEN
    RETURN 'User not found with email: ' || user_email;
  ELSE
    RETURN 'Successfully promoted ' || user_email || ' to admin';
  END IF;
END;
$$;

-- Add comments
COMMENT ON FUNCTION promote_user_to_professor IS 'Promotes a user to professor role by email address';
COMMENT ON FUNCTION promote_user_to_admin IS 'Promotes a user to admin role by email address';

-- Example: Promote first registered user to professor (uncomment and update email)
-- SELECT promote_user_to_professor('admin@example.com');

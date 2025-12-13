-- Practice Mode Overhaul: Topic-Based Filtering with Smart Question Selection
-- This migration adds tag support to exam questions and extends practice sessions
-- to support course-based practice with topic filtering and question history tracking

-- ============================================================================
-- 1. MODIFY EXAM QUESTIONS TABLE
-- ============================================================================

-- Add template_id if it doesn't exist (for backwards compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_questions' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE exam_questions ADD COLUMN template_id UUID;
    
    -- Only add foreign key constraint if exam_templates table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'exam_templates'
    ) THEN
      ALTER TABLE exam_questions ADD CONSTRAINT fk_exam_questions_template 
        FOREIGN KEY (template_id) REFERENCES exam_templates(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Make template_id and question_number nullable for standalone questions
ALTER TABLE exam_questions ALTER COLUMN template_id DROP NOT NULL;
ALTER TABLE exam_questions ALTER COLUMN question_number DROP NOT NULL;

-- Drop the unique constraint on (template_id, question_number) since we'll have NULLs
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_template_id_question_number_key;

-- Add course_id column for standalone questions (questions not tied to templates)
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS course_id UUID;

-- Add foreign key constraint for course_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_exam_questions_course'
  ) THEN
    ALTER TABLE exam_questions ADD CONSTRAINT fk_exam_questions_course 
      FOREIGN KEY (course_id) REFERENCES professor_courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraint: either template_id or course_id must be set (but not both for standalone)
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_source_check;
ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_source_check 
  CHECK (
    (template_id IS NOT NULL AND course_id IS NULL) OR 
    (template_id IS NULL AND course_id IS NOT NULL)
  );

-- Add additional columns for new question types
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS question_type_category TEXT;

-- Drop and recreate CHECK constraint to avoid conflicts
DO $$
BEGIN
  ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_type_category_check;
  ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_type_category_check
    CHECK (question_type_category IN ('code_analysis', 'output_tracing', 'essay', 'multiple_choice', 'true_false'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS choices JSONB;
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS correct_boolean BOOLEAN;
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add tags array column to exam_questions
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array searching
CREATE INDEX IF NOT EXISTS idx_exam_questions_tags ON exam_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_exam_questions_course ON exam_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_published ON exam_questions(is_published);

-- Function to auto-lowercase tags on insert/update
CREATE OR REPLACE FUNCTION lowercase_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert all tags to lowercase, trim whitespace, and remove duplicates
  NEW.tags := ARRAY(
    SELECT DISTINCT LOWER(TRIM(tag))
    FROM unnest(NEW.tags) AS tag
    WHERE TRIM(tag) != ''
    ORDER BY LOWER(TRIM(tag))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-lowercase tags
DROP TRIGGER IF EXISTS ensure_lowercase_tags ON exam_questions;
CREATE TRIGGER ensure_lowercase_tags
  BEFORE INSERT OR UPDATE OF tags ON exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_tags();

-- ============================================================================
-- 2. EXTEND PRACTICE SESSIONS
-- ============================================================================

-- Remove difficulty column (no longer used)
ALTER TABLE practice_sessions DROP COLUMN IF EXISTS difficulty;

-- Add new columns for exam-based practice
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS question_source TEXT 
  CHECK (question_source IN ('coding', 'exam', 'mixed')) DEFAULT 'coding';
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES professor_courses(id);
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS selected_tags TEXT[] DEFAULT '{}';
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS selected_question_types TEXT[] DEFAULT '{}';

-- Add index on course_id for filtering
CREATE INDEX IF NOT EXISTS idx_practice_sessions_course ON practice_sessions(course_id);

-- ============================================================================
-- 3. CREATE PRACTICE EXAM QUESTIONS JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  exam_question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  answered_at TIMESTAMP WITH TIME ZONE,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, exam_question_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_practice_exam_questions_session ON practice_exam_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_exam_questions_question ON practice_exam_questions(exam_question_id);

-- ============================================================================
-- 4. CREATE USER QUESTION HISTORY TABLE (for smart selection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  times_seen INTEGER DEFAULT 1,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, question_id)
);

-- Indexes for smart question selection
CREATE INDEX IF NOT EXISTS idx_user_question_history_user ON user_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_history_last_seen ON user_question_history(user_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_question_history_incorrect ON user_question_history(user_id, times_incorrect DESC);

-- ============================================================================
-- 5. CREATE USER TAG STATISTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_tag_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  course_id UUID REFERENCES professor_courses(id) ON DELETE CASCADE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tag, course_id)
);

-- Indexes for tag performance tracking
CREATE INDEX IF NOT EXISTS idx_user_tag_stats_user ON user_tag_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_stats_tag ON user_tag_stats(tag);
CREATE INDEX IF NOT EXISTS idx_user_tag_stats_accuracy ON user_tag_stats(user_id, accuracy);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE practice_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tag_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_exam_questions
DROP POLICY IF EXISTS "Users can view their own practice exam questions" ON practice_exam_questions;
CREATE POLICY "Users can view their own practice exam questions"
  ON practice_exam_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM practice_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own practice exam questions" ON practice_exam_questions;
CREATE POLICY "Users can insert their own practice exam questions"
  ON practice_exam_questions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM practice_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own practice exam questions" ON practice_exam_questions;
CREATE POLICY "Users can update their own practice exam questions"
  ON practice_exam_questions FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM practice_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_question_history
DROP POLICY IF EXISTS "Users can view their own question history" ON user_question_history;
CREATE POLICY "Users can view their own question history"
  ON user_question_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own question history" ON user_question_history;
CREATE POLICY "Users can insert their own question history"
  ON user_question_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own question history" ON user_question_history;
CREATE POLICY "Users can update their own question history"
  ON user_question_history FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for user_tag_stats
DROP POLICY IF EXISTS "Users can view their own tag stats" ON user_tag_stats;
CREATE POLICY "Users can view their own tag stats"
  ON user_tag_stats FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own tag stats" ON user_tag_stats;
CREATE POLICY "Users can insert their own tag stats"
  ON user_tag_stats FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own tag stats" ON user_tag_stats;
CREATE POLICY "Users can update their own tag stats"
  ON user_tag_stats FOR UPDATE
  USING (user_id = auth.uid());

-- Professors can view all tag stats for their courses
DROP POLICY IF EXISTS "Professors can view tag stats for their courses" ON user_tag_stats;
CREATE POLICY "Professors can view tag stats for their courses"
  ON user_tag_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('professor', 'admin')
    )
  );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get all unique tags for a course
CREATE OR REPLACE FUNCTION get_course_tags(p_course_id UUID)
RETURNS TABLE (tag TEXT, question_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest_tag AS tag,
    COUNT(DISTINCT eq.id) AS question_count
  FROM exam_questions eq,
       unnest(eq.tags) AS unnest_tag
  WHERE eq.course_id = p_course_id
    AND eq.is_published = true
  GROUP BY unnest_tag
  ORDER BY question_count DESC, unnest_tag ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user tag stats after practice
CREATE OR REPLACE FUNCTION update_user_tag_stats(
  p_user_id UUID,
  p_tag TEXT,
  p_course_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_tag_stats (
    user_id,
    tag,
    course_id,
    questions_attempted,
    questions_correct,
    accuracy,
    last_practiced_at
  ) VALUES (
    p_user_id,
    LOWER(TRIM(p_tag)),
    p_course_id,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 100.00 ELSE 0.00 END,
    NOW()
  )
  ON CONFLICT (user_id, tag, course_id)
  DO UPDATE SET
    questions_attempted = user_tag_stats.questions_attempted + 1,
    questions_correct = user_tag_stats.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    accuracy = (
      (user_tag_stats.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::DECIMAL 
      / (user_tag_stats.questions_attempted + 1)::DECIMAL * 100
    ),
    last_practiced_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE practice_exam_questions IS 'Junction table linking practice sessions to exam questions';
COMMENT ON TABLE user_question_history IS 'Tracks which questions users have seen for smart selection';
COMMENT ON TABLE user_tag_stats IS 'Aggregates user performance by topic/tag for analytics';
COMMENT ON FUNCTION get_course_tags IS 'Returns all unique tags for a course with question counts';
COMMENT ON FUNCTION update_user_tag_stats IS 'Updates tag performance statistics after practice session';

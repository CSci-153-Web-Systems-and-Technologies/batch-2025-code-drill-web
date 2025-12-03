-- Professor Exam System Migration
-- Creates tables for course-based exam simulations with three types: Code Analysis, Output Tracing, Essay Questions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFESSOR COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS professor_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  professor_name VARCHAR(255) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  student_count INTEGER DEFAULT 0,
  exam_style VARCHAR(50) NOT NULL CHECK (exam_style IN ('code-heavy', 'design-patterns', 'balanced')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXAM TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES professor_courses(id) ON DELETE CASCADE,
  exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('code_analysis', 'output_tracing', 'essay')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXAM QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('fill_blanks', 'trace_output', 'essay')),
  
  -- For code analysis and output tracing
  code_snippet TEXT,
  
  -- For fill-in-the-blanks (code analysis)
  blanks JSONB, -- [{ "blank_number": 1, "expected": "answer", "hint": "optional hint" }]
  
  -- For output tracing
  expected_output TEXT,
  output_tips JSONB, -- ["tip1", "tip2"]
  
  -- For essay questions
  essay_context TEXT,
  essay_requirements JSONB, -- { "word_count": [200, 400], "key_concepts": [], "examples_required": true }
  essay_structure_guide TEXT,
  
  points INTEGER NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  hints TEXT[],
  time_estimate_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_id, question_number)
);

-- ============================================================================
-- USER EXAM PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_exam_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES professor_courses(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
  
  questions_completed INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  max_points INTEGER NOT NULL,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

-- ============================================================================
-- USER EXAM ANSWERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  progress_id UUID NOT NULL REFERENCES user_exam_progress(id) ON DELETE CASCADE,
  
  -- For fill-in-the-blanks
  blank_answers JSONB, -- { "1": "answer1", "2": "answer2" }
  
  -- For output tracing
  output_answer TEXT,
  
  -- For essay questions
  essay_answer TEXT,
  word_count INTEGER,
  
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  auto_graded BOOLEAN DEFAULT false,
  manually_reviewed BOOLEAN DEFAULT false,
  reviewer_feedback TEXT,
  
  hints_used INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  
  first_attempted_at TIMESTAMP WITH TIME ZONE,
  last_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, question_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_exam_templates_course ON exam_templates(course_id);
CREATE INDEX idx_exam_questions_template ON exam_questions(template_id);
CREATE INDEX idx_user_progress_user ON user_exam_progress(user_id);
CREATE INDEX idx_user_progress_course ON user_exam_progress(course_id);
CREATE INDEX idx_user_progress_template ON user_exam_progress(template_id);
CREATE INDEX idx_user_progress_status ON user_exam_progress(status);
CREATE INDEX idx_user_answers_user ON user_exam_answers(user_id);
CREATE INDEX idx_user_answers_question ON user_exam_answers(question_id);
CREATE INDEX idx_user_answers_progress ON user_exam_answers(progress_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_answers ENABLE ROW LEVEL SECURITY;

-- Public read access for courses, templates, and questions
CREATE POLICY "Courses are viewable by everyone" ON professor_courses FOR SELECT USING (true);
CREATE POLICY "Templates are viewable by everyone" ON exam_templates FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON exam_questions FOR SELECT USING (true);

-- Users can view their own progress and answers
CREATE POLICY "Users can view own progress" ON user_exam_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_exam_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_exam_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON user_exam_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON user_exam_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON user_exam_answers FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professor_courses_updated_at BEFORE UPDATE ON professor_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_templates_updated_at BEFORE UPDATE ON exam_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON exam_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_progress_updated_at BEFORE UPDATE ON user_exam_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_answers_updated_at BEFORE UPDATE ON user_exam_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function to start exam (create progress record)
CREATE OR REPLACE FUNCTION start_exam_session(
  p_user_id UUID,
  p_course_id UUID,
  p_template_id UUID,
  p_total_questions INTEGER,
  p_max_points INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  -- Check if progress already exists
  SELECT id INTO v_progress_id
  FROM user_exam_progress
  WHERE user_id = p_user_id AND template_id = p_template_id;
  
  IF v_progress_id IS NULL THEN
    -- Create new progress record
    INSERT INTO user_exam_progress (
      user_id, course_id, template_id, total_questions, max_points
    ) VALUES (
      p_user_id, p_course_id, p_template_id, p_total_questions, p_max_points
    )
    RETURNING id INTO v_progress_id;
  ELSE
    -- Update last_practiced_at
    UPDATE user_exam_progress
    SET last_practiced_at = NOW()
    WHERE id = v_progress_id;
  END IF;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check fill-in-the-blanks answer
CREATE OR REPLACE FUNCTION check_blanks_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_blank_answers JSONB,
  p_time_spent INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_expected_blanks JSONB;
  v_question_points INTEGER;
  v_is_correct BOOLEAN := true;
  v_points_earned INTEGER := 0;
  v_answer_id UUID;
  v_blank_key TEXT;
  v_expected_value TEXT;
  v_user_value TEXT;
BEGIN
  -- Get expected answers and points
  SELECT blanks, points INTO v_expected_blanks, v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Check each blank
  FOR v_blank_key, v_expected_value IN SELECT key, value FROM jsonb_each_text(v_expected_blanks)
  LOOP
    v_user_value := p_blank_answers->>v_blank_key;
    IF TRIM(LOWER(v_user_value)) != TRIM(LOWER(v_expected_value)) THEN
      v_is_correct := false;
    END IF;
  END LOOP;
  
  -- Calculate points
  IF v_is_correct THEN
    v_points_earned := v_question_points;
  END IF;
  
  -- Insert or update answer
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, blank_answers,
    is_correct, points_earned, auto_graded, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_blank_answers,
    v_is_correct, v_points_earned, true, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    blank_answers = p_blank_answers,
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

-- Function to check output tracing answer
CREATE OR REPLACE FUNCTION check_output_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_output_answer TEXT,
  p_time_spent INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_expected_output TEXT;
  v_question_points INTEGER;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER := 0;
  v_answer_id UUID;
BEGIN
  -- Get expected output and points
  SELECT expected_output, points INTO v_expected_output, v_question_points
  FROM exam_questions
  WHERE id = p_question_id;
  
  -- Check if output matches (exact match with trimmed whitespace)
  v_is_correct := TRIM(p_output_answer) = TRIM(v_expected_output);
  
  -- Calculate points
  IF v_is_correct THEN
    v_points_earned := v_question_points;
  END IF;
  
  -- Insert or update answer
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, output_answer,
    is_correct, points_earned, auto_graded, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_output_answer,
    v_is_correct, v_points_earned, true, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    output_answer = p_output_answer,
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

-- Function to submit essay answer
CREATE OR REPLACE FUNCTION submit_essay_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_progress_id UUID,
  p_essay_answer TEXT,
  p_word_count INTEGER,
  p_time_spent INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_answer_id UUID;
BEGIN
  -- Insert or update answer (essays need manual review)
  INSERT INTO user_exam_answers (
    user_id, question_id, progress_id, essay_answer, word_count,
    auto_graded, manually_reviewed, time_spent_seconds,
    attempt_count, first_attempted_at, submitted_at
  ) VALUES (
    p_user_id, p_question_id, p_progress_id, p_essay_answer, p_word_count,
    false, false, p_time_spent,
    1, NOW(), NOW()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    essay_answer = p_essay_answer,
    word_count = p_word_count,
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
    last_practiced_at = NOW()
  WHERE id = p_progress_id;
  
  RETURN v_answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample courses
INSERT INTO professor_courses (course_code, name, description, professor_name, semester, student_count, exam_style, difficulty) VALUES
('CS 101', 'Fundamentals of Programming', 'Introduction to programming concepts, variables, loops, and functions', 'Dr. Smith', 'Fall 2024', 120, 'code-heavy', 'Easy'),
('CS 102', 'Object-Oriented Programming', 'Classes, objects, inheritance, polymorphism, and design patterns', 'Prof. Johnson', 'Fall 2024', 95, 'design-patterns', 'Medium'),
('CS 103', 'Introduction to Computing', 'Overview of computer science concepts and problem-solving techniques', 'Dr. Williams', 'Fall 2024', 150, 'balanced', 'Easy'),
('CS 250', 'Software Engineering', 'Software development lifecycle, testing, and best practices', 'Prof. Davis', 'Fall 2024', 80, 'balanced', 'Medium');

-- Insert sample templates for CS 101
INSERT INTO exam_templates (course_id, exam_type, title, description, duration_minutes, question_count, total_points, instructions) VALUES
((SELECT id FROM professor_courses WHERE course_code = 'CS 101'), 'code_analysis', 'Code Analysis Exam', 'Fill in missing parts of code given snippets and expected outputs', 30, 8, 80, 'Complete each code snippet by filling in the blanks. Pay attention to syntax and logic.'),
((SELECT id FROM professor_courses WHERE course_code = 'CS 101'), 'output_tracing', 'Output Tracing Exam', 'Write the expected program output for given code snippets', 25, 6, 60, 'Trace through the code and write the exact output. Include all spaces, punctuation, and line breaks.'),
((SELECT id FROM professor_courses WHERE course_code = 'CS 101'), 'essay', 'Essay Questions Exam', 'Answer conceptual questions about programming logic and best practices', 45, 4, 100, 'Write comprehensive responses addressing all key points. Use clear, professional language and provide examples.');

-- Add sample questions for Code Analysis
INSERT INTO exam_questions (template_id, question_number, title, question_text, question_type, code_snippet, blanks, points, difficulty, hints, time_estimate_minutes) VALUES
((SELECT id FROM exam_templates WHERE title = 'Code Analysis Exam'), 1, 'Array Sum Function', 'Complete the function that calculates the sum of all elements in an array. The expected output is shown below.', 'fill_blanks',
'def array_sum(arr):
    total = __BLANK1__
    for i in range(__BLANK2__):
        total += __BLANK3__
    return total

# Test case
numbers = [1, 2, 3, 4, 5]
result = array_sum(numbers)
print(result)', 
'{"1": "0", "2": "len(arr)", "3": "arr[i]"}',
10, 'Easy', ARRAY['Initialize variables before using them', 'Use len() to get array length', 'Access array elements with index'], 5);

COMMENT ON TABLE professor_courses IS 'Stores professor course information for exam simulations';
COMMENT ON TABLE exam_templates IS 'Exam templates with different types (code analysis, output tracing, essay)';
COMMENT ON TABLE exam_questions IS 'Individual questions for each exam template';
COMMENT ON TABLE user_exam_progress IS 'Tracks user progress through exam templates';
COMMENT ON TABLE user_exam_answers IS 'Stores user answers and grading results';

-- Create practice_sessions table for tracking timed practice sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  time_limit INTEGER NOT NULL, -- in minutes
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  problems_attempted INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX idx_practice_sessions_started_at ON practice_sessions(started_at DESC);

-- Create session_problems junction table to track which problems were attempted in each session
CREATE TABLE IF NOT EXISTS session_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'solved', 'attempted')) DEFAULT 'pending',
  attempted_at TIMESTAMP WITH TIME ZONE,
  solved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, problem_id)
);

-- Create index for session_problems
CREATE INDEX idx_session_problems_session_id ON session_problems(session_id);
CREATE INDEX idx_session_problems_problem_id ON session_problems(problem_id);

-- Enable RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_problems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions"
  ON practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for session_problems
CREATE POLICY "Users can view their session problems"
  ON session_problems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = session_problems.session_id
      AND practice_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create session problems"
  ON session_problems FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = session_problems.session_id
      AND practice_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their session problems"
  ON session_problems FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = session_problems.session_id
      AND practice_sessions.user_id = auth.uid()
    )
  );

-- Function to update practice_sessions.updated_at
CREATE OR REPLACE FUNCTION update_practice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_sessions_updated_at();

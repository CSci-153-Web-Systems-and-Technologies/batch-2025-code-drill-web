-- Create user_skills table for tracking skill progress by category
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  skill_level TEXT CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) DEFAULT 'Beginner',
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create skill_badges table for achievement tracking
CREATE TABLE IF NOT EXISTS skill_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  badge_type TEXT CHECK (badge_type IN ('Bronze', 'Silver', 'Gold', 'Platinum')) NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, badge_type)
);

-- Create study_plans table for personalized learning paths
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_category TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_plan_problems junction table
CREATE TABLE IF NOT EXISTS study_plan_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(study_plan_id, problem_id)
);

-- Create indexes
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_category ON user_skills(category);
CREATE INDEX idx_user_skills_skill_level ON user_skills(skill_level);
CREATE INDEX idx_skill_badges_user_id ON skill_badges(user_id);
CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_study_plans_status ON study_plans(status);
CREATE INDEX idx_study_plan_problems_plan_id ON study_plan_problems(study_plan_id);

-- Enable RLS
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_problems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_skills
CREATE POLICY "Users can view their own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for skill_badges
CREATE POLICY "Users can view their own badges"
  ON skill_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges"
  ON skill_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_plans
CREATE POLICY "Users can view their own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plans"
  ON study_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for study_plan_problems
CREATE POLICY "Users can view their study plan problems"
  ON study_plan_problems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_plans
      WHERE study_plans.id = study_plan_problems.study_plan_id
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their study plan problems"
  ON study_plan_problems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM study_plans
      WHERE study_plans.id = study_plan_problems.study_plan_id
      AND study_plans.user_id = auth.uid()
    )
  );

-- Function to update user_skills.updated_at
CREATE OR REPLACE FUNCTION update_user_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_skills
CREATE TRIGGER user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skills_updated_at();

-- Function to calculate skill level based on problems solved
CREATE OR REPLACE FUNCTION calculate_skill_level(
  p_problems_solved INTEGER,
  p_easy_solved INTEGER,
  p_medium_solved INTEGER,
  p_hard_solved INTEGER
)
RETURNS TEXT AS $$
BEGIN
  -- Expert: 30+ solved with good difficulty distribution
  IF p_problems_solved >= 30 AND p_hard_solved >= 5 THEN
    RETURN 'Expert';
  -- Advanced: 15+ solved with some hard problems
  ELSIF p_problems_solved >= 15 AND (p_medium_solved >= 5 OR p_hard_solved >= 2) THEN
    RETURN 'Advanced';
  -- Intermediate: 6+ solved with some progression
  ELSIF p_problems_solved >= 6 THEN
    RETURN 'Intermediate';
  -- Beginner: < 6 solved
  ELSE
    RETURN 'Beginner';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user skills after submission
CREATE OR REPLACE FUNCTION update_user_skill_progress(
  p_user_id UUID,
  p_problem_id UUID,
  p_points_earned INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_category TEXT;
  v_difficulty TEXT;
  v_skill user_skills%ROWTYPE;
  v_new_level TEXT;
  v_badges_earned TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get problem category and difficulty
  SELECT category, difficulty INTO v_category, v_difficulty
  FROM problems
  WHERE id = p_problem_id;

  IF v_category IS NULL THEN
    RETURN json_build_object('error', 'Problem not found');
  END IF;

  -- Insert or update user_skills
  INSERT INTO user_skills (
    user_id,
    category,
    problems_solved,
    problems_attempted,
    easy_solved,
    medium_solved,
    hard_solved,
    total_points,
    last_practiced_at
  ) VALUES (
    p_user_id,
    v_category,
    1,
    1,
    CASE WHEN v_difficulty = 'easy' THEN 1 ELSE 0 END,
    CASE WHEN v_difficulty = 'medium' THEN 1 ELSE 0 END,
    CASE WHEN v_difficulty = 'hard' THEN 1 ELSE 0 END,
    p_points_earned,
    NOW()
  )
  ON CONFLICT (user_id, category) DO UPDATE SET
    problems_solved = user_skills.problems_solved + 1,
    problems_attempted = user_skills.problems_attempted + 1,
    easy_solved = user_skills.easy_solved + CASE WHEN v_difficulty = 'easy' THEN 1 ELSE 0 END,
    medium_solved = user_skills.medium_solved + CASE WHEN v_difficulty = 'medium' THEN 1 ELSE 0 END,
    hard_solved = user_skills.hard_solved + CASE WHEN v_difficulty = 'hard' THEN 1 ELSE 0 END,
    total_points = user_skills.total_points + p_points_earned,
    last_practiced_at = NOW()
  RETURNING * INTO v_skill;

  -- Calculate new skill level
  v_new_level := calculate_skill_level(
    v_skill.problems_solved,
    v_skill.easy_solved,
    v_skill.medium_solved,
    v_skill.hard_solved
  );

  -- Update skill level if changed
  IF v_new_level != v_skill.skill_level THEN
    UPDATE user_skills
    SET skill_level = v_new_level
    WHERE id = v_skill.id;
  END IF;

  -- Check and award badges
  -- Bronze: 5 problems solved
  IF v_skill.problems_solved >= 5 THEN
    INSERT INTO skill_badges (user_id, category, badge_type)
    VALUES (p_user_id, v_category, 'Bronze')
    ON CONFLICT (user_id, category, badge_type) DO NOTHING
    RETURNING badge_type INTO v_badges_earned[1];
  END IF;

  -- Silver: 15 problems solved
  IF v_skill.problems_solved >= 15 THEN
    INSERT INTO skill_badges (user_id, category, badge_type)
    VALUES (p_user_id, v_category, 'Silver')
    ON CONFLICT (user_id, category, badge_type) DO NOTHING
    RETURNING badge_type INTO v_badges_earned[2];
  END IF;

  -- Gold: 30 problems solved
  IF v_skill.problems_solved >= 30 THEN
    INSERT INTO skill_badges (user_id, category, badge_type)
    VALUES (p_user_id, v_category, 'Gold')
    ON CONFLICT (user_id, category, badge_type) DO NOTHING
    RETURNING badge_type INTO v_badges_earned[3];
  END IF;

  -- Platinum: 50 problems solved with good distribution
  IF v_skill.problems_solved >= 50 AND v_skill.hard_solved >= 10 THEN
    INSERT INTO skill_badges (user_id, category, badge_type)
    VALUES (p_user_id, v_category, 'Platinum')
    ON CONFLICT (user_id, category, badge_type) DO NOTHING
    RETURNING badge_type INTO v_badges_earned[4];
  END IF;

  RETURN json_build_object(
    'category', v_category,
    'skill_level', v_new_level,
    'problems_solved', v_skill.problems_solved,
    'badges_earned', v_badges_earned,
    'level_up', v_new_level != v_skill.skill_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get weak categories for study plan generation
CREATE OR REPLACE FUNCTION get_weak_categories(p_user_id UUID)
RETURNS TABLE(
  category TEXT,
  problems_solved INTEGER,
  skill_level TEXT,
  recommended_difficulty TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.category,
    us.problems_solved,
    us.skill_level,
    CASE 
      WHEN us.easy_solved < 3 THEN 'easy'
      WHEN us.medium_solved < 5 THEN 'medium'
      ELSE 'hard'
    END as recommended_difficulty
  FROM user_skills us
  WHERE us.user_id = p_user_id
  ORDER BY us.problems_solved ASC, us.last_practiced_at ASC NULLS FIRST
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

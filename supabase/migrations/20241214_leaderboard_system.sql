-- =====================================================
-- Leaderboard System Migration
-- Features: Global/Course/Category rankings, Achievement badges,
-- Rank history, Privacy controls, CSV export
-- =====================================================

-- Add leaderboard visibility column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT true;

-- Create rank_snapshots table for historical rank tracking
CREATE TABLE IF NOT EXISTS rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  problems_solved INTEGER NOT NULL,
  avg_score DECIMAL(5,2),
  current_streak INTEGER NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  course_id UUID REFERENCES professor_courses(id) ON DELETE CASCADE,
  category VARCHAR(50), -- 'arrays', 'strings', 'dp', 'trees', 'graphs', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date, course_id, category)
);

-- Create indexes for rank_snapshots
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_user_id ON rank_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_date ON rank_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_course ON rank_snapshots(course_id);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_category ON rank_snapshots(category);

-- Create achievement_badges table
CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  unlock_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Seed achievement badges with emojis
INSERT INTO achievement_badges (name, emoji, description, unlock_criteria)
VALUES 
  ('Rising Star', '🌟', 'Climbed 10+ ranks in the past week', '{"type": "rank_improvement", "amount": 10, "timeframe": "week"}'),
  ('Consistent', '🔥', 'Maintained a 7-day streak', '{"type": "streak", "days": 7}'),
  ('Problem Master', '🏆', 'Solved 50+ problems', '{"type": "problems_solved", "count": 50}'),
  ('Speed Demon', '⚡', 'Solved 10 problems in one day', '{"type": "daily_problems", "count": 10}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- RPC Functions
-- =====================================================

-- Drop existing functions to avoid conflicts (CASCADE to handle all overloads)
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS get_user_rank CASCADE;
    DROP FUNCTION IF EXISTS get_leaderboard CASCADE;
    DROP FUNCTION IF EXISTS get_rank_history CASCADE;
    DROP FUNCTION IF EXISTS create_rank_snapshot CASCADE;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Function to get user's current rank (global or course-specific)
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID, p_course_id UUID DEFAULT NULL, p_category VARCHAR DEFAULT NULL)
RETURNS TABLE (
  rank BIGINT,
  total_users BIGINT,
  total_points INTEGER,
  problems_solved INTEGER,
  avg_score DECIMAL(5,2),
  current_streak INTEGER,
  badges JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      u.id,
      u.total_points,
      u.problems_solved,
      u.avg_score,
      u.current_streak,
      ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.problems_solved DESC, u.avg_score DESC) as user_rank
    FROM users u
    WHERE u.leaderboard_visible = true
      AND u.role = 'student'::user_role
  ),
  user_badge_list AS (
    SELECT 
      ub.user_id,
      jsonb_agg(
        jsonb_build_object(
          'name', ab.name,
          'emoji', ab.emoji,
          'description', ab.description,
          'earned_at', ub.earned_at
        ) ORDER BY ub.earned_at DESC
      ) as user_badges
    FROM user_badges ub
    JOIN achievement_badges ab ON ub.badge_id = ab.id
    WHERE ub.user_id = p_user_id
    GROUP BY ub.user_id
  )
  SELECT 
    ru.user_rank,
    COUNT(*) OVER () as total_users,
    ru.total_points,
    ru.problems_solved,
    ru.avg_score,
    ru.current_streak,
    COALESCE(ubl.user_badges, '[]'::jsonb) as badges
  FROM ranked_users ru
  LEFT JOIN user_badge_list ubl ON ru.id = ubl.user_id
  WHERE ru.id = p_user_id;
END;
$$;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_course_id UUID DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  rank BIGINT,
  name VARCHAR,
  email VARCHAR,
  total_points INTEGER,
  problems_solved INTEGER,
  avg_score DECIMAL(5,2),
  current_streak INTEGER,
  rank_change INTEGER,
  badges JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      u.id,
      u.name,
      u.email,
      u.total_points,
      u.problems_solved,
      u.avg_score,
      u.current_streak,
      ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.problems_solved DESC, u.avg_score DESC) as user_rank
    FROM users u
    WHERE u.leaderboard_visible = true
      AND u.role = 'student'::user_role
  ),
  previous_ranks AS (
    SELECT 
      rs.user_id,
      rs.rank as prev_rank
    FROM rank_snapshots rs
    WHERE rs.snapshot_date = (
      SELECT MAX(snapshot_date) 
      FROM rank_snapshots 
      WHERE snapshot_date < CURRENT_DATE
        AND (p_course_id IS NULL OR course_id = p_course_id)
        AND (p_category IS NULL OR category = p_category)
    )
    AND (p_course_id IS NULL OR rs.course_id = p_course_id)
    AND (p_category IS NULL OR rs.category = p_category)
  ),
  user_badge_list AS (
    SELECT 
      ub.user_id,
      jsonb_agg(
        jsonb_build_object(
          'name', ab.name,
          'emoji', ab.emoji,
          'description', ab.description,
          'earned_at', ub.earned_at
        ) ORDER BY ub.earned_at DESC
      ) as user_badges
    FROM user_badges ub
    JOIN achievement_badges ab ON ub.badge_id = ab.id
    GROUP BY ub.user_id
  )
  SELECT 
    ru.id as user_id,
    ru.user_rank,
    ru.name,
    ru.email,
    ru.total_points,
    ru.problems_solved,
    ru.avg_score,
    ru.current_streak,
    CASE 
      WHEN pr.prev_rank IS NULL THEN 0
      ELSE (pr.prev_rank - ru.user_rank)::INTEGER
    END as rank_change,
    COALESCE(ubl.user_badges, '[]'::jsonb) as badges
  FROM ranked_users ru
  LEFT JOIN previous_ranks pr ON ru.id = pr.user_id
  LEFT JOIN user_badge_list ubl ON ru.id = ubl.user_id
  ORDER BY ru.user_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get rank history for a user (last 30 days)
CREATE OR REPLACE FUNCTION get_rank_history(p_user_id UUID, p_course_id UUID DEFAULT NULL)
RETURNS TABLE (
  snapshot_date DATE,
  rank INTEGER,
  total_points INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.snapshot_date,
    rs.rank,
    rs.total_points
  FROM rank_snapshots rs
  WHERE rs.user_id = p_user_id
    AND (p_course_id IS NULL OR rs.course_id = p_course_id)
    AND rs.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY rs.snapshot_date ASC;
END;
$$;

-- Function to create rank snapshot
CREATE OR REPLACE FUNCTION create_rank_snapshot(p_user_id UUID, p_course_id UUID DEFAULT NULL, p_category VARCHAR DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_rank BIGINT;
  v_total_points INTEGER;
  v_problems_solved INTEGER;
  v_avg_score DECIMAL(5,2);
  v_current_streak INTEGER;
BEGIN
  -- Get current rank and stats
  SELECT 
    user_rank,
    total_points,
    problems_solved,
    avg_score,
    current_streak
  INTO v_rank, v_total_points, v_problems_solved, v_avg_score, v_current_streak
  FROM (
    SELECT 
      u.id,
      u.total_points,
      u.problems_solved,
      u.avg_score,
      u.current_streak,
      ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.problems_solved DESC, u.avg_score DESC) as user_rank
    FROM users u
    WHERE u.leaderboard_visible = true
      AND u.role = 'student'::user_role
  ) ranked_users
  WHERE id = p_user_id;
  
  -- Insert snapshot (on conflict update)
  INSERT INTO rank_snapshots (user_id, rank, total_points, problems_solved, avg_score, current_streak, course_id, category)
  VALUES (p_user_id, v_rank, v_total_points, v_problems_solved, v_avg_score, v_current_streak, p_course_id, p_category)
  ON CONFLICT (user_id, snapshot_date, course_id, category)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    total_points = EXCLUDED.total_points,
    problems_solved = EXCLUDED.problems_solved,
    avg_score = EXCLUDED.avg_score,
    current_streak = EXCLUDED.current_streak;
END;
$$;

-- Grant permissions
GRANT SELECT ON rank_snapshots TO authenticated;
GRANT SELECT ON achievement_badges TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT INSERT ON rank_snapshots TO authenticated;
GRANT INSERT ON user_badges TO authenticated;

-- Comments
COMMENT ON TABLE rank_snapshots IS 'Historical rank tracking for leaderboard trend analysis';
COMMENT ON TABLE achievement_badges IS 'Achievement badges with emoji icons';
COMMENT ON TABLE user_badges IS 'User-earned achievement badges';
COMMENT ON FUNCTION get_user_rank IS 'Get user current rank with badges';
COMMENT ON FUNCTION get_leaderboard IS 'Get paginated leaderboard with rank changes';
COMMENT ON FUNCTION get_rank_history IS 'Get 30-day rank history for charts';
COMMENT ON FUNCTION create_rank_snapshot IS 'Create daily rank snapshot';

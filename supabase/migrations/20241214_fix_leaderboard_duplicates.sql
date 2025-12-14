-- Fix leaderboard duplicates by ensuring proper grouping in user_badge_list CTE

DROP FUNCTION IF EXISTS get_leaderboard CASCADE;

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_course_id UUID DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  rank BIGINT,
  name TEXT,
  email TEXT,
  total_points INTEGER,
  problems_solved INTEGER,
  avg_score INTEGER,
  current_streak INTEGER,
  rank_change INTEGER,
  badges JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
    WHERE (u.leaderboard_visible = true OR u.leaderboard_visible IS NULL)
      AND u.role = 'student'::user_role
  ),
  previous_ranks AS (
    SELECT DISTINCT ON (rs.user_id)
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
  SELECT DISTINCT
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

COMMENT ON FUNCTION get_leaderboard IS 'Get paginated leaderboard with rank changes (deduplicated)';

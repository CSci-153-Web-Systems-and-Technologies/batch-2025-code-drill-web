-- Diagnostic query to check leaderboard visibility issues
-- Run this in Supabase SQL Editor to see all student data

-- 1. Check all users with student role
SELECT 
  id,
  name,
  email,
  role,
  leaderboard_visible,
  total_points,
  problems_solved,
  avg_score,
  current_streak
FROM users
WHERE role = 'student'
ORDER BY total_points DESC;

-- 2. Check what the get_leaderboard function returns
SELECT * FROM get_leaderboard(NULL, NULL, 100, 0);

-- 3. Force update all students to be visible (run this if needed)
-- UPDATE users SET leaderboard_visible = true WHERE role = 'student';

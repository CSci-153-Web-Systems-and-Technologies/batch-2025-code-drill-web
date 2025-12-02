# Scoring System Database Setup

## Overview
This document contains the SQL schema and database functions for the CodeDrill points and scoring system.

## Database Schema Updates

### 1. Add Columns to Submissions Table

```sql
-- Add points and solve time tracking to submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS solve_time_seconds INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.submissions.points_earned IS 'Total points earned for this submission (includes bonuses)';
COMMENT ON COLUMN public.submissions.solve_time_seconds IS 'Time taken to solve (from problem view to submission)';
```

### 2. Add Columns to Users Table for Streak Tracking

```sql
-- Add streak tracking columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active_date DATE,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.users.last_active_date IS 'Last date user solved a problem (UTC)';
COMMENT ON COLUMN public.users.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN public.users.last_streak_update IS 'Timestamp of last streak calculation';
```

### 3. Create Indexes for Performance

```sql
-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);

-- Index for streak queries
CREATE INDEX IF NOT EXISTS idx_users_last_active_date ON public.users(last_active_date DESC);

-- Index for submission points queries
CREATE INDEX IF NOT EXISTS idx_submissions_points ON public.submissions(points_earned DESC);
```

## Database Functions

### 1. Update User Stats Function

This function atomically updates user statistics after a successful submission.

```sql
CREATE OR REPLACE FUNCTION public.update_user_stats(
  p_user_id UUID,
  p_problem_id UUID,
  p_points_earned INTEGER,
  p_difficulty TEXT,
  p_runtime INTEGER DEFAULT NULL,
  p_memory INTEGER DEFAULT NULL,
  p_is_first_solve BOOLEAN DEFAULT FALSE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INTEGER;
  v_current_solved INTEGER;
  v_current_avg INTEGER;
  v_new_total_points INTEGER;
  v_new_problems_solved INTEGER;
  v_new_avg_score INTEGER;
  v_existing_progress RECORD;
BEGIN
  -- Get current user stats
  SELECT total_points, problems_solved, avg_score
  INTO v_current_points, v_current_solved, v_current_avg
  FROM public.users
  WHERE id = p_user_id;

  -- Check if this is a new problem solve or improvement
  SELECT * INTO v_existing_progress
  FROM public.user_problem_progress
  WHERE user_id = p_user_id AND problem_id = p_problem_id;

  -- Calculate new values
  v_new_total_points := v_current_points + p_points_earned;
  
  -- Only increment problems_solved if this is the first time solving this problem
  IF v_existing_progress IS NULL OR v_existing_progress.status != 'Solved' THEN
    v_new_problems_solved := v_current_solved + 1;
  ELSE
    v_new_problems_solved := v_current_solved;
  END IF;

  -- Calculate new average score
  IF v_new_problems_solved > 0 THEN
    v_new_avg_score := v_new_total_points / v_new_problems_solved;
  ELSE
    v_new_avg_score := 0;
  END IF;

  -- Update users table
  UPDATE public.users
  SET 
    total_points = v_new_total_points,
    problems_solved = v_new_problems_solved,
    avg_score = v_new_avg_score,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Upsert user_problem_progress
  INSERT INTO public.user_problem_progress (
    user_id,
    problem_id,
    status,
    best_runtime,
    best_memory,
    attempts,
    last_attempted_at,
    solved_at
  ) VALUES (
    p_user_id,
    p_problem_id,
    'Solved',
    p_runtime,
    p_memory,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, problem_id) 
  DO UPDATE SET
    status = 'Solved',
    best_runtime = CASE 
      WHEN p_runtime IS NOT NULL AND (user_problem_progress.best_runtime IS NULL OR p_runtime < user_problem_progress.best_runtime)
      THEN p_runtime
      ELSE user_problem_progress.best_runtime
    END,
    best_memory = CASE 
      WHEN p_memory IS NOT NULL AND (user_problem_progress.best_memory IS NULL OR p_memory < user_problem_progress.best_memory)
      THEN p_memory
      ELSE user_problem_progress.best_memory
    END,
    attempts = user_problem_progress.attempts + 1,
    last_attempted_at = NOW(),
    solved_at = CASE 
      WHEN user_problem_progress.solved_at IS NULL 
      THEN NOW()
      ELSE user_problem_progress.solved_at
    END;

  -- Return updated stats
  RETURN json_build_object(
    'success', true,
    'total_points', v_new_total_points,
    'problems_solved', v_new_problems_solved,
    'avg_score', v_new_avg_score,
    'is_new_solve', (v_existing_progress IS NULL OR v_existing_progress.status != 'Solved')
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_stats TO authenticated;
```

### 2. Increment Problem Attempts Function

This function safely increments the attempt counter for a problem.

```sql
CREATE OR REPLACE FUNCTION public.increment_problem_attempts(
  p_user_id UUID,
  p_problem_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert attempt record
  INSERT INTO public.user_problem_progress (
    user_id,
    problem_id,
    status,
    attempts,
    last_attempted_at
  ) VALUES (
    p_user_id,
    p_problem_id,
    'Attempted',
    1,
    NOW()
  )
  ON CONFLICT (user_id, problem_id) 
  DO UPDATE SET
    status = CASE 
      WHEN user_problem_progress.status = 'Not Started' 
      THEN 'Attempted'
      ELSE user_problem_progress.status
    END,
    attempts = user_problem_progress.attempts + 1,
    last_attempted_at = NOW();

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_problem_attempts TO authenticated;
```

### 3. Update Daily Streak Function

This function updates the user's daily streak with grace period logic.

```sql
CREATE OR REPLACE FUNCTION public.update_daily_streak(
  p_user_id UUID,
  p_activity_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_active DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_grace_period_used BOOLEAN := false;
  v_days_since_last INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM public.users
  WHERE id = p_user_id;

  -- Handle first time activity
  IF v_last_active IS NULL THEN
    v_new_streak := 1;
  ELSE
    -- Calculate days since last activity
    v_days_since_last := p_activity_date - v_last_active;

    -- Streak logic with grace period
    IF v_days_since_last = 0 THEN
      -- Same day, no change
      v_new_streak := v_current_streak;
    ELSIF v_days_since_last = 1 THEN
      -- Consecutive day, increment
      v_new_streak := v_current_streak + 1;
    ELSIF v_days_since_last = 2 THEN
      -- Grace period used, maintain streak but flag it
      v_new_streak := v_current_streak + 1;
      v_grace_period_used := true;
    ELSE
      -- Streak broken, reset to 1
      v_new_streak := 1;
    END IF;
  END IF;

  -- Update longest streak if current exceeds it
  IF v_longest_streak IS NULL OR v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;

  -- Update users table
  UPDATE public.users
  SET 
    last_active_date = p_activity_date,
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    last_streak_update = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return streak info
  RETURN json_build_object(
    'success', true,
    'current_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'grace_period_used', v_grace_period_used,
    'days_since_last', v_days_since_last
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_daily_streak TO authenticated;
```

### 4. Get User Rank Function

This function calculates a user's rank on the leaderboard.

```sql
CREATE OR REPLACE FUNCTION public.get_user_rank(
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_points INTEGER;
  v_rank INTEGER;
  v_total_users INTEGER;
BEGIN
  -- Get user's total points
  SELECT total_points INTO v_user_points
  FROM public.users
  WHERE id = p_user_id;

  -- Calculate rank (number of users with more points + 1)
  SELECT COUNT(*) + 1 INTO v_rank
  FROM public.users
  WHERE total_points > v_user_points;

  -- Get total number of users
  SELECT COUNT(*) INTO v_total_users
  FROM public.users;

  RETURN json_build_object(
    'success', true,
    'rank', v_rank,
    'total_users', v_total_users,
    'total_points', v_user_points
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_rank TO authenticated;
```

## Setup Instructions

### 1. Run Schema Updates
Execute the ALTER TABLE statements in the Supabase SQL Editor to add new columns.

### 2. Create Database Functions
Run all CREATE FUNCTION statements in order. These functions will be used by the application to update user stats.

### 3. Test Functions
Test each function with sample data:

```sql
-- Test update_user_stats
SELECT public.update_user_stats(
  'your-user-id'::UUID,
  'some-problem-id'::UUID,
  25,
  'Easy',
  82,
  42100,
  true
);

-- Test update_daily_streak
SELECT public.update_daily_streak('your-user-id'::UUID);

-- Test get_user_rank
SELECT public.get_user_rank('your-user-id'::UUID);
```

### 4. Verify Indexes
Check that all indexes were created successfully:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'submissions', 'user_problem_progress');
```

## Transaction Safety

All database functions use PostgreSQL's ACID properties to ensure data consistency:

- **Atomicity:** All updates within a function succeed or fail together
- **Consistency:** Constraints and checks maintain data integrity
- **Isolation:** Concurrent calls don't interfere with each other
- **Durability:** Committed changes are permanent

## Error Handling

The functions include error handling for:
- Missing user or problem records
- NULL value handling
- Concurrent update conflicts
- Data type mismatches

## Performance Considerations

1. **Indexes:** Created on frequently queried columns (total_points, last_active_date)
2. **SECURITY DEFINER:** Functions run with creator privileges for RLS bypass
3. **Selective Updates:** Only update columns that actually changed
4. **Efficient Queries:** Use direct lookups instead of scans where possible

## Rollback Instructions

If you need to rollback these changes:

```sql
-- Remove functions
DROP FUNCTION IF EXISTS public.update_user_stats;
DROP FUNCTION IF EXISTS public.increment_problem_attempts;
DROP FUNCTION IF EXISTS public.update_daily_streak;
DROP FUNCTION IF EXISTS public.get_user_rank;

-- Remove columns (WARNING: This deletes data)
ALTER TABLE public.submissions 
DROP COLUMN IF EXISTS points_earned,
DROP COLUMN IF EXISTS solve_time_seconds;

ALTER TABLE public.users
DROP COLUMN IF EXISTS last_active_date,
DROP COLUMN IF EXISTS longest_streak,
DROP COLUMN IF EXISTS last_streak_update;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_total_points;
DROP INDEX IF EXISTS idx_users_last_active_date;
DROP INDEX IF EXISTS idx_submissions_points;
```

## Migration Notes

- Existing submissions will have `points_earned = 0` and `solve_time_seconds = NULL`
- Points are only calculated for new submissions after this implementation
- Streaks start from 0 for all users until they solve their first problem
- Historical data won't have streak information

---

*Last Updated: December 2, 2025*
*Version: 1.0.0*

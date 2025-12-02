# Practice Sessions Setup Guide

## Database Migration Required

The practice sessions feature requires new database tables. Follow these steps to set up the database:

### Step 1: Run the Migration in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `batch-2025-code-drill-web`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20241202_practice_sessions.sql`
6. Paste into the SQL editor
7. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify Tables Created

Run this query to verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('practice_sessions', 'session_problems');
```

You should see both tables listed.

### Step 3: Verify RLS Policies

Run this to check RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('practice_sessions', 'session_problems');
```

Both should show `rowsecurity = true`.

### Step 4: Test in Application

1. Navigate to `/practice` in your application
2. Configure a practice session
3. Click "Start Practice Session"
4. You should be redirected to the active session page

## Tables Created

### practice_sessions
- `id` - UUID primary key
- `user_id` - References auth.users
- `difficulty` - 'easy' | 'medium' | 'hard' | null
- `category` - Text (nullable)
- `time_limit` - Integer (minutes)
- `started_at` - Timestamp
- `completed_at` - Timestamp (nullable)
- `problems_attempted` - Integer
- `problems_solved` - Integer
- `total_score` - Integer
- `status` - 'active' | 'completed' | 'abandoned'
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)

### session_problems
- `id` - UUID primary key
- `session_id` - References practice_sessions
- `problem_id` - References problems
- `submission_id` - References submissions (nullable)
- `status` - 'pending' | 'solved' | 'attempted'
- `attempted_at` - Timestamp (nullable)
- `solved_at` - Timestamp (nullable)
- `created_at` - Timestamp

## RLS Policies

All policies ensure users can only access their own practice sessions:
- Users can view their own sessions
- Users can create their own sessions
- Users can update their own sessions
- Session problems inherit security from practice_sessions

## Troubleshooting

### Error: "relation practice_sessions does not exist"
**Solution:** Run the migration SQL in Supabase SQL Editor.

### Error: "Failed to create practice session"
**Possible causes:**
1. Migration not run yet
2. RLS policies blocking access
3. Invalid foreign key (check if problems table has data)

**Check problems exist:**
```sql
SELECT COUNT(*) FROM problems;
```

If count is 0, you need to add problems first using `PROBLEMS_SETUP.md`.

### Error: "No problems found matching criteria"
**Solution:** Either:
1. Select "All Difficulties" instead of specific difficulty
2. Add more problems to your database
3. Check if problems exist with: `SELECT difficulty, COUNT(*) FROM problems GROUP BY difficulty;`

## Next Steps

After successful setup:
1. Create a practice session with 30 minutes
2. Try solving a problem during the session
3. Check the practice history page
4. Verify timer countdown works correctly

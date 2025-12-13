# Essay Submission and Manual Grading Migration

## Overview
This migration adds a comprehensive essay submission and manual grading system that:
- Records essay submissions with metadata (word count, time spent, hints used)
- Marks submissions as requiring manual grading
- Allows professors to grade submissions with points and feedback
- Provides submission history for students
- Supports rubric-based scoring (optional)

## Database Changes

### New Columns in `user_exam_answers` Table
- `graded_by` (UUID) - References the professor who graded the submission
- `graded_at` (TIMESTAMP) - When the submission was graded
- `manual_points` (INTEGER) - Points awarded by manual grading
- `grading_rubric_scores` (JSONB) - Structured rubric scoring data
- `requires_grading` (BOOLEAN) - Flag for submissions needing manual review

### New RPC Functions
1. **submit_essay_answer** - Submit an essay answer for grading
2. **grade_essay_answer** - Grade a submitted essay (professor only)
3. **get_submissions_for_grading** - Get submissions for a course filtered by status
4. **get_student_submission_history** - Get a student's submission history

## Migration Order

**IMPORTANT**: Apply migrations in this exact order:

1. ✅ `20241214_remove_exam_templates.sql` - Remove template system
2. ✅ `20241214_fix_versioning_trigger.sql` - Fix versioning trigger
3. ⏳ `20241214_essay_submission_grading.sql` - **NEW** Add grading system

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20241214_essay_submission_grading.sql`
6. Click **Run** or press `Ctrl/Cmd + Enter`
7. Verify success message

### Option 2: Supabase CLI
```bash
# Make sure you're in the project root
cd /home/johndoe/Documents/gitprojects/web-dev-projects/batch-2025-code-drill-web

# Apply the migration
supabase db push

# Or apply specific migration file
supabase migration up
```

## Verification Steps

After applying the migration, verify:

1. **Check new columns exist:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_exam_answers' 
  AND column_name IN ('graded_by', 'graded_at', 'manual_points', 'grading_rubric_scores', 'requires_grading');
```

2. **Test RPC functions exist:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'submit_essay_answer',
  'grade_essay_answer',
  'get_submissions_for_grading',
  'get_student_submission_history'
);
```

3. **Submit a test essay:**
   - Log in as a student
   - Navigate to Professor Exams → Choose a course → Essay Questions
   - Complete and submit an essay question
   - Verify it appears in "My Submissions" page

4. **Test professor grading:**
   - Log in as a professor
   - Navigate to Courses → [Course] → Grade Submissions
   - Verify pending submissions appear
   - Grade a submission with points and feedback
   - Verify it moves to "Graded" tab

## Features Enabled

### For Students:
- Submit essay answers through the practice interface
- View all submissions in "My Submissions" page
- See grading status (Pending/Graded/Auto-graded)
- View professor feedback on graded submissions
- Track submission history across all courses

### For Professors:
- View all submissions for their courses
- Filter by pending/graded status
- Grade essays with:
  - Points awarded (0 to max_points)
  - Written feedback
  - Optional rubric scoring
- Track grading history
- See student information with each submission

## UI Access Points

### Students:
- **Submit Essays**: Professor Exams → [Course] → Essay Questions → Practice
- **View History**: Navigation → "My Submissions"

### Professors:
- **Grade Submissions**: Courses → [Course] → "Grade Submissions" button
- **View Stats**: Course page shows question counts by type

## Troubleshooting

### Migration Fails
- Ensure previous migrations (template removal, versioning fix) are applied first
- Check for syntax errors in the SQL
- Verify database connection

### RPC Functions Not Working
- Check function permissions in Supabase Dashboard
- Verify user authentication is working
- Check server action responses for error messages

### Submissions Not Appearing
- Verify migration was applied successfully
- Check that `requires_grading` is set to `true` for essay submissions
- Ensure course_id matches between submission and grading interface

## Rollback (if needed)

To rollback this migration:

```sql
-- Drop RPC functions
DROP FUNCTION IF EXISTS submit_essay_answer;
DROP FUNCTION IF EXISTS grade_essay_answer;
DROP FUNCTION IF EXISTS get_submissions_for_grading;
DROP FUNCTION IF EXISTS get_student_submission_history;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_exam_answers_graded_by;
DROP INDEX IF EXISTS idx_user_exam_answers_requires_grading;

-- Remove columns
ALTER TABLE user_exam_answers 
  DROP COLUMN IF EXISTS graded_by,
  DROP COLUMN IF EXISTS graded_at,
  DROP COLUMN IF EXISTS manual_points,
  DROP COLUMN IF EXISTS grading_rubric_scores,
  DROP COLUMN IF EXISTS requires_grading;
```

## Next Steps

After successful migration:
1. Test the full workflow (submit → grade → view history)
2. Consider adding email notifications for graded submissions
3. Add rubric scoring UI for more structured feedback
4. Implement submission analytics for professors

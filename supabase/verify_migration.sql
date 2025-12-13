-- Verification queries for essay submission and grading migration

-- 1. Check if new columns exist in user_exam_answers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_exam_answers' 
  AND column_name IN ('graded_by', 'graded_at', 'manual_points', 'grading_rubric_scores', 'requires_grading')
ORDER BY column_name;

-- Expected: Should return 5 rows

-- 2. Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_exam_answers'
  AND indexname IN ('idx_user_answers_requires_grading', 'idx_user_answers_graded_by');

-- Expected: Should return 2 rows

-- 3. Check if RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'submit_essay_answer',
  'grade_essay_answer',
  'get_submissions_for_grading',
  'get_student_submission_history'
)
AND routine_schema = 'public';

-- Expected: Should return 4 rows

-- 4. Test get_student_submission_history function (replace UUID with your user ID)
-- SELECT * FROM get_student_submission_history('your-user-id-here'::uuid);

-- 5. Check function signature
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_student_submission_history';

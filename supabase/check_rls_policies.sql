-- Check RLS policies on users table that might be filtering results
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled on users table
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

# Database Migration Instructions

## Template Removal Migration

This guide will help you apply the database migrations to remove the exam templates system.

### Prerequisites
- Access to Supabase SQL Editor
- Backup of your database (recommended)

### Migration Steps

#### Step 1: Apply the Main Template Removal Migration

Open Supabase SQL Editor and run the migration file:
```
supabase/migrations/20241214_remove_exam_templates.sql
```

This migration will:
- Create the new `question_type_category` ENUM type
- Add `course_id` and `question_type_category` columns to `exam_questions`
- Migrate existing data from templates to the new structure
- Drop the `exam_templates` table
- Create new RPC functions for category-based operations

#### Step 2: Fix the Versioning Trigger

After the main migration succeeds, run:
```
supabase/migrations/20241214_fix_versioning_trigger.sql
```

This updates the question versioning trigger to work with the new template-free system.

### Alternative: Manual Execution

If you prefer to execute manually:

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Copy and paste** the contents of `20241214_remove_exam_templates.sql`

3. **Click "Run"** and wait for completion

4. **Copy and paste** the contents of `20241214_fix_versioning_trigger.sql`

5. **Click "Run"** again

### Verification

After running the migrations, verify the changes:

```sql
-- Check that the new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exam_questions' 
  AND column_name IN ('course_id', 'question_type_category');

-- Verify exam_templates table is dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'exam_templates';
-- Should return no rows

-- Check that questions have been migrated
SELECT 
  id, 
  course_id, 
  question_type_category, 
  title 
FROM exam_questions 
LIMIT 5;
```

### Troubleshooting

#### Error: "template_id does not exist"
This is expected if you try to create questions before running the migration. Run the migrations first.

#### Error: "relation exam_templates does not exist"
The migrations have already been applied. No action needed.

#### Data Loss Concerns
The migration includes a data preservation step that copies template information to questions before dropping the templates table. However, we recommend:
- Taking a database backup before migration
- Testing in a development environment first
- Reviewing the migration SQL to understand what will happen

### Rollback (if needed)

If you need to rollback, you would need to:
1. Restore from your database backup
2. OR manually recreate the exam_templates table and restore relationships

Note: Rollback is complex and should only be done if absolutely necessary.

## Testing After Migration

1. **Create a new question** through the UI (Courses → Select Course → Create Question)
2. **Verify it saves** without errors
3. **Check all question types** work (code analysis, output tracing, essay, multiple choice, true/false)
4. **Test editing** an existing question
5. **Test question versioning** still works

## Support

If you encounter any issues during migration, check:
1. Supabase logs for detailed error messages
2. That you have the latest code from the develop branch
3. That both migration files are executed in order

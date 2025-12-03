# Admin Setup Guide

## Promoting Users to Professor/Admin Role

### Quick Promotion (SQL)

Run in Supabase SQL Editor after deploying migrations:

```sql
-- Promote by email to professor
UPDATE public.users
SET role = 'professor', updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Promote by email to admin
UPDATE public.users
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Using helper functions (recommended)
SELECT promote_user_to_professor('professor@example.com');
SELECT promote_user_to_admin('admin@example.com');

-- Verify
SELECT id, email, role FROM public.users WHERE role IN ('professor', 'admin');
```

### First-Time Setup

1. **Deploy Migrations**
   ```bash
   # Apply all three new migrations in Supabase dashboard
   # - 20241203_user_roles.sql
   # - 20241203_question_versioning.sql
   # - 20241203_publish_preview.sql
   ```

2. **Promote Your Account**
   ```sql
   -- Replace with your registered email
   SELECT promote_user_to_admin('your-email@example.com');
   ```

3. **Refresh Schema Cache**
   ```sql
   SELECT pg_notify('pgrst', 'reload schema');
   ```

4. **Log Out & Log In**
   - Sign out from the app
   - Sign back in to refresh session
   - The "Admin" link will now appear in header

## Admin Access Routes

Once promoted, you can access:

- **Dashboard**: `/admin/exams` - Course management, quick actions
- **Course Questions**: `/admin/exams/courses/[courseId]/questions` - Bulk publish/unpublish
- **Question Editor**: `/admin/exams/questions/[questionId]/edit` - Version history, rollback
- **Version Comparison**: `/admin/exams/questions/[questionId]/versions` - Diff view
- **Preview Tokens**: `/admin/exams/preview-tokens` - Manage sharing links
- **Preview**: `/professor-exams/preview/[questionId]` - Question preview

## Permissions

### Student (default)
- View published questions only
- Take exams
- Submit answers

### Professor
- All student permissions
- Create/edit/delete questions, templates, courses
- Publish/unpublish questions
- Generate preview tokens (7-day, 10-view limit)
- View version history and rollback
- Bulk operations

### Admin
- All professor permissions
- View all preview tokens
- Delete any content
- Promote other users (via SQL)

## RLS Policies

The following RLS policies protect exam content:

- Students: `SELECT` on published questions only
- Professors/Admins: Full CRUD on questions, templates, courses
- Version history: Visible to professors/admins only
- Preview tokens: Users see their own, admins see all

## Bulk Operations

On course question lists (`/admin/exams/courses/[courseId]/questions`):

1. Select questions with checkboxes
2. Use toolbar to publish/unpublish selected
3. Confirmation modal shows count
4. Results display success/error messages

## Preview Token Workflow

1. Edit a question: `/admin/exams/questions/[questionId]/edit`
2. Click "Share Preview" button
3. Token created with 7-day expiration, 10 views
4. View all tokens: `/admin/exams/preview-tokens`
5. Copy link to share with reviewers
6. Token increments view count on each access
7. Expires automatically after 7 days or 10 views

## Version Management

Every question edit creates a version snapshot:

1. Automatic versioning on INSERT/UPDATE (database trigger)
2. View history in editor sidebar
3. Compare versions with diff view
4. Rollback to any previous version
5. Audit trail: who changed what when

## Troubleshooting

**Admin link not showing?**
- Check role: `SELECT role FROM users WHERE id = auth.uid();`
- Refresh session (log out/in)
- Clear browser cache

**RLS blocking access?**
- Verify role is set: `SELECT * FROM users WHERE email = 'your-email';`
- Run schema reload: `SELECT pg_notify('pgrst', 'reload schema');`
- Check auth session is valid

**Preview tokens not working?**
- Token may be expired (7 days)
- View limit reached (10 views)
- Check `is_active` flag in `preview_tokens` table

## Security Notes

- Role changes require SQL access (intentional - prevents self-promotion)
- Preview tokens are UUID-based, not guessable
- All admin actions logged in version history
- RLS policies prevent privilege escalation
- Token view count prevents abuse

## Next Steps

After promotion:

1. Visit `/admin/exams` dashboard
2. Create a test course
3. Add exam templates (3 types available)
4. Create questions with version tracking
5. Test preview/publish workflow
6. Generate token and test sharing
7. Try bulk operations on multiple questions

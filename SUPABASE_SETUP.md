# Supabase Database Setup

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and create a new project
3. Wait for the project to be provisioned

## Step 2: Get Project Credentials

1. Go to Project Settings > API
2. Copy the following values to your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public key)

## Step 3: Create Users Table

Go to the SQL Editor in your Supabase dashboard and run this SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  total_points INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  avg_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create function to automatically insert user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, total_points, problems_solved, current_streak, avg_score)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run function on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Disable Email Confirmation (REQUIRED for development)

**IMPORTANT:** By default, Supabase requires email confirmation. You must disable this for the app to work properly during development.

1. Go to **Authentication → Settings** in your Supabase dashboard
2. Scroll down to **Email Auth** section
3. **UNCHECK** "Enable email confirmations"
4. Click **Save**

**Why?** With email confirmation enabled:
- Users cannot log in immediately after registration
- You'll get "Invalid login credentials" errors
- Users won't appear in the database until they confirm their email

## Step 5: Configure Google OAuth (Optional)

1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Add your redirect URL: `http://localhost:3000/auth/callback` (for development)
4. For production, add your production URL: `https://yourdomain.com/auth/callback`
5. Follow Supabase instructions to create Google OAuth credentials in Google Cloud Console

## Step 6: Test Your Setup

1. Make sure you've disabled email confirmations (Step 4)
2. Run `npm run dev` to start the development server
3. Visit `http://localhost:3000` - you'll be redirected to login
4. Click "Sign up" and create a test account
5. After registration, you should be logged in immediately
6. Check Supabase dashboard → Authentication → Users to verify the user was created
7. Check Supabase dashboard → Table Editor → users to see the user record

## Troubleshooting

### "Invalid login credentials" after registration
**Solution:** Email confirmation is still enabled. Go to Authentication → Settings and disable "Enable email confirmations", then try registering a new user.

### Users not appearing in database
**Solution:** 
1. Check that the trigger was created: Go to SQL Editor and run:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If no results, re-run the trigger creation SQL from Step 3
3. Delete test users from Authentication → Users and try again

### "new row violates row-level security policy"
**Solution:** The trigger should handle user creation. Make sure you removed the INSERT policy:
   ```sql
   DROP POLICY IF EXISTS "Users can insert their own data" ON users;
   ```

### Can't log in after deleting user from users table
**Solution:** You must also delete from Authentication → Users. The auth.users and public.users tables are linked.

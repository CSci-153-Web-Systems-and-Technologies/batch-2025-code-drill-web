# CodeDrill Features Documentation

## Overview
This document provides comprehensive documentation for all implemented features in CodeDrill, including database schemas, API functions, UI components, and configuration details.

---

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Problems System](#problems-system)
3. [Code Execution](#code-execution)
4. [Points & Scoring System](#points--scoring-system)
5. [Streak Tracking](#streak-tracking)
6. [Submission History](#submission-history)

---

## Authentication System

### Status: ✅ Complete

### Purpose
Secure user authentication using Supabase with email/password and Google OAuth support.

### Database Schema
- **Table:** `auth.users` (managed by Supabase)
- **Table:** `public.users` (custom user data)
  - `id` (UUID, references auth.users)
  - `email` (TEXT)
  - `name` (TEXT)
  - `total_points` (INTEGER, default: 0)
  - `problems_solved` (INTEGER, default: 0)
  - `current_streak` (INTEGER, default: 0)
  - `avg_score` (INTEGER, default: 0)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### API Functions
- `getCurrentUser()` - Get authenticated user with stats
- `signOut()` - Sign out current user

### UI Components
- `app/auth/login/page.tsx` - Login page
- `app/auth/register/page.tsx` - Registration page
- `components/layout/Header.tsx` - User info display with sign out

### Configuration
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase: Email confirmations disabled, Google OAuth configured

---

## Problems System

### Status: ✅ Complete

### Purpose
Browse, filter, and search coding problems with multiple difficulty levels and categories.

### Database Schema
- **Table:** `public.problems`
  - `id` (UUID)
  - `title` (TEXT)
  - `slug` (TEXT, unique)
  - `description` (TEXT)
  - `difficulty` (TEXT: Easy/Medium/Hard)
  - `category` (TEXT)
  - `tags` (TEXT[])
  - `acceptance_rate` (DECIMAL)
  - `total_submissions` (INTEGER)
  - `total_accepted` (INTEGER)
  - `example_test_cases` (JSONB)
  - `hidden_test_cases` (JSONB)
  - `constraints` (TEXT)
  - `starter_code` (JSONB with language keys)
  - `created_at`, `updated_at` (TIMESTAMP)

### API Functions
- `getProblems(filters)` - Fetch problems with filtering, search, pagination
- `getProblemBySlug(slug)` - Get single problem
- `getCategories()` - Get all problem categories
- `getProblemStats()` - Get problem statistics

### UI Components
- `app/problems/page.tsx` - Problems listing page
- `app/problems/ProblemsClient.tsx` - Client component with filters
- `app/problems/[slug]/page.tsx` - Problem detail page
- `app/problems/[slug]/ProblemDetailClient.tsx` - Problem solving interface
- `components/ui/ProblemCard.tsx` - Problem card component

### Sample Data
10 sample problems available in `PROBLEMS_SETUP.md` (5 Easy, 3 Medium, 2 Hard)

---

## Code Execution

### Status: ✅ Complete

### Purpose
Execute user code in sandboxed environment using Judge0 API with support for multiple languages.

### Supported Languages
- JavaScript (Node.js) - Language ID: 63
- Python 3 - Language ID: 71
- Java - Language ID: 62
- C++ (GCC 9.2.0) - Language ID: 54

### API Functions
- `executeWithJudge0(language, code, input)` - Execute code via Judge0 API
- `runCode(params)` - Run code against example test cases
- `submitCode(params)` - Submit code against all test cases

### UI Components
- `components/editor/CodeEditor.tsx` - CodeMirror wrapper with syntax highlighting
- Language switching dropdown in problem detail page
- Test results display with pass/fail indicators

### Configuration
- `.env.local`: `JUDGE0_API_URL`, `JUDGE0_API_KEY`
- RapidAPI setup documented in `JUDGE0_SETUP.md`

### Features
- Parallel test case execution using Promise.all
- Error handling for compilation errors, runtime errors, timeouts
- Status tracking: Accepted, Wrong Answer, Compilation Error, etc.

---

## Points & Scoring System

### Status: 🚧 In Progress

### Purpose
Award points to users based on problem difficulty and performance, with time-based bonuses.

### Scoring Algorithm

#### Base Points by Difficulty
- **Easy Problems:** 10-30 points
  - Base: 10 points
  - Variation based on test case complexity
- **Medium Problems:** 40-60 points
  - Base: 40 points
  - Variation based on test case complexity
- **Hard Problems:** 70-100 points
  - Base: 70 points
  - Variation based on test case complexity

#### Time Bonuses
- **First Attempt Bonus:** 25% bonus if solved on first submission
- **Fast Solve Bonus:** 10% bonus if solved within time baseline
  - Easy: 30 minutes
  - Medium: 60 minutes
  - Hard: 90 minutes

#### Score Calculation
```
total_points = base_points + first_attempt_bonus + fast_solve_bonus
```

### Database Schema

#### Submissions Table Updates
```sql
ALTER TABLE public.submissions 
ADD COLUMN points_earned INTEGER DEFAULT 0,
ADD COLUMN solve_time_seconds INTEGER;
```

### Database Functions

#### `update_user_stats`
Atomically updates user statistics after successful submission.

**Signature:**
```sql
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_problem_id UUID,
  p_points_earned INTEGER,
  p_difficulty TEXT,
  p_runtime INTEGER DEFAULT NULL,
  p_memory INTEGER DEFAULT NULL
) RETURNS JSON
```

**Returns:**
```json
{
  "success": true,
  "total_points": 150,
  "problems_solved": 5,
  "avg_score": 30
}
```

**Transaction Safety:** Uses PostgreSQL transactions to ensure atomic updates across:
- `users` table (total_points, problems_solved, avg_score)
- `user_problem_progress` table (status, solved_at, best_runtime, best_memory)
- Returns updated user stats

### API Functions

#### `lib/scoring.ts`

**`calculatePoints(difficulty, isFirstAttempt, solveTimeSeconds)`**
- Calculates total points including bonuses
- Returns breakdown: base, first attempt bonus, time bonus, total

**`getBasePoints(difficulty)`**
- Returns base points for difficulty level

**`hasTimeBonus(difficulty, solveTimeSeconds)`**
- Checks if submission qualifies for time bonus

### Integration

#### Updated submitCode() Flow
1. Execute code via Judge0
2. Calculate points earned
3. Call `update_user_stats` RPC function
4. Return submission result with points earned
5. Display points earned notification in UI

### UI Components
- Points earned toast notification after submission
- Updated stats in header (total points)
- Updated stats in dashboard (total points, problems solved, avg score)

### Migration Notes
- Run SQL from `SCORING_SETUP.md` to add database functions
- Existing submissions won't have points_earned (will be NULL)
- Points are only awarded for new submissions after implementation

---

## Streak Tracking

### Status: 🚧 Planned

### Purpose
Track daily problem-solving activity with streak counting and grace period support.

### Streak Rules
- **Streak Increment:** Solving at least 1 problem per day
- **Grace Period:** 1-day buffer (miss 1 day, streak maintained)
- **Streak Reset:** Missing 2+ consecutive days resets to 1
- **Timezone:** All dates in UTC for consistency

### Database Schema

#### Users Table Updates
```sql
ALTER TABLE public.users
ADD COLUMN last_active_date DATE,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_streak_update TIMESTAMP WITH TIME ZONE;
```

### Database Functions

#### `update_daily_streak`
Updates user streak with grace period logic.

**Signature:**
```sql
CREATE OR REPLACE FUNCTION update_daily_streak(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS JSON
```

**Logic:**
- If last_active was yesterday: increment streak
- If last_active is today: no change
- If last_active was 2 days ago: reset to 1 (grace period used)
- If last_active was 3+ days ago: reset to 1

**Returns:**
```json
{
  "success": true,
  "current_streak": 7,
  "longest_streak": 15,
  "grace_period_used": false
}
```

### API Functions

#### `lib/streaks.ts`

**`calculateStreak(userId)`**
- Fetches user streak data
- Calculates current streak status
- Returns streak info with grace period status

**`updateDailyStreak(userId)`**
- Called when user solves a problem
- Updates last_active_date and current_streak
- Updates longest_streak if current exceeds it

**`getStreakStatus(userId)`**
- Returns current streak with grace period warning
- Shows days until streak expires

### UI Components
- Streak display in header
- Streak calendar on dashboard
- Grace period warning banner
- Streak milestone notifications

### Notification Rules
- **Grace Period Active:** Show warning "Solve a problem today to maintain your streak!"
- **Streak Broken:** Show notification "Your streak was reset. Start a new one!"
- **Milestone Reached:** Show celebration for 7, 30, 100, 365 day streaks

---

## Submission History

### Status: 🚧 Planned

### Purpose
Display user's code submission history with filtering, code viewing, and performance metrics.

### Database Schema
- **Table:** `public.submissions` (already exists)
- **Table:** `public.user_problem_progress` (already exists)

### API Functions

#### `lib/submissions.ts`

**`getUserSubmissions(userId, filters, page, limit)`**
- Fetches user submissions with pagination
- Joins with problems table for problem details
- Supports filters: problem, language, status, date range

**`getSubmissionById(submissionId, userId)`**
- Fetches single submission with full details
- Includes problem info and test results

**`getSubmissionStats(userId)`**
- Returns submission statistics
- Total submissions, acceptance rate, languages used
- Best/worst performing problems

**`compareSubmissions(submissionId1, submissionId2)`**
- Returns diff between two submissions
- Used for code comparison

### UI Components

#### Pages
- `app/submissions/page.tsx` - Submission history page (server component)
- `app/submissions/SubmissionsClient.tsx` - Client component with filters

#### Components
- `components/submissions/SubmissionCard.tsx` - Individual submission card
- `components/submissions/SubmissionFilters.tsx` - Filter controls
- `components/submissions/CodeViewer.tsx` - Code display with syntax highlighting
- `components/submissions/SubmissionStats.tsx` - Statistics overview

### Features
- **Filtering:** By problem, language, status, date range
- **Pagination:** Load more button or infinite scroll
- **Code Viewing:** Syntax-highlighted code display
- **Performance Metrics:** Runtime, memory usage charts
- **Status Badges:** Color-coded status indicators
- **Code Comparison:** Diff view between attempts

### Submission Card Display
```
┌─────────────────────────────────────────┐
│ Two Sum                    Accepted ✓   │
│ JavaScript | 2 hours ago               │
│                                         │
│ Runtime: 82ms | Memory: 42.1MB         │
│ Points Earned: 25                       │
│ Test Cases: 15/15 passed               │
│                                         │
│ [View Code] [Compare]                  │
└─────────────────────────────────────────┘
```

---

## Configuration Files

### `.env.local`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key
```

### Setup Files
- `SUPABASE_SETUP.md` - Supabase configuration and users table
- `PROBLEMS_SETUP.md` - Problems database schema and sample data
- `JUDGE0_SETUP.md` - Judge0 API integration guide
- `SCORING_SETUP.md` - Scoring system database functions (new)

---

## Development Notes

### Feature Branch Workflow
1. Create feature branch from `develop`
2. Implement feature with tests
3. Commit with descriptive message
4. Push to remote
5. Merge to `develop` branch
6. Test integration
7. Update `FEATURES.md` documentation

### Testing Checklist
- [ ] Database functions work correctly
- [ ] RLS policies allow proper access
- [ ] UI components render correctly
- [ ] API functions handle errors gracefully
- [ ] Transaction safety verified
- [ ] Performance tested with multiple concurrent requests

---

## Future Enhancements

### Planned Features
- AI-powered code hints
- Video tutorial integration
- Achievement badges and certificates
- Social features (following, discussions)
- Mobile apps (React Native)
- IDE extensions

### Performance Optimizations
- Database query caching
- Submission history pagination optimization
- Leaderboard caching with Redis
- Code execution queue for high traffic

---

*Last Updated: December 2, 2025*
*Version: 1.0.0*

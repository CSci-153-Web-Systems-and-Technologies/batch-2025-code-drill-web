# Code Drill Web Platform

A comprehensive web-based coding practice and examination platform built with Next.js 14, TypeScript, and Supabase. This platform provides an interactive environment for students to practice coding problems, participate in challenges, and take exams while enabling professors to manage courses, create questions, and grade submissions.

## Features

### For Students
- **Practice Mode**: Solve coding problems across multiple languages (Python, JavaScript, C++, Java)
- **Problem Library**: Browse and filter problems by difficulty, topic, and skills
- **Live Code Editor**: CodeMirror-powered editor with syntax highlighting and theme support
- **Challenges**: Participate in competitive coding challenges
- **Global Leaderboard**: Compete with peers, track rankings, and earn achievement badges
- **Achievement Badges**: Unlock 4 unique emoji badges (🌟 Rising Star, 🔥 Consistent, 🏆 Problem Master, ⚡ Speed Demon)
- **Rank History**: View 30-day rank progression with SVG charts
- **Skills Tracking**: Monitor progress and skill development across problem categories
- **Submission History**: View past submissions with feedback and grading
- **Streaks**: Track daily practice consistency with visual calendar
- **Weekly Goals**: Set and track weekly problem-solving targets
- **Profile Management**: Customize profile, toggle leaderboard visibility, and view activity statistics

### For Professors
- **Course Management**: Create and manage courses with enrolled students
- **Question Bank**: Build comprehensive question repositories with version control
- **5 Question Types**: Multiple Choice, True/False, Code Analysis, Output Tracing, Essay
- **Exam Creation**: Design exams with various question types and categories
- **Manual Grading**: Grade essay questions and provide detailed feedback with rubric support
- **Submission Review**: View and grade student submissions with comprehensive grading interface
- **Batch Operations**: Grade multiple submissions efficiently
- **CSV Export**: Download leaderboard and grading data for record-keeping
- **Analytics Dashboard**: Monitor student performance and engagement
- **Announcements**: Share important updates with students
- **Class Roster**: Manage student enrollments and permissions

### Question Types
1. **Multiple Choice Questions (MCQ)**: Single/multiple correct answers with auto-grading
2. **True/False**: Binary choice questions with instant feedback
3. **Code Analysis**: Analyze code snippets and answer questions about them
4. **Output Tracing**: Predict the output of given code
5. **Essay Questions**: Long-form answers with manual grading and word count validation
6. **Coding Problems**: Full programming challenges with automated test case validation
- Version control for all question types
- Category-based organization (Arrays, Strings, DP, Trees, Graphs, etc.)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Code Editor**: CodeMirror 6
- **Code Execution**: Judge0 (self-hosted)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- Judge0 instance (for code execution)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd batch-2025-code-drill-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
JUDGE0_API_URL=your-judge0-url
JUDGE0_API_KEY=your-judge0-key
```

4. Run database migrations:
Execute the SQL migrations in the `supabase/migrations/` directory in order.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The platform uses Supabase with PostgreSQL. Key tables include:
- `users` - User accounts, profiles, and leaderboard visibility
- `professor_courses` - Course management
- `question_bank` - Question repository with version control
- `professor_exams` - Exam configuration
- `exam_questions` - Question-exam relationships (direct course linkage)
- `user_exam_answers` - Student submissions and grading with manual review support
- `user_exam_progress` - Exam completion tracking by category
- `practice_sessions` - Practice mode tracking
- `problems` - Coding problem library
- `submissions` - Code submission history
- `challenges` - Challenge system
- `skills` - Skills tracking and progression
- `announcements` - Course announcements
- `rank_snapshots` - Historical rank tracking (30 days)
- `achievement_badges` - Badge definitions with emoji icons
- `user_badges` - User-earned achievement badges
- `daily_activity` - Streak tracking with grace period support

### Running Migrations

Execute migrations in chronological order in Supabase SQL Editor:

1. **Core System** (Run first):
```sql
-- User roles and authentication
20241203_user_roles.sql

-- Challenge system
20241202_challenges.sql
20241202_practice_sessions.sql

-- Exam and question system
20241203_professor_exams.sql
20241203_question_versioning.sql
20241203_publish_preview.sql

-- Skills tracking
20241203_skills_tracking.sql

-- Announcements
20241212_announcements.sql
```

2. **New Features** (December 2024 release):
```sql
-- Question type expansion
20241214_extend_question_types.sql

-- Template removal (breaking change)
20241214_remove_exam_templates.sql

-- Versioning fixes
20241214_fix_versioning_trigger.sql

-- Essay grading system
20241214_essay_submission_grading.sql

-- Leaderboard system (run last)
20241214_leaderboard_system.sql
```

**Important**: The leaderboard migration includes:
- 3 new tables: `rank_snapshots`, `achievement_badges`, `user_badges`
- 4 RPC functions with `SECURITY DEFINER` to bypass RLS
- Achievement badge seeding
- Leaderboard visibility column for users

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/              # Admin/professor pages
│   │   ├── api/                # API routes
│   │   │   └── leaderboard/    # Leaderboard CSV export
│   │   ├── auth/               # Authentication pages
│   │   ├── challenges/         # Challenge system
│   │   ├── leaderboard/        # Global leaderboard & rankings
│   │   │   ├── category/       # Category-specific rankings
│   │   │   └── actions.ts      # Leaderboard server actions
│   │   ├── practice/           # Practice mode
│   │   ├── problems/           # Problem library
│   │   ├── professor-exams/    # Exam management
│   │   │   └── [courseId]/     # Course-specific exams
│   │   │       ├── submissions/ # Grading interface
│   │   │       └── [questionType]/ # Question creation by type
│   │   ├── profile/            # User profiles
│   │   ├── skills/             # Skills tracking
│   │   ├── streaks/            # Streak management
│   │   └── submissions/        # Submission history
│   │       └── history/        # Detailed submission log
│   ├── components/             # React components
│   │   ├── admin/              # Professor components
│   │   │   ├── SubmissionGradingInterface.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   └── question-types/ # Question type forms
│   │   ├── challenges/         # Challenge components
│   │   ├── editor/             # Code editor (CodeMirror)
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx      # Navigation with dropdowns
│   │   │   ├── PracticeDropdown.tsx
│   │   │   ├── ProfileDropdown.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── leaderboard/        # Leaderboard components
│   │   │   ├── LeaderboardTable.tsx
│   │   │   ├── BadgeDisplay.tsx
│   │   │   └── RankHistoryChart.tsx
│   │   ├── profile/            # Profile components
│   │   ├── shared/             # Shared components
│   │   ├── streaks/            # Streak components
│   │   ├── submissions/        # Submission components
│   │   └── ui/                 # UI primitives
│   ├── hooks/                  # Custom React hooks
│   │   └── useCountUp.ts       # Number animation hook
│   ├── lib/                    # Utilities and helpers
│   │   ├── auth-roles.ts       # Role-based access control
│   │   ├── auth.ts             # Authentication utilities
│   │   ├── dashboard-stats.ts  # Dashboard data fetching
│   │   ├── problems.ts         # Problem utilities
│   │   ├── professor-dashboard.ts # Professor analytics
│   │   ├── scoring.ts          # Points calculation
│   │   ├── skills.ts           # Skills progression
│   │   ├── streaks.ts          # Streak management
│   │   ├── streaks-utils.ts    # Streak utilities
│   │   ├── submissions.ts      # Submission queries
│   │   └── supabase/           # Supabase client
│   ├── types/                  # TypeScript definitions
│   │   ├── index.ts            # Core types
│   │   ├── challenge.ts        # Challenge types
│   │   ├── practice.ts         # Practice types
│   │   ├── professor-exam.ts   # Exam types
│   │   └── skills.ts           # Skills types
│   ├── utils/
│   │   └── helpers.ts          # Utility functions
│   └── styles/
│       └── globals.css         # Global styles + Tailwind
├── supabase/
│   └── migrations/             # Database migrations (run in order)
├── public/                     # Static assets
│   ├── fonts/
│   ├── icons/
│   └── images/
└── tailwind.config.ts          # Tailwind + custom animations
```

## Key Features Implementation

### 🏆 Leaderboard System
**Global competitive ranking with achievement badges:**
- **Real-time Rankings**: Students ranked by total points, problems solved, and avg score
- **Achievement Badges**: 4 auto-awarded emoji badges based on performance milestones
  - 🌟 **Rising Star**: Climbed 10+ ranks in the past week
  - 🔥 **Consistent**: Maintained a 7-day streak
  - 🏆 **Problem Master**: Solved 50+ problems
  - ⚡ **Speed Demon**: Solved 10 problems in one day
- **Rank History**: SVG-based charts showing 30-day rank progression
- **Privacy Controls**: Students can toggle leaderboard visibility
- **Top 3 Medals**: 🥇🥈🥉 displayed for podium positions
- **Rank Changes**: ↑↓ indicators showing daily improvement/decline
- **CSV Export**: Professors can export leaderboard data
- **Performance**: All animations GPU-accelerated, 60fps rendering

**Technical Implementation:**
- `SECURITY DEFINER` RPC functions bypass RLS for accurate counts
- Daily rank snapshots stored in `rank_snapshots` table
- Badges automatically awarded via `checkAndAwardBadges()` function
- Pure SVG charts (no third-party libraries)

### 📝 Essay Submission & Manual Grading
Students can submit essay answers that require manual grading by professors. The system:
- **Word Count Validation**: Min/max word limits with real-time counter
- **Submission Tracking**: Auto-flags submissions requiring manual review
- **Grading Interface**: Dedicated UI at `/professor-exams/[courseId]/submissions`
- **Rubric Support**: Store grading rubric scores in JSONB
- **Feedback System**: Professors provide detailed written feedback
- **Submission History**: Students view all submissions with grading status
- **CSV Export**: Download grading data for record-keeping

### ⚡ Code Execution
Integration with Judge0 for secure code execution:
- Multiple language support (JavaScript, Python, C++, Java)
- Test case validation with hidden test cases
- Performance metrics (runtime, memory usage)
- MUI/UX Enhancements

### Custom Animations (Tailwind Config)
All animations are GPU-accelerated for 60fps performance:
- `shimmer` - Loading state shimmer effect
- `fadeIn` - Staggered fade-in animations
- `scaleIn` - Entrance scale animations
- `glowPulse` - Celebration glow effects
- `bounceSubtle` - Active state indicators
- `countUp` - Number increment animations

### Responsive Design
- Mobile-first approach
- Touch-friendly targets (44px minimum)
- Hamburger menu for mobile navigation
- Optimized for all screen sizes
- Reduced motion support for accessibility

### Performance Optimizations
- Transform-based animations (no layout reflows)
- `will-change` hints for GPU acceleration
- Lazy loading for images and components
- Server-side rendering for initial load
- Optimized bundle size (~6KB increase for all features)

## API Routes

### Leaderboard Export
- **Endpoint**: `/api/leaderboard/export`
- **Method**: GET
- **Auth**: Professors only
- **Response**: CSV file with rankings and stats
- **Fields**: Rank, Name, Email, Points, Solved, Avg Score, Streak, Rank Change, Badges

## Server Actions

### Leaderboard Actions (`src/app/leaderboard/actions.ts`)
- `getLeaderboardData()` - Fetch paginated rankings
- `getUserRank()` - Get current user's rank and stats
- `getRankHistory()` - Fetch 30-day rank progression
- `createRankSnapshot()` - Create daily rank snapshot
- `updateLeaderboardVisibility()` - Toggle privacy
- `awardBadge()` - Award achievement badge to user
- `checkAndAwardBadges()` - Auto-award based on criteria
- `exportLeaderboardCSV()` - Generate CSV export

### Dashboard Stats (`src/lib/dashboard-stats.ts`)
- `getWeeklyProblemsSolved()` - Count unique problems solved this week

## Contributing

### Git Workflow
1. Create a feature branch from `develop`: `git checkout -b feature/your-feature`
2. For bug fixes, create hotfix branches: `git checkout -b hotfix/bug-description`
3. Make your changes with descriptive commits
4. Test thoroughly (including mobile)
5. Submit a pull request to `develop`
6. After review, merge to `develop`
7. When ready for release, merge `develop` to `main`

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Tailwind CSS for styling (no inline styles)
- Prefer server components over client components
- Use server actions for data mutations
- Comment complex logic
- Keep functions small and focused
- Problem completion by category (Arrays, Strings, DP, Trees, Graphs)
- Difficulty levels (Easy, Medium, Hard)
- Practice consistency (streaks)
- Challenge participation and performance
- Top 4 skills displayed on dashboard with progress bars

### 🔥 Streak System
**Daily activity tracking with grace period:**
- Automatic streak updates on problem completion
- 1-day grace period to prevent streak breaks
- Visual calendar showing last 30 days of activity
- Streak stats with pulsing fire emoji animations
- Streak warnings when at risk of breaking
- Integration with achievement badges (🔥 Consistent badge)
## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/              # Admin/professor pages
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── challenges/         # Challenge system
│   │   ├── practice/           # Practice mode
│   │   ├── problems/           # Problem library
│   │   ├── professor-exams/    # Exam management
│   │   ├── profile/            # User profiles
│   │   └── submissions/        # Submission history
│   ├── components/             # React components
│   │   ├── admin/              # Professor components
│   │   ├── editor/             # Code editor
│   │   ├── layout/             # Layout components
│   │   └── shared/             # Shared components
│   ├── lib/                    # Utilities and helpers
│   │   └── supabase/           # Supabase client
│   ├── types/                  # TypeScript definitions
│   └── styles/                 # Global styles
├── supabase/
│   └── migrations/             # Database migrations
└── public/                     # Static assets
```

## Key Features Implementation

### Essay Submission & Manual Grading
Students can submit essay answers that require manual grading by professors. The system:
- Tracks submissions requiring grading
- Provides a dedicated grading interface
- Stores grading rubric scores
- Maintains submission history with feedback

### Code Execution
Integration with Judge0 for secure code execution:
- Multiple language support
- Test case validation
- Performance metrics
- Memory and time limits

### Skills Tracking
Automatic skill progression based on:
- Problem completion
- Difficulty levels
- Practice consistency
- Challenge participation

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `JUDGE0_API_URL` - Judge0 API endpoint
- `JUDGE0_API_KEY` - Judge0 API authentication key

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Test thoroughly
4. Submit a pull request to `develop`

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please contact the development team or create an issue in the repository.
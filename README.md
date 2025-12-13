# Code Drill Web Platform

A comprehensive web-based coding practice and examination platform built with Next.js 14, TypeScript, and Supabase. This platform provides an interactive environment for students to practice coding problems, participate in challenges, and take exams while enabling professors to manage courses, create questions, and grade submissions.

## Features

### For Students
- **Practice Mode**: Solve coding problems across multiple languages (Python, JavaScript, C++, Java)
- **Problem Library**: Browse and filter problems by difficulty, topic, and skills
- **Live Code Editor**: CodeMirror-powered editor with syntax highlighting and theme support
- **Challenges**: Participate in competitive coding challenges
- **Skills Tracking**: Monitor progress and skill development
- **Submission History**: View past submissions with feedback and grading
- **Streaks**: Track daily practice consistency
- **Profile Management**: Customize profile and view activity statistics

### For Professors
- **Course Management**: Create and manage courses with enrolled students
- **Question Bank**: Build comprehensive question repositories with version control
- **Exam Creation**: Design exams with various question types (multiple choice, coding, essay)
- **Manual Grading**: Grade essay questions and provide detailed feedback
- **Submission Review**: View and grade student submissions with rubric support
- **Analytics Dashboard**: Monitor student performance and engagement
- **Announcements**: Share important updates with students
- **Class Roster**: Manage student enrollments and permissions

### Question Types
- Multiple Choice Questions (MCQ)
- Coding Problems with automated testing
- Essay Questions with manual grading
- Version control for question updates

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
- `users` - User accounts and profiles
- `professor_courses` - Course management
- `question_bank` - Question repository
- `professor_exams` - Exam configuration
- `exam_questions` - Question-exam relationships
- `user_exam_answers` - Student submissions and grading
- `practice_sessions` - Practice mode tracking
- `challenges` - Challenge system
- `skills` - Skills tracking
- `announcements` - Course announcements

### Running Migrations

Execute migrations in chronological order:
```sql
-- In Supabase SQL Editor
\i supabase/migrations/20241202_challenges.sql
\i supabase/migrations/20241202_practice_sessions.sql
\i supabase/migrations/20241203_professor_exams.sql
-- ... and so on
```

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
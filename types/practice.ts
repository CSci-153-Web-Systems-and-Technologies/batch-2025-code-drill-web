export interface PracticeSession {
  id: string;
  user_id: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  category: string | null;
  time_limit: number;
  started_at: string;
  completed_at: string | null;
  problems_attempted: number;
  problems_solved: number;
  total_score: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface SessionProblem {
  id: string;
  session_id: string;
  problem_id: string;
  submission_id: string | null;
  status: 'pending' | 'solved' | 'attempted';
  attempted_at: string | null;
  solved_at: string | null;
  created_at: string;
}

export interface PracticeSessionConfig {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  timeLimit: number; // in minutes
}

export interface ActiveSessionData extends PracticeSession {
  session_problems: (SessionProblem & {
    problem: {
      id: string;
      title: string;
      difficulty: string;
      slug: string;
    };
  })[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problem_id: string;
  start_date: string;
  end_date: string;
  max_points: number;
  status: 'upcoming' | 'active' | 'completed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  completed: boolean;
  completed_at: string | null;
  score: number;
  rank: number | null;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  participant_id: string;
  submission_id: string;
  points_earned: number;
  submitted_at: string;
  is_best_submission: boolean;
}

export interface ChallengeWithProblem extends Challenge {
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
}

export interface ChallengeWithStats extends ChallengeWithProblem {
  participant_count: number;
  completion_count: number;
  user_participant?: ChallengeParticipant | null;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  completed_at: string;
  is_current_user: boolean;
}

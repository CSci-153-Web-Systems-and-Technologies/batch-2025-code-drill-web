export interface UserSkill {
  id: string;
  user_id: string;
  category: string;
  problems_solved: number;
  problems_attempted: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_points: number;
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillBadge {
  id: string;
  user_id: string;
  category: string;
  badge_type: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  earned_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_category: string | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface StudyPlanProblem {
  id: string;
  study_plan_id: string;
  problem_id: string;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
}

export interface SkillWithBadges extends UserSkill {
  badges: SkillBadge[];
}

export interface StudyPlanWithProblems extends StudyPlan {
  problems: (StudyPlanProblem & {
    problem: {
      id: string;
      title: string;
      slug: string;
      difficulty: string;
      category: string;
    };
  })[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface SkillInsight {
  category: string;
  problems_solved: number;
  skill_level: string;
  recommended_difficulty: string;
  strength_score: number;
}

export interface DifficultyProgression {
  easy: number;
  medium: number;
  hard: number;
  total: number;
  next_milestone: {
    difficulty: string;
    current: number;
    target: number;
  } | null;
}

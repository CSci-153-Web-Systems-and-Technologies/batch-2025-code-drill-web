// Common types for the application

export interface User {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  problemsSolved: number;
  currentStreak: number;
  avgScore: number;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  description: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  participants: number;
  points: number;
  daysLeft: number;
}

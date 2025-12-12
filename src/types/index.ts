// Common types for the application

export type UserRole = 'student' | 'professor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  problemsSolved: number;
  currentStreak: number;
  avgScore: number;
  role: UserRole;
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type SubmissionStatus = 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
export type ProblemStatus = 'Not Started' | 'Attempted' | 'Solved';

export interface TestCase {
  input: string;
  output: string;
}

export interface StarterCode {
  javascript?: string;
  python?: string;
  java?: string;
  cpp?: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: DifficultyLevel;
  category: string;
  tags: string[];
  acceptanceRate: number;
  totalSubmissions: number;
  totalAccepted: number;
  exampleTestCases: TestCase[];
  hiddenTestCases?: TestCase[];
  constraints: string;
  starterCode: StarterCode;
  solutionTemplate?: StarterCode;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  runtime?: number; // milliseconds
  memory?: number; // KB
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  submittedAt: string;
}

export interface UserProblemProgress {
  id: string;
  userId: string;
  problemId: string;
  status: ProblemStatus;
  bestRuntime?: number;
  bestMemory?: number;
  attempts: number;
  lastAttemptedAt?: string;
  solvedAt?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  participants: number;
  points: number;
  daysLeft: number;
}

/**
 * Scoring System for CodeDrill
 * 
 * This module handles all point calculation logic including:
 * - Base points by difficulty
 * - First attempt bonuses
 * - Time-based bonuses
 * - Score tracking and updates
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface PointsBreakdown {
  basePoints: number;
  firstAttemptBonus: number;
  timeBonusPoints: number;
  totalPoints: number;
}

export interface ScoringConfig {
  easy: { min: number; max: number; base: number; timeLimit: number };
  medium: { min: number; max: number; base: number; timeLimit: number };
  hard: { min: number; max: number; base: number; timeLimit: number };
  firstAttemptBonusPercent: number;
  timeBonusPercent: number;
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  easy: {
    min: 10,
    max: 30,
    base: 10,
    timeLimit: 30 * 60, // 30 minutes in seconds
  },
  medium: {
    min: 40,
    max: 60,
    base: 40,
    timeLimit: 60 * 60, // 60 minutes in seconds
  },
  hard: {
    min: 70,
    max: 100,
    base: 70,
    timeLimit: 90 * 60, // 90 minutes in seconds
  },
  firstAttemptBonusPercent: 25, // 25% bonus
  timeBonusPercent: 10, // 10% bonus
};

/**
 * Get base points for a given difficulty level
 */
export function getBasePoints(difficulty: Difficulty, config = DEFAULT_SCORING_CONFIG): number {
  const difficultyLower = difficulty.toLowerCase() as Lowercase<Difficulty>;
  return config[difficultyLower].base;
}

/**
 * Check if submission qualifies for time bonus
 */
export function hasTimeBonus(
  difficulty: Difficulty,
  solveTimeSeconds: number,
  config = DEFAULT_SCORING_CONFIG
): boolean {
  const difficultyLower = difficulty.toLowerCase() as Lowercase<Difficulty>;
  const timeLimit = config[difficultyLower].timeLimit;
  return solveTimeSeconds <= timeLimit;
}

/**
 * Calculate first attempt bonus
 */
export function calculateFirstAttemptBonus(
  basePoints: number,
  config = DEFAULT_SCORING_CONFIG
): number {
  return Math.floor((basePoints * config.firstAttemptBonusPercent) / 100);
}

/**
 * Calculate time bonus
 */
export function calculateTimeBonus(
  basePoints: number,
  config = DEFAULT_SCORING_CONFIG
): number {
  return Math.floor((basePoints * config.timeBonusPercent) / 100);
}

/**
 * Calculate total points for a submission
 * 
 * @param difficulty - Problem difficulty (Easy, Medium, Hard)
 * @param isFirstAttempt - Whether this is the user's first attempt at this problem
 * @param solveTimeSeconds - Time taken to solve in seconds (optional)
 * @param config - Scoring configuration (optional)
 * @returns Points breakdown with total
 */
export function calculatePoints(
  difficulty: Difficulty,
  isFirstAttempt: boolean,
  solveTimeSeconds?: number,
  config = DEFAULT_SCORING_CONFIG
): PointsBreakdown {
  // Get base points
  const basePoints = getBasePoints(difficulty, config);

  // Calculate first attempt bonus
  const firstAttemptBonus = isFirstAttempt
    ? calculateFirstAttemptBonus(basePoints, config)
    : 0;

  // Calculate time bonus
  const timeBonusPoints =
    solveTimeSeconds && hasTimeBonus(difficulty, solveTimeSeconds, config)
      ? calculateTimeBonus(basePoints, config)
      : 0;

  // Calculate total
  const totalPoints = basePoints + firstAttemptBonus + timeBonusPoints;

  return {
    basePoints,
    firstAttemptBonus,
    timeBonusPoints,
    totalPoints,
  };
}

/**
 * Get time limit for a difficulty level
 */
export function getTimeLimit(difficulty: Difficulty, config = DEFAULT_SCORING_CONFIG): number {
  const difficultyLower = difficulty.toLowerCase() as Lowercase<Difficulty>;
  return config[difficultyLower].timeLimit;
}

/**
 * Format time in seconds to readable string
 */
export function formatSolveTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Validate difficulty string
 */
export function isValidDifficulty(difficulty: string): difficulty is Difficulty {
  return ['Easy', 'Medium', 'Hard'].includes(difficulty);
}

/**
 * Get difficulty color for UI
 */
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Easy':
      return 'text-green-500';
    case 'Medium':
      return 'text-yellow-500';
    case 'Hard':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Calculate average score from total points and problems solved
 */
export function calculateAverageScore(totalPoints: number, problemsSolved: number): number {
  if (problemsSolved === 0) return 0;
  return Math.floor(totalPoints / problemsSolved);
}

/**
 * Format points with thousands separator
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Calculate percentile rank
 * 
 * @param userPoints - User's total points
 * @param totalUsers - Total number of users
 * @param rank - User's rank (1-based)
 * @returns Percentile (0-100)
 */
export function calculatePercentile(
  userPoints: number,
  totalUsers: number,
  rank: number
): number {
  if (totalUsers === 0) return 0;
  return Math.floor(((totalUsers - rank + 1) / totalUsers) * 100);
}

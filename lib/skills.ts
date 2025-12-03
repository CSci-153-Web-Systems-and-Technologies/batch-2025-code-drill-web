import type { UserSkill, SkillBadge, DifficultyProgression } from '@/types/skills';

export function calculateSkillLevel(
  problemsSolved: number,
  easySolved: number,
  mediumSolved: number,
  hardSolved: number
): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
  if (problemsSolved >= 30 && hardSolved >= 5) {
    return 'Expert';
  } else if (problemsSolved >= 15 && (mediumSolved >= 5 || hardSolved >= 2)) {
    return 'Advanced';
  } else if (problemsSolved >= 6) {
    return 'Intermediate';
  } else {
    return 'Beginner';
  }
}

export function getSkillLevelColor(level: string): string {
  switch (level) {
    case 'Expert':
      return 'text-purple-600 bg-purple-50';
    case 'Advanced':
      return 'text-blue-600 bg-blue-50';
    case 'Intermediate':
      return 'text-green-600 bg-green-50';
    case 'Beginner':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getBadgeIcon(badgeType: string): string {
  switch (badgeType) {
    case 'Platinum':
      return '💎';
    case 'Gold':
      return '🥇';
    case 'Silver':
      return '🥈';
    case 'Bronze':
      return '🥉';
    default:
      return '🏅';
  }
}

export function getBadgeColor(badgeType: string): string {
  switch (badgeType) {
    case 'Platinum':
      return 'from-purple-400 to-pink-400';
    case 'Gold':
      return 'from-yellow-400 to-orange-400';
    case 'Silver':
      return 'from-gray-300 to-gray-400';
    case 'Bronze':
      return 'from-orange-600 to-orange-700';
    default:
      return 'from-gray-400 to-gray-500';
  }
}

export function getNextBadgeMilestone(problemsSolved: number): {
  badgeType: string;
  target: number;
  current: number;
  progress: number;
} | null {
  if (problemsSolved < 5) {
    return {
      badgeType: 'Bronze',
      target: 5,
      current: problemsSolved,
      progress: (problemsSolved / 5) * 100,
    };
  } else if (problemsSolved < 15) {
    return {
      badgeType: 'Silver',
      target: 15,
      current: problemsSolved,
      progress: (problemsSolved / 15) * 100,
    };
  } else if (problemsSolved < 30) {
    return {
      badgeType: 'Gold',
      target: 30,
      current: problemsSolved,
      progress: (problemsSolved / 30) * 100,
    };
  } else if (problemsSolved < 50) {
    return {
      badgeType: 'Platinum',
      target: 50,
      current: problemsSolved,
      progress: (problemsSolved / 50) * 100,
    };
  }
  return null;
}

export function calculateDifficultyProgression(
  easySolved: number,
  mediumSolved: number,
  hardSolved: number
): DifficultyProgression {
  const total = easySolved + mediumSolved + hardSolved;

  let nextMilestone = null;

  // Suggest progression path
  if (easySolved < 3) {
    nextMilestone = {
      difficulty: 'Easy',
      current: easySolved,
      target: 3,
    };
  } else if (mediumSolved < 5) {
    nextMilestone = {
      difficulty: 'Medium',
      current: mediumSolved,
      target: 5,
    };
  } else if (hardSolved < 3) {
    nextMilestone = {
      difficulty: 'Hard',
      current: hardSolved,
      target: 3,
    };
  }

  return {
    easy: easySolved,
    medium: mediumSolved,
    hard: hardSolved,
    total,
    next_milestone: nextMilestone,
  };
}

export function getStrengthScore(skill: UserSkill): number {
  // Calculate a composite strength score (0-100)
  const solvedWeight = Math.min(skill.problems_solved / 50, 1) * 40; // Max 40 points
  const difficultyWeight =
    (skill.easy_solved * 1 + skill.medium_solved * 2 + skill.hard_solved * 4) / 2; // Max ~40 points
  const levelWeight =
    {
      Beginner: 5,
      Intermediate: 10,
      Advanced: 15,
      Expert: 20,
    }[skill.skill_level] || 0; // Max 20 points

  return Math.min(Math.round(solvedWeight + difficultyWeight + levelWeight), 100);
}

export function identifyWeakCategories(skills: UserSkill[]): UserSkill[] {
  return skills
    .sort((a, b) => {
      // Sort by problems solved (ascending), then by last practiced (oldest first)
      if (a.problems_solved !== b.problems_solved) {
        return a.problems_solved - b.problems_solved;
      }
      const aDate = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
      const bDate = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
      return aDate - bDate;
    })
    .slice(0, 3);
}

export function getRecommendedDifficulty(skill: UserSkill): 'easy' | 'medium' | 'hard' {
  if (skill.easy_solved < 3) return 'easy';
  if (skill.medium_solved < 5) return 'medium';
  return 'hard';
}

export function formatSkillProgress(current: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Array: '📊',
    String: '📝',
    'Linked List': '🔗',
    Tree: '🌳',
    'Dynamic Programming': '🎯',
    Math: '🔢',
    Stack: '📚',
    'Binary Search': '🔍',
    Graph: '🕸️',
    Heap: '⛰️',
    'Hash Table': '#️⃣',
  };
  return icons[category] || '💡';
}

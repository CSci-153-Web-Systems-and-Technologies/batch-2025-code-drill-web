'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getUserSkillsWithBadges, getWeakCategories, generateStudyPlan, getUserStudyPlans } from './actions';
import type { SkillWithBadges, SkillInsight, StudyPlanWithProblems } from '@/types/skills';
import {
  getSkillLevelColor,
  getBadgeIcon,
  getBadgeColor,
  getNextBadgeMilestone,
  calculateDifficultyProgression,
  getStrengthScore,
  getCategoryIcon,
} from '@/lib/skills';

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillWithBadges[]>([]);
  const [weakCategories, setWeakCategories] = useState<SkillInsight[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanWithProblems[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [skillsResult, weakResult, plansResult] = await Promise.all([
      getUserSkillsWithBadges(),
      getWeakCategories(),
      getUserStudyPlans(),
    ]);

    if (skillsResult.data) setSkills(skillsResult.data);
    if (weakResult.data) setWeakCategories(weakResult.data);
    if (plansResult.data) setStudyPlans(plansResult.data);

    setLoading(false);
  };

  const handleGeneratePlan = async (category: string) => {
    setGenerating(true);
    setSelectedCategory(category);
    const result = await generateStudyPlan(category, 7);
    if (!result.error) {
      await loadData();
    }
    setGenerating(false);
    setSelectedCategory('');
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading skills...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Skills Progress</h1>
          <p className="text-gray-600">Track your progress across different problem categories</p>
        </div>

        {skills.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No Skills Tracked Yet</h2>
            <p className="text-gray-600 mb-6">
              Start solving problems to build your skill profile
            </p>
            <Link href="/problems">
              <Button>Browse Problems</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Skills Overview Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map((skill) => {
                  const strengthScore = getStrengthScore(skill);
                  const nextBadge = getNextBadgeMilestone(skill.problems_solved);
                  const progression = calculateDifficultyProgression(
                    skill.easy_solved,
                    skill.medium_solved,
                    skill.hard_solved
                  );

                  return (
                    <Card key={skill.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getCategoryIcon(skill.category)}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{skill.category}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getSkillLevelColor(
                                skill.skill_level
                              )}`}
                            >
                              {skill.skill_level}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Problems Solved</span>
                          <span className="font-semibold">{skill.problems_solved}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Strength Score</span>
                          <span className="font-semibold">{strengthScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${strengthScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Difficulty Progression */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-2">Difficulty Breakdown</div>
                        <div className="flex gap-2">
                          <div className="flex-1 text-center">
                            <div className="text-lg font-bold text-green-600">{progression.easy}</div>
                            <div className="text-xs text-gray-500">Easy</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {progression.medium}
                            </div>
                            <div className="text-xs text-gray-500">Medium</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-lg font-bold text-red-600">{progression.hard}</div>
                            <div className="text-xs text-gray-500">Hard</div>
                          </div>
                        </div>
                        {progression.next_milestone && (
                          <div className="mt-2 text-xs text-gray-600">
                            Next: Solve {progression.next_milestone.target - progression.next_milestone.current} more {progression.next_milestone.difficulty} problems
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      {skill.badges.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-600 mb-2">Badges Earned</div>
                          <div className="flex gap-2">
                            {skill.badges.map((badge) => (
                              <div
                                key={badge.id}
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getBadgeColor(
                                  badge.badge_type
                                )} flex items-center justify-center text-lg shadow-md`}
                                title={badge.badge_type}
                              >
                                {getBadgeIcon(badge.badge_type)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Badge Progress */}
                      {nextBadge && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">
                            Next Badge: {nextBadge.badgeType}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${nextBadge.progress}%` }}
                              />
                            </div>
                            <div className="text-xs font-medium">
                              {nextBadge.current}/{nextBadge.target}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Weak Categories & Recommendations */}
            {weakCategories.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Focus Areas</h2>
                <Card className="p-6">
                  <p className="text-gray-600 mb-4">
                    These categories need more practice. Generate a study plan to improve!
                  </p>
                  <div className="space-y-3">
                    {weakCategories.map((insight) => (
                      <div
                        key={insight.category}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getCategoryIcon(insight.category)}</div>
                          <div>
                            <div className="font-semibold">{insight.category}</div>
                            <div className="text-sm text-gray-600">
                              {insight.problems_solved} solved • Recommended: {insight.recommended_difficulty}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleGeneratePlan(insight.category)}
                          disabled={generating && selectedCategory === insight.category}
                          variant="secondary"
                        >
                          {generating && selectedCategory === insight.category
                            ? 'Generating...'
                            : 'Generate Plan'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Active Study Plans */}
            {studyPlans.filter((p) => p.status === 'active').length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Active Study Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studyPlans
                    .filter((p) => p.status === 'active')
                    .map((plan) => (
                      <Card key={plan.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{plan.title}</h3>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold">
                              {plan.progress.completed}/{plan.progress.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${plan.progress.percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {plan.problems.slice(0, 3).map((pp) => (
                            <Link
                              key={pp.id}
                              href={`/problems/${pp.problem.slug}`}
                              className="block p-2 hover:bg-gray-50 rounded"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{pp.problem.title}</span>
                                {pp.completed && (
                                  <span className="text-green-600 text-sm">✓</span>
                                )}
                              </div>
                            </Link>
                          ))}
                          {plan.problems.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{plan.problems.length - 3} more problems
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

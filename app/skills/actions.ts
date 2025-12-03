'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  UserSkill,
  SkillWithBadges,
  StudyPlan,
  StudyPlanWithProblems,
  SkillInsight,
} from '@/types/skills';

export async function getUserSkills() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: skills, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', user.id)
    .order('problems_solved', { ascending: false });

  if (error) {
    console.error('Error fetching user skills:', error);
    return { error: 'Failed to fetch skills' };
  }

  return { data: skills as UserSkill[] };
}

export async function getUserSkillsWithBadges() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: skills, error: skillsError } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', user.id)
    .order('problems_solved', { ascending: false });

  if (skillsError) {
    console.error('Error fetching skills:', skillsError);
    return { error: 'Failed to fetch skills' };
  }

  const { data: badges, error: badgesError } = await supabase
    .from('skill_badges')
    .select('*')
    .eq('user_id', user.id);

  if (badgesError) {
    console.error('Error fetching badges:', badgesError);
    return { error: 'Failed to fetch badges' };
  }

  const skillsWithBadges: SkillWithBadges[] = (skills || []).map((skill) => ({
    ...skill,
    badges: (badges || []).filter((badge) => badge.category === skill.category),
  }));

  return { data: skillsWithBadges };
}

export async function getSkillByCategory(category: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: skill, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .maybeSingle();

  if (error) {
    console.error('Error fetching skill:', error);
    return { error: 'Failed to fetch skill' };
  }

  return { data: skill as UserSkill | null };
}

export async function getWeakCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase.rpc('get_weak_categories', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching weak categories:', error);
    return { error: 'Failed to fetch weak categories' };
  }

  return { data: data as SkillInsight[] };
}

export async function getRecommendedProblems(category?: string, difficulty?: string, limit = 10) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get problems the user hasn't solved yet
  const { data: solvedProblems } = await supabase
    .from('user_problem_progress')
    .select('problem_id')
    .eq('user_id', user.id)
    .eq('status', 'Solved');

  const solvedIds = (solvedProblems || []).map((p) => p.problem_id);

  let query = supabase
    .from('problems')
    .select('*')
    .order('difficulty', { ascending: true })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (solvedIds.length > 0) {
    query = query.not('id', 'in', `(${solvedIds.join(',')})`);
  }

  const { data: problems, error } = await query;

  if (error) {
    console.error('Error fetching recommended problems:', error);
    return { error: 'Failed to fetch recommended problems' };
  }

  return { data: problems };
}

export async function generateStudyPlan(targetCategory: string, duration = 7) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user's skill level for this category
  const { data: skill } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', targetCategory)
    .maybeSingle();

  // Determine recommended difficulty
  let recommendedDifficulty: string;
  if (!skill || skill.easy_solved < 3) {
    recommendedDifficulty = 'easy';
  } else if (skill.medium_solved < 5) {
    recommendedDifficulty = 'medium';
  } else {
    recommendedDifficulty = 'hard';
  }

  // Get unsolved problems
  const result = await getRecommendedProblems(targetCategory, recommendedDifficulty, 10);

  if (result.error || !result.data || result.data.length === 0) {
    return { error: 'No problems available for this category' };
  }

  const problems = result.data;

  // Create study plan
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  const { data: studyPlan, error: planError } = await supabase
    .from('study_plans')
    .insert({
      user_id: user.id,
      title: `${targetCategory} - ${duration} Day Plan`,
      description: `Master ${targetCategory} with ${problems.length} ${recommendedDifficulty} problems`,
      target_category: targetCategory,
      end_date: endDate.toISOString(),
      status: 'active',
    })
    .select()
    .single();

  if (planError || !studyPlan) {
    console.error('Error creating study plan:', planError);
    return { error: 'Failed to create study plan' };
  }

  // Add problems to study plan
  const studyPlanProblems = problems.slice(0, duration).map((problem, index) => ({
    study_plan_id: studyPlan.id,
    problem_id: problem.id,
    order_index: index + 1,
  }));

  const { error: problemsError } = await supabase
    .from('study_plan_problems')
    .insert(studyPlanProblems);

  if (problemsError) {
    console.error('Error adding problems to study plan:', problemsError);
    return { error: 'Failed to add problems to study plan' };
  }

  revalidatePath('/skills');
  return { data: studyPlan };
}

export async function getUserStudyPlans() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: plans, error } = await supabase
    .from('study_plans')
    .select(`
      *,
      study_plan_problems (
        *,
        problem:problems (
          id,
          title,
          slug,
          difficulty,
          category
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching study plans:', error);
    return { error: 'Failed to fetch study plans' };
  }

  const plansWithProgress: StudyPlanWithProblems[] = (plans || []).map((plan: any) => {
    const problems = plan.study_plan_problems || [];
    const completed = problems.filter((p: any) => p.completed).length;
    const total = problems.length;

    return {
      ...plan,
      problems: problems.sort((a: any, b: any) => a.order_index - b.order_index),
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  });

  return { data: plansWithProgress };
}

export async function markStudyPlanProblemComplete(studyPlanProblemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('study_plan_problems')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', studyPlanProblemId);

  if (error) {
    console.error('Error marking problem as complete:', error);
    return { error: 'Failed to mark problem as complete' };
  }

  revalidatePath('/skills');
  return { success: true };
}

export async function updateStudyPlanStatus(studyPlanId: string, status: 'active' | 'completed' | 'paused') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('study_plans')
    .update({ status })
    .eq('id', studyPlanId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating study plan status:', error);
    return { error: 'Failed to update study plan status' };
  }

  revalidatePath('/skills');
  return { success: true };
}

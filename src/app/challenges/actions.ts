'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Challenge, ChallengeWithStats, ChallengeLeaderboardEntry } from '@/types/challenge';

export async function getChallenges(status?: 'upcoming' | 'active' | 'completed') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('challenges')
    .select(`
      *,
      problem:problems (
        id,
        title,
        slug,
        difficulty
      )
    `)
    .order('start_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: challenges, error } = await query;

  if (error) {
    console.error('Error fetching challenges:', error);
    return { error: 'Failed to fetch challenges' };
  }

  // Get participant counts and user participation for each challenge
  const challengesWithStats = await Promise.all(
    (challenges || []).map(async (challenge) => {
      const { count: participantCount } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id);

      const { count: completionCount } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id)
        .eq('completed', true);

      let userParticipant = null;
      if (user) {
        const { data } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .maybeSingle();
        userParticipant = data;
      }

      return {
        ...challenge,
        participant_count: participantCount || 0,
        completion_count: completionCount || 0,
        user_participant: userParticipant,
      };
    })
  );

  return { data: challengesWithStats as ChallengeWithStats[] };
}

export async function getChallengeById(challengeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select(`
      *,
      problem:problems (
        id,
        title,
        slug,
        difficulty,
        description
      )
    `)
    .eq('id', challengeId)
    .single();

  if (error || !challenge) {
    console.error('Error fetching challenge:', error);
    return { error: 'Challenge not found' };
  }

  // Get participant counts
  const { count: participantCount } = await supabase
    .from('challenge_participants')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId);

  const { count: completionCount } = await supabase
    .from('challenge_participants')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('completed', true);

  // Get user participation
  let userParticipant = null;
  if (user) {
    const { data } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle();
    userParticipant = data;
  }

  return {
    data: {
      ...challenge,
      participant_count: participantCount || 0,
      completion_count: completionCount || 0,
      user_participant: userParticipant,
    } as ChallengeWithStats,
  };
}

export async function joinChallenge(challengeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
    });

  if (error) {
    console.error('Error joining challenge:', error);
    return { error: 'Failed to join challenge' };
  }

  revalidatePath('/challenges');
  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function getChallengeLeaderboard(challengeId: string): Promise<{
  data?: ChallengeLeaderboardEntry[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: participants, error } = await supabase
    .from('challenge_participants')
    .select(`
      rank,
      user_id,
      score,
      completed_at,
      users:user_id (
        name
      )
    `)
    .eq('challenge_id', challengeId)
    .eq('completed', true)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return { error: 'Failed to fetch leaderboard' };
  }

  const leaderboard = (participants || []).map((p: any) => ({
    rank: p.rank || 0,
    user_id: p.user_id,
    user_name: p.users?.name || 'Anonymous',
    score: p.score,
    completed_at: p.completed_at,
    is_current_user: user?.id === p.user_id,
  }));

  return { data: leaderboard };
}

export async function getActiveChallenges() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select(`
      *,
      problem:problems (
        id,
        title,
        slug,
        difficulty
      )
    `)
    .eq('status', 'active')
    .order('end_date', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Error fetching active challenges:', error);
    return { error: 'Failed to fetch active challenges' };
  }

  // Get participant data for each challenge
  const challengesWithStats = await Promise.all(
    (challenges || []).map(async (challenge) => {
      const { count: participantCount } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id);

      let userParticipant = null;
      if (user) {
        const { data } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .maybeSingle();
        userParticipant = data;
      }

      return {
        ...challenge,
        participant_count: participantCount || 0,
        user_participant: userParticipant,
      };
    })
  );

  return { data: challengesWithStats };
}

export async function updateChallengeStatuses() {
  const supabase = await createClient();

  const { error } = await supabase.rpc('update_challenge_status');

  if (error) {
    console.error('Error updating challenge statuses:', error);
    return { error: 'Failed to update challenge statuses' };
  }

  return { success: true };
}

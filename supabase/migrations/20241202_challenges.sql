-- Create challenges table for weekly coding challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_points INTEGER DEFAULT 100,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create challenge_participants table to track who joined
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  UNIQUE(challenge_id, user_id)
);

-- Create challenge_submissions table to link submissions to challenges
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_best_submission BOOLEAN DEFAULT FALSE,
  UNIQUE(participant_id, submission_id)
);

-- Create indexes
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_challenge_submissions_challenge ON challenge_submissions(challenge_id);
CREATE INDEX idx_challenge_submissions_participant ON challenge_submissions(participant_id);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read, admin write)
CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for challenge_participants
CREATE POLICY "Anyone can view challenge participants"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for challenge_submissions
CREATE POLICY "Anyone can view challenge submissions"
  ON challenge_submissions FOR SELECT
  USING (true);

CREATE POLICY "Users can submit to challenges they joined"
  ON challenge_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_participants.id = challenge_submissions.participant_id
      AND challenge_participants.user_id = auth.uid()
    )
  );

-- Function to update challenges.updated_at
CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for challenges updated_at
CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_challenges_updated_at();

-- Function to automatically update challenge status based on dates
CREATE OR REPLACE FUNCTION update_challenge_status()
RETURNS void AS $$
BEGIN
  -- Mark challenges as active if start_date has passed
  UPDATE challenges
  SET status = 'active'
  WHERE status = 'upcoming'
  AND start_date <= NOW();

  -- Mark challenges as completed if end_date has passed
  UPDATE challenges
  SET status = 'completed'
  WHERE status = 'active'
  AND end_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update participant ranks
CREATE OR REPLACE FUNCTION update_challenge_ranks(p_challenge_id UUID)
RETURNS void AS $$
BEGIN
  WITH ranked_participants AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC NULLS LAST) as new_rank
    FROM challenge_participants
    WHERE challenge_id = p_challenge_id
    AND completed = true
  )
  UPDATE challenge_participants cp
  SET rank = rp.new_rank
  FROM ranked_participants rp
  WHERE cp.id = rp.id;
END;
$$ LANGUAGE plpgsql;

-- Function to record challenge submission and update participant stats
CREATE OR REPLACE FUNCTION record_challenge_submission(
  p_challenge_id UUID,
  p_user_id UUID,
  p_submission_id UUID,
  p_points_earned INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_participant_id UUID;
  v_participant challenge_participants%ROWTYPE;
  v_is_first_completion BOOLEAN;
BEGIN
  -- Get or create participant
  INSERT INTO challenge_participants (challenge_id, user_id)
  VALUES (p_challenge_id, p_user_id)
  ON CONFLICT (challenge_id, user_id) DO NOTHING
  RETURNING id INTO v_participant_id;

  -- If participant already existed, get their ID
  IF v_participant_id IS NULL THEN
    SELECT id INTO v_participant_id
    FROM challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id;
  END IF;

  -- Check if this is first completion
  SELECT * INTO v_participant
  FROM challenge_participants
  WHERE id = v_participant_id;

  v_is_first_completion := NOT v_participant.completed;

  -- Record the submission
  INSERT INTO challenge_submissions (
    challenge_id,
    participant_id,
    submission_id,
    points_earned
  ) VALUES (
    p_challenge_id,
    v_participant_id,
    p_submission_id,
    p_points_earned
  );

  -- Update participant with best score
  UPDATE challenge_participants
  SET 
    score = GREATEST(score, p_points_earned),
    completed = true,
    completed_at = CASE 
      WHEN completed = false THEN NOW()
      ELSE completed_at
    END
  WHERE id = v_participant_id;

  -- Mark this as best submission if it's the highest score
  UPDATE challenge_submissions cs
  SET is_best_submission = (
    cs.points_earned = (
      SELECT MAX(points_earned)
      FROM challenge_submissions
      WHERE participant_id = v_participant_id
    )
  )
  WHERE cs.participant_id = v_participant_id;

  -- Update ranks for this challenge
  PERFORM update_challenge_ranks(p_challenge_id);

  -- Return participant data
  SELECT row_to_json(cp.*) INTO v_participant
  FROM challenge_participants cp
  WHERE cp.id = v_participant_id;

  RETURN json_build_object(
    'participant', v_participant,
    'first_completion', v_is_first_completion
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

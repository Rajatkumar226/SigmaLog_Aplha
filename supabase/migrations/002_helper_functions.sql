-- =====================================================
-- Helper Functions for Data Integrity
-- =====================================================

-- =====================================================
-- Function: Get current server date
-- =====================================================
-- Returns the current date from the server to ensure consistency
-- across all clients regardless of timezone
CREATE OR REPLACE FUNCTION public.get_current_date()
RETURNS DATE AS $$
BEGIN
  RETURN CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_current_date() IS 'Returns current server date for data integrity';

-- =====================================================
-- Function: Calculate user streak
-- =====================================================
-- Calculates the current streak for a user
-- A streak is broken if any day is not a "perfect day"
-- (perfect day = all habits completed)
CREATE OR REPLACE FUNCTION public.calculate_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_current_date DATE := CURRENT_DATE;
  v_habits_count INT;
  v_completed_count INT;
BEGIN
  -- Get total active habits for user
  SELECT COUNT(*)
  INTO v_habits_count
  FROM public.habits
  WHERE user_id = p_user_id AND is_active = true;

  -- If no habits, streak is 0
  IF v_habits_count = 0 THEN
    RETURN 0;
  END IF;

  -- Loop backwards from today to find streak
  LOOP
    -- Count completed habits for current date
    SELECT COUNT(DISTINCT habit_id)
    INTO v_completed_count
    FROM public.daily_logs
    WHERE user_id = p_user_id
      AND log_date = v_current_date;

    -- Check if it's a perfect day
    IF v_completed_count = v_habits_count THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - INTERVAL '1 day';
    ELSE
      EXIT; -- Streak broken
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.calculate_streak(UUID) IS 'Calculates current streak for a user based on perfect days';

-- =====================================================
-- Function: Get daily score for a date
-- =====================================================
-- Returns the score and max score for a specific date
CREATE OR REPLACE FUNCTION public.get_daily_score(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  score INT,
  max_score INT,
  completed_habits INT,
  total_habits INT
) AS $$
BEGIN
  RETURN QUERY
  WITH habit_points AS (
    SELECT
      h.id,
      h.points,
      CASE WHEN dl.id IS NOT NULL THEN true ELSE false END as completed
    FROM public.habits h
    LEFT JOIN public.daily_logs dl
      ON h.id = dl.habit_id
      AND dl.user_id = p_user_id
      AND dl.log_date = p_date
    WHERE h.user_id = p_user_id
      AND h.is_active = true
  )
  SELECT
    COALESCE(SUM(CASE WHEN completed THEN points ELSE 0 END), 0)::INT as score,
    COALESCE(SUM(points), 0)::INT as max_score,
    COUNT(CASE WHEN completed THEN 1 END)::INT as completed_habits,
    COUNT(*)::INT as total_habits
  FROM habit_points;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_daily_score(UUID, DATE) IS 'Returns score metrics for a specific date';

-- =====================================================
-- Function: Check and create milestone
-- =====================================================
-- Checks if user has achieved a milestone and creates it if not exists
CREATE OR REPLACE FUNCTION public.check_and_create_milestone(
  p_user_id UUID,
  p_streak_length INT
)
RETURNS TABLE (
  milestone_created BOOLEAN,
  milestone_type TEXT
) AS $$
DECLARE
  v_milestone_type TEXT;
  v_already_exists BOOLEAN;
BEGIN
  -- Determine milestone type based on streak length
  v_milestone_type := CASE
    WHEN p_streak_length >= 365 THEN '365_day'
    WHEN p_streak_length >= 90 THEN '90_day'
    WHEN p_streak_length >= 30 THEN '30_day'
    WHEN p_streak_length >= 7 THEN '7_day'
    ELSE NULL
  END;

  -- If no milestone threshold reached, return false
  IF v_milestone_type IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if milestone already exists
  SELECT EXISTS(
    SELECT 1
    FROM public.milestones
    WHERE user_id = p_user_id
      AND milestone_type = v_milestone_type
  ) INTO v_already_exists;

  -- If milestone already exists, return false
  IF v_already_exists THEN
    RETURN QUERY SELECT false, v_milestone_type;
    RETURN;
  END IF;

  -- Create milestone
  INSERT INTO public.milestones (user_id, milestone_type, streak_length)
  VALUES (p_user_id, v_milestone_type, p_streak_length);

  RETURN QUERY SELECT true, v_milestone_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_and_create_milestone(UUID, INT) IS 'Creates milestone if threshold reached and not already exists';

-- =====================================================
-- Function: Get weekly stats
-- =====================================================
-- Returns aggregated stats for the past 7 days
CREATE OR REPLACE FUNCTION public.get_weekly_stats(p_user_id UUID)
RETURNS TABLE (
  date DATE,
  score INT,
  max_score INT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT GENERATE_SERIES(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE as date
  )
  SELECT
    d.date,
    COALESCE(ds.score, 0) as score,
    COALESCE(ds.max_score, 0) as max_score,
    CASE
      WHEN COALESCE(ds.max_score, 0) > 0
      THEN ROUND((COALESCE(ds.score, 0)::NUMERIC / ds.max_score::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage
  FROM dates d
  LEFT JOIN LATERAL public.get_daily_score(p_user_id, d.date) ds ON true
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_weekly_stats(UUID) IS 'Returns stats for the past 7 days';

-- =====================================================
-- Function: Get monthly heatmap data
-- =====================================================
-- Returns daily scores for a specific month
CREATE OR REPLACE FUNCTION public.get_monthly_heatmap(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  date DATE,
  score INT,
  max_score INT,
  is_perfect_day BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT GENERATE_SERIES(
      DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)),
      DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month' - INTERVAL '1 day',
      INTERVAL '1 day'
    )::DATE as date
  )
  SELECT
    d.date,
    COALESCE(ds.score, 0) as score,
    COALESCE(ds.max_score, 0) as max_score,
    (COALESCE(ds.score, 0) = COALESCE(ds.max_score, 0) AND COALESCE(ds.max_score, 0) > 0) as is_perfect_day
  FROM dates d
  LEFT JOIN LATERAL public.get_daily_score(p_user_id, d.date) ds ON true
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_monthly_heatmap(UUID, INT, INT) IS 'Returns heatmap data for a specific month';

-- =====================================================
-- Function: Check if user has logged today
-- =====================================================
-- Returns true if user has logged at least one habit today
CREATE OR REPLACE FUNCTION public.has_logged_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_logged BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.daily_logs
    WHERE user_id = p_user_id
      AND log_date = CURRENT_DATE
  ) INTO v_has_logged;

  RETURN v_has_logged;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.has_logged_today(UUID) IS 'Checks if user has logged at least one habit today';

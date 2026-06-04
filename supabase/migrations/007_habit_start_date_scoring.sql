-- =====================================================
-- SigmaLog: Habit Start-Date Aware Scoring
-- =====================================================
-- Problem:
--   get_daily_score() and calculate_streak() counted ALL currently
--   active habits toward EVERY date's max_score. Adding a new habit
--   therefore retroactively lowered the completion % of past days,
--   turning previously-perfect (green) calendar days into partial ones
--   and breaking historical streaks.
--
-- Fix:
--   A habit only counts toward a given day if it already existed on
--   that day (created_at::date <= the day in question). New habits
--   start counting from the day they are added; past completed days
--   stay green forever.
-- =====================================================

-- =====================================================
-- Function: Get daily score for a date (start-date aware)
-- =====================================================
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
      AND h.created_at::date <= p_date   -- only habits that existed on this day
  )
  SELECT
    COALESCE(SUM(CASE WHEN completed THEN points ELSE 0 END), 0)::INT as score,
    COALESCE(SUM(points), 0)::INT as max_score,
    COUNT(CASE WHEN completed THEN 1 END)::INT as completed_habits,
    COUNT(*)::INT as total_habits
  FROM habit_points;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_daily_score(UUID, DATE) IS 'Returns score metrics for a specific date; only counts habits that existed on that date';

-- =====================================================
-- Function: Calculate user streak (start-date aware)
-- =====================================================
-- A streak day is "perfect" only when every habit that existed on
-- that day was completed. The required habit count is recomputed per
-- day so adding a new habit never invalidates historical perfect days.
CREATE OR REPLACE FUNCTION public.calculate_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_current_date DATE := CURRENT_DATE;
  v_habits_count INT;
  v_completed_count INT;
BEGIN
  -- If the user has no active habits at all, streak is 0
  IF NOT EXISTS (
    SELECT 1 FROM public.habits
    WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RETURN 0;
  END IF;

  -- Loop backwards from today to find streak
  LOOP
    -- Habits that existed on this specific day
    SELECT COUNT(*)
    INTO v_habits_count
    FROM public.habits
    WHERE user_id = p_user_id
      AND is_active = true
      AND created_at::date <= v_current_date;

    -- No habits existed yet on this day -> streak cannot extend further back
    IF v_habits_count = 0 THEN
      EXIT;
    END IF;

    -- Count completed habits for current date
    SELECT COUNT(DISTINCT habit_id)
    INTO v_completed_count
    FROM public.daily_logs
    WHERE user_id = p_user_id
      AND log_date = v_current_date;

    -- Check if it's a perfect day
    IF v_completed_count >= v_habits_count THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - INTERVAL '1 day';
    ELSE
      EXIT; -- Streak broken
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.calculate_streak(UUID) IS 'Calculates current streak using only habits that existed on each day';

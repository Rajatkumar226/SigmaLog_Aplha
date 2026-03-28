-- =====================================================
-- Counter Functions
-- =====================================================
-- Helper functions to increment user counters

-- =====================================================
-- Function: Increment habit count
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_habit_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET total_habits_created = total_habits_created + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.increment_habit_count(UUID) IS 'Increments user habit creation counter';

-- =====================================================
-- Function: Increment log count
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_log_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET total_logs_created = total_logs_created + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.increment_log_count(UUID) IS 'Increments user log creation counter';

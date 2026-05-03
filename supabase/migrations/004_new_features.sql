-- =====================================================
-- SigmaLog: New Features Migration
-- No Excuse Log + Discipline Time Capsule
-- =====================================================

-- =====================================================
-- 1. HABIT_EXCUSES TABLE
-- =====================================================
CREATE TABLE public.habit_excuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  excuse_date DATE NOT NULL DEFAULT CURRENT_DATE,
  excuse_text TEXT NOT NULL CHECK (LENGTH(TRIM(excuse_text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_excuse_per_habit_per_day UNIQUE (user_id, habit_id, excuse_date)
);

CREATE INDEX idx_habit_excuses_user_date ON public.habit_excuses(user_id, excuse_date DESC);
CREATE INDEX idx_habit_excuses_habit ON public.habit_excuses(habit_id);

ALTER TABLE public.habit_excuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own excuses"
  ON public.habit_excuses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own excuses today"
  ON public.habit_excuses FOR INSERT
  WITH CHECK (auth.uid() = user_id AND excuse_date = CURRENT_DATE);

CREATE POLICY "Users can delete own excuses today"
  ON public.habit_excuses FOR DELETE
  USING (auth.uid() = user_id AND excuse_date = CURRENT_DATE);

-- =====================================================
-- 2. TIME_CAPSULES TABLE
-- =====================================================
CREATE TABLE public.time_capsules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (LENGTH(TRIM(message)) > 0),
  written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deliver_on DATE NOT NULL,
  is_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_capsules_user ON public.time_capsules(user_id);
CREATE INDEX idx_time_capsules_deliver ON public.time_capsules(user_id, deliver_on);

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own capsules"
  ON public.time_capsules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own capsules"
  ON public.time_capsules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own capsules"
  ON public.time_capsules FOR UPDATE
  USING (auth.uid() = user_id);

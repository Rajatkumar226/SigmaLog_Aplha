-- =====================================================
-- SigmaLog Database Schema
-- =====================================================
-- This migration creates all tables for the SigmaLog application
-- with proper constraints, indexes, and Row Level Security (RLS)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (extends auth.users)
-- =====================================================
-- Stores additional user profile data beyond Supabase auth
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',

  -- Metadata
  total_habits_created INT DEFAULT 0,
  total_logs_created INT DEFAULT 0,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_active ON public.users(last_active_at DESC);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read/update their own data
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 2. HABITS TABLE
-- =====================================================
-- Stores user-defined habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Habit details
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
  category TEXT NOT NULL CHECK (LENGTH(TRIM(category)) > 0), -- Allows custom categories
  points INT NOT NULL CHECK (points IN (1, 2, 3)),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Ensure unique habit names per user
  CONSTRAINT unique_habit_per_user UNIQUE (user_id, name)
);

-- Indexes for faster queries
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_user_active ON public.habits(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_habits_category ON public.habits(category);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own habits
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. DAILY_LOGS TABLE
-- =====================================================
-- Stores daily habit completion logs
-- CRITICAL: Enforces data integrity rules
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,

  -- Date tracking (DATE type for proper date comparison)
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Server-generated timestamps (CANNOT be overridden by client)
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CRITICAL CONSTRAINT: One habit can only be logged once per day per user
  CONSTRAINT unique_daily_log UNIQUE (user_id, habit_id, log_date)
);

-- Indexes for fast queries
CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX idx_daily_logs_habit ON public.daily_logs(habit_id);
CREATE INDEX idx_daily_logs_date ON public.daily_logs(log_date DESC);

-- Enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own logs
CREATE POLICY "Users can view own logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND log_date = CURRENT_DATE  -- CRITICAL: Can only log for TODAY
  );

-- Allow users to delete their own logs, but ONLY for today's date
-- This enables "toggle" functionality while preserving historical data integrity
CREATE POLICY "Users can delete own logs for today"
  ON public.daily_logs FOR DELETE
  USING (
    auth.uid() = user_id
    AND log_date = CURRENT_DATE  -- Can only delete TODAY's logs, not past logs
  );

-- NO UPDATE POLICIES - Logs cannot be modified once created
-- This enforces data integrity (no changing past completion status)

-- =====================================================
-- 4. MILESTONES TABLE
-- =====================================================
-- Stores achieved milestones (7, 30, 90, 365 day streaks)
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('7_day', '30_day', '90_day', '365_day')),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Streak context at achievement time
  streak_length INT NOT NULL CHECK (streak_length > 0),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure milestone is only triggered once per type per user
  CONSTRAINT unique_milestone_per_user UNIQUE (user_id, milestone_type)
);

-- Indexes
CREATE INDEX idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX idx_milestones_type ON public.milestones(milestone_type);
CREATE INDEX idx_milestones_achieved ON public.milestones(achieved_at DESC);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own milestones
CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

-- Milestones are created by server-side functions only
-- No direct INSERT policy for users

-- =====================================================
-- 5. NOTIFICATIONS TABLE
-- =====================================================
-- Stores notification preferences and reminder settings
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '20:00:00',  -- 8 PM default
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Notification frequency
  send_if_not_logged BOOLEAN NOT NULL DEFAULT true,

  -- Last sent tracking
  last_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One notification setting per user
  CONSTRAINT unique_notification_per_user UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_enabled ON public.notifications(enabled) WHERE enabled = true;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification settings"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification settings"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. SHARES TABLE
-- =====================================================
-- Tracks when users share their progress
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Share details
  share_type TEXT NOT NULL CHECK (share_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Share context (what was shared)
  share_data JSONB,  -- Stores snapshot of stats at share time

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shares_user_id ON public.shares(user_id);
CREATE INDEX idx_shares_type ON public.shares(share_type);
CREATE INDEX idx_shares_shared_at ON public.shares(shared_at DESC);

-- Enable RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shares"
  ON public.shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shares"
  ON public.shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. FEEDBACK TABLE
-- =====================================================
-- Stores user feedback (for Alpha version)
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Feedback content
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  message TEXT NOT NULL CHECK (LENGTH(TRIM(message)) > 0),

  -- User context (optional)
  user_email TEXT,
  browser_info TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'ignored')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_type ON public.feedback(type);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can create feedback (even anonymous)
CREATE POLICY "Anyone can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.habits IS 'User-defined habits with categories and point values';
COMMENT ON TABLE public.daily_logs IS 'Daily habit completion logs - immutable and date-restricted';
COMMENT ON TABLE public.milestones IS 'Achievement records for streak milestones';
COMMENT ON TABLE public.notifications IS 'User notification preferences and reminder settings';
COMMENT ON TABLE public.shares IS 'Social sharing event tracking';
COMMENT ON TABLE public.feedback IS 'User feedback for Alpha version improvements';

COMMENT ON CONSTRAINT unique_daily_log ON public.daily_logs IS 'Ensures one habit can only be logged once per day';
COMMENT ON POLICY "Users can create own logs" ON public.daily_logs IS 'CRITICAL: Only allows logging for CURRENT_DATE to prevent backdating';

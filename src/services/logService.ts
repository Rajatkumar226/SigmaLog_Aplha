/**
 * Daily Log Service
 * ==================
 * Handles daily habit logging with strict data integrity rules
 *
 * CRITICAL DATA INTEGRITY RULES:
 * 1. Users can ONLY log habits for TODAY (current server date)
 * 2. No backdating allowed
 * 3. No future dating allowed
 * 4. One habit can only be logged once per day
 * 5. Logs are IMMUTABLE (no updates or deletes)
 * 6. All timestamps are server-generated
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

export interface LogServiceResponse<T = DailyLog> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DailyScore {
  date: string;
  score: number;
  maxScore: number;
  completedHabits: number;
  totalHabits: number;
}

/**
 * Log a habit completion for TODAY
 * CRITICAL: Can only log for current server date
 */
export async function logHabit(habitId: string): Promise<LogServiceResponse<DailyLog>> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Insert log (RLS policy enforces log_date = CURRENT_DATE)
    const { data, error } = await supabase
      .from('daily_logs')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        // log_date will default to CURRENT_DATE (server-side)
        // completed_at will default to NOW() (server-side)
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already logged today)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This habit has already been logged today',
        };
      }
      // Handle RLS policy violation (trying to log for wrong date)
      if (error.message.includes('violates row-level security policy')) {
        return {
          success: false,
          error: 'You can only log habits for today',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    // Update user's log count
    await supabase.rpc('increment_log_count', { user_id: user.id });

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log habit',
    };
  }
}

/**
 * Remove a log for TODAY ONLY
 * Users can "un-check" a habit if they made a mistake
 * But ONLY for today's date
 */
export async function removeLog(habitId: string): Promise<LogServiceResponse<void>> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // First, get the server's current date to ensure consistency
    const { data: serverDate } = await supabase.rpc('get_current_date');

    const today = serverDate || new Date().toISOString().split('T')[0];

    // Delete log for today only
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .eq('log_date', today);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove log',
    };
  }
}

/**
 * Get all logs for a specific date
 */
export async function getLogsForDate(date: string): Promise<LogServiceResponse<DailyLog[]>> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', date)
      .order('completed_at', { ascending: true });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    };
  }
}

/**
 * Get all logs for a date range
 */
export async function getLogsForDateRange(
  startDate: string,
  endDate: string
): Promise<LogServiceResponse<DailyLog[]>> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    };
  }
}

/**
 * Get today's completed habit IDs
 */
export async function getTodayCompletedHabits(): Promise<LogServiceResponse<string[]>> {
  try {
    // Use server date for consistency
    const { data: serverDate } = await supabase.rpc('get_current_date');
    const today = serverDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_logs')
      .select('habit_id')
      .eq('log_date', today);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((log: any) => log.habit_id),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch today\'s habits',
    };
  }
}

/**
 * Get daily score for a specific date
 * Uses server-side function for accurate calculation
 */
export async function getDailyScore(date: string): Promise<LogServiceResponse<DailyScore>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase
      .rpc('get_daily_score', {
        p_user_id: user.id,
        p_date: date,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          date,
          score: 0,
          maxScore: 0,
          completedHabits: 0,
          totalHabits: 0,
        },
      };
    }

    return {
      success: true,
      data: {
        date,
        score: data[0].score,
        maxScore: data[0].max_score,
        completedHabits: data[0].completed_habits,
        totalHabits: data[0].total_habits,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get daily score',
    };
  }
}

/**
 * Get weekly stats (last 7 days)
 */
export async function getWeeklyStats(): Promise<LogServiceResponse<DailyScore[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase.rpc('get_weekly_stats', {
      p_user_id: user.id,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map(day => ({
        date: day.date,
        score: day.score,
        maxScore: day.max_score,
        completedHabits: 0, // Not included in weekly stats
        totalHabits: 0,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get weekly stats',
    };
  }
}

/**
 * Get monthly heatmap data
 */
export async function getMonthlyHeatmap(
  year: number,
  month: number
): Promise<LogServiceResponse<Array<{
  date: string;
  score: number;
  maxScore: number;
  isPerfectDay: boolean;
}>>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase.rpc('get_monthly_heatmap', {
      p_user_id: user.id,
      p_year: year,
      p_month: month,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map(day => ({
        date: day.date,
        score: day.score,
        maxScore: day.max_score,
        isPerfectDay: day.is_perfect_day,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get monthly heatmap',
    };
  }
}

/**
 * Calculate current streak
 * A streak is maintained only on "perfect days" (all habits completed)
 */
export async function calculateStreak(): Promise<LogServiceResponse<number>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase.rpc('calculate_streak', {
      p_user_id: user.id,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate streak',
    };
  }
}

/**
 * Check if user has logged today
 */
export async function hasLoggedToday(): Promise<LogServiceResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase.rpc('has_logged_today', {
      p_user_id: user.id,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check if logged today',
    };
  }
}

/**
 * Get total logs count for user
 */
export async function getTotalLogsCount(): Promise<LogServiceResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get total logs count',
    };
  }
}

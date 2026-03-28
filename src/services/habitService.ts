/**
 * Habit Service
 * ==============
 * Manages user habits (CRUD operations)
 * - Create, read, update, delete habits
 * - Enforce business rules (e.g., unique habit names)
 * - All operations are automatically scoped to authenticated user via RLS
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

// Type assertion to work around Supabase type inference issues
const db = supabase as any;

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];

export interface HabitServiceResponse<T = Habit> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all active habits for current user
 */
export async function getHabits(): Promise<HabitServiceResponse<Habit[]>> {
  try {
    const { data, error } = await db
      .from('habits')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

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
      error: error instanceof Error ? error.message : 'Failed to fetch habits',
    };
  }
}

/**
 * Get a single habit by ID
 */
export async function getHabit(habitId: string): Promise<HabitServiceResponse<Habit>> {
  try {
    const { data, error } = await db
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('is_active', true)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch habit',
    };
  }
}

/**
 * Create a new habit
 */
export async function createHabit(
  habit: Omit<HabitInsert, 'user_id' | 'id'>
): Promise<HabitServiceResponse<Habit>> {
  try {
    // Get current user
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await db
      .from('habits')
      .insert({
        user_id: user.id,
        name: habit.name.trim(),
        category: habit.category,
        points: habit.points,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A habit with this name already exists',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    // Update user's habit count
    await db.rpc('increment_habit_count', { user_id: user.id });

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create habit',
    };
  }
}

/**
 * Create multiple habits at once
 * Useful for initial setup
 */
export async function createHabits(
  habits: Omit<HabitInsert, 'user_id' | 'id'>[]
): Promise<HabitServiceResponse<Habit[]>> {
  try {
    // Get current user
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const habitsToInsert = habits.map(habit => ({
      user_id: user.id,
      name: habit.name.trim(),
      category: habit.category,
      points: habit.points,
    }));

    const { data, error } = await db
      .from('habits')
      .insert(habitsToInsert)
      .select();

    if (error) {
      console.error('Habit creation error:', error);
      if (error.code === '23505') {
        return {
          success: false,
          error: 'One or more habits with these names already exist',
        };
      }
      // Foreign key violation - user doesn't exist in public.users
      if (error.code === '23503') {
        return {
          success: false,
          error: 'User profile not found. Please try signing out and back in.',
        };
      }
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
      error: error instanceof Error ? error.message : 'Failed to create habits',
    };
  }
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: string,
  updates: Omit<HabitUpdate, 'id' | 'user_id'>
): Promise<HabitServiceResponse<Habit>> {
  try {
    const updateData: Partial<Habit> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    if (updates.points !== undefined) {
      updateData.points = updates.points;
    }

    const { data, error } = await db
      .from('habits')
      .update(updateData)
      .eq('id', habitId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A habit with this name already exists',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update habit',
    };
  }
}

/**
 * Soft delete a habit (mark as inactive)
 * We don't hard delete to preserve historical data
 */
export async function deleteHabit(habitId: string): Promise<HabitServiceResponse<void>> {
  try {
    const { error } = await db
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId);

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
      error: error instanceof Error ? error.message : 'Failed to delete habit',
    };
  }
}

/**
 * Hard delete a habit (permanent)
 * Use with caution - this will also delete all associated logs
 */
export async function permanentlyDeleteHabit(
  habitId: string
): Promise<HabitServiceResponse<void>> {
  try {
    const { error } = await db
      .from('habits')
      .delete()
      .eq('id', habitId);

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
      error: error instanceof Error ? error.message : 'Failed to delete habit permanently',
    };
  }
}

/**
 * Hard delete ALL habits for current user (both active and inactive)
 * Use for complete data reset to avoid unique constraint issues
 */
export async function permanentlyDeleteAllHabits(): Promise<HabitServiceResponse<void>> {
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { error } = await db
      .from('habits')
      .delete()
      .eq('user_id', user.id);

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
      error: error instanceof Error ? error.message : 'Failed to delete all habits',
    };
  }
}

/**
 * Get habit statistics
 */
export async function getHabitStats(habitId: string): Promise<HabitServiceResponse<{
  totalLogs: number;
  lastLoggedAt: string | null;
  currentStreak: number;
}>> {
  try {
    // Get total logs for this habit
    const { count, error: countError } = await db
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('habit_id', habitId);

    if (countError) {
      return {
        success: false,
        error: countError.message,
      };
    }

    // Get last log date
    const { data: lastLog, error: lastLogError } = await db
      .from('daily_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .order('log_date', { ascending: false })
      .limit(1)
      .single();

    if (lastLogError && lastLogError.code !== 'PGRST116') {
      return {
        success: false,
        error: lastLogError.message,
      };
    }

    // Calculate current streak for this specific habit
    const { data: logs, error: logsError } = await db
      .from('daily_logs')
      .select('log_date')
      .eq('habit_id', habitId)
      .order('log_date', { ascending: false });

    if (logsError) {
      return {
        success: false,
        error: logsError.message,
      };
    }

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const log of logs || []) {
      const logDate = log.log_date;
      const expectedDate = currentDate.toISOString().split('T')[0];

      if (logDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      success: true,
      data: {
        totalLogs: count || 0,
        lastLoggedAt: lastLog?.completed_at || null,
        currentStreak: streak,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get habit stats',
    };
  }
}

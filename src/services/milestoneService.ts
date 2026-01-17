/**
 * Milestone Service
 * ==================
 * Detects and tracks milestone achievements (7, 30, 90, 365 day streaks)
 *
 * MILESTONE RULES:
 * 1. Milestones are triggered automatically when streak thresholds are reached
 * 2. Each milestone can only be achieved once per user
 * 3. Milestones are created server-side to prevent manipulation
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

type Milestone = Database['public']['Tables']['milestones']['Row'];
type MilestoneType = '7_day' | '30_day' | '90_day' | '365_day';

export interface MilestoneServiceResponse<T = Milestone> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MilestoneCheckResult {
  milestoneCreated: boolean;
  milestoneType: MilestoneType | null;
  milestone?: Milestone;
}

/**
 * Check if user has reached a new milestone
 * Call this after logging a habit or calculating streak
 */
export async function checkAndCreateMilestone(
  streakLength: number
): Promise<MilestoneServiceResponse<MilestoneCheckResult>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Call server function to check and create milestone
    const { data, error } = await supabase.rpc('check_and_create_milestone', {
      p_user_id: user.id,
      p_streak_length: streakLength,
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
          milestoneCreated: false,
          milestoneType: null,
        },
      };
    }

    const result = data[0];

    // If milestone was created, fetch it
    let milestone: Milestone | undefined;
    if (result.milestone_created && result.milestone_type) {
      const milestoneData = await getMilestone(result.milestone_type);
      if (milestoneData.success && milestoneData.data) {
        milestone = milestoneData.data;
      }
    }

    return {
      success: true,
      data: {
        milestoneCreated: result.milestone_created,
        milestoneType: result.milestone_type,
        milestone,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check milestone',
    };
  }
}

/**
 * Get all milestones for current user
 */
export async function getMilestones(): Promise<MilestoneServiceResponse<Milestone[]>> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('achieved_at', { ascending: false });

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
      error: error instanceof Error ? error.message : 'Failed to fetch milestones',
    };
  }
}

/**
 * Get a specific milestone by type
 */
export async function getMilestone(
  milestoneType: MilestoneType
): Promise<MilestoneServiceResponse<Milestone>> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('milestone_type', milestoneType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Milestone not found',
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
      error: error instanceof Error ? error.message : 'Failed to fetch milestone',
    };
  }
}

/**
 * Check if user has achieved a specific milestone
 */
export async function hasMilestone(milestoneType: MilestoneType): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('id')
      .eq('milestone_type', milestoneType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking milestone:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Error checking milestone:', error);
    return false;
  }
}

/**
 * Get milestone progress (which milestones are next)
 */
export async function getMilestoneProgress(
  currentStreak: number
): Promise<{
  achieved: MilestoneType[];
  next: MilestoneType | null;
  nextThreshold: number | null;
  progress: number; // Percentage to next milestone
}> {
  try {
    // Get all achieved milestones
    const { data: milestones } = await getMilestones();
    const achieved = (milestones?.data || []).map(m => m.milestone_type);

    // Determine next milestone
    const thresholds: Array<{ type: MilestoneType; days: number }> = [
      { type: '7_day', days: 7 },
      { type: '30_day', days: 30 },
      { type: '90_day', days: 90 },
      { type: '365_day', days: 365 },
    ];

    let next: MilestoneType | null = null;
    let nextThreshold: number | null = null;

    for (const threshold of thresholds) {
      if (currentStreak < threshold.days) {
        next = threshold.type;
        nextThreshold = threshold.days;
        break;
      }
    }

    // Calculate progress percentage
    let progress = 0;
    if (next && nextThreshold) {
      // Find previous threshold
      const currentIndex = thresholds.findIndex(t => t.type === next);
      const prevThreshold = currentIndex > 0 ? thresholds[currentIndex - 1].days : 0;

      const range = nextThreshold - prevThreshold;
      const current = currentStreak - prevThreshold;
      progress = Math.min(100, Math.max(0, (current / range) * 100));
    } else if (currentStreak >= 365) {
      progress = 100;
    }

    return {
      achieved,
      next,
      nextThreshold,
      progress: Math.round(progress),
    };
  } catch (error) {
    console.error('Error getting milestone progress:', error);
    return {
      achieved: [],
      next: '7_day',
      nextThreshold: 7,
      progress: 0,
    };
  }
}

/**
 * Get milestone display info
 */
export function getMilestoneInfo(milestoneType: MilestoneType): {
  title: string;
  description: string;
  emoji: string;
  days: number;
} {
  const info = {
    '7_day': {
      title: 'Week Warrior',
      description: 'Completed 7 days of perfect discipline',
      emoji: '🔥',
      days: 7,
    },
    '30_day': {
      title: 'Month Master',
      description: 'Completed 30 days of perfect discipline',
      emoji: '💪',
      days: 30,
    },
    '90_day': {
      title: 'Quarter Champion',
      description: 'Completed 90 days of perfect discipline',
      emoji: '🏆',
      days: 90,
    },
    '365_day': {
      title: 'Year Legend',
      description: 'Completed 365 days of perfect discipline',
      emoji: '👑',
      days: 365,
    },
  };

  return info[milestoneType];
}

/**
 * Get total milestones count
 */
export async function getTotalMilestonesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('milestones')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting milestones count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting milestones count:', error);
    return 0;
  }
}

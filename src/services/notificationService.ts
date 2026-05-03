/**
 * Notification Service
 * ====================
 * Manages notification preferences and reminder settings
 *
 * ALPHA VERSION NOTE:
 * - This service stores notification preferences in the database
 * - Actual email/push notifications are NOT implemented in Alpha
 * - The check logic is ready for future integration
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

type NotificationSettings = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export interface NotificationServiceResponse<T = NotificationSettings> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get notification settings for current user
 */
export async function getNotificationSettings(): Promise<
  NotificationServiceResponse<NotificationSettings>
> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return {
          success: true,
          data: undefined, // Will trigger creation
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
      error: error instanceof Error ? error.message : 'Failed to fetch notification settings',
    };
  }
}

/**
 * Create notification settings for current user
 */
export async function createNotificationSettings(
  settings?: Partial<Omit<NotificationInsert, 'user_id' | 'id'>>
): Promise<NotificationServiceResponse<NotificationSettings>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        enabled: settings?.enabled ?? true,
        reminder_time: settings?.reminder_time ?? '20:00:00',
        timezone: settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        send_if_not_logged: settings?.send_if_not_logged ?? true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Notification settings already exist',
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
      error: error instanceof Error ? error.message : 'Failed to create notification settings',
    };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<Omit<NotificationUpdate, 'user_id' | 'id'>>
): Promise<NotificationServiceResponse<NotificationSettings>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(settings)
      .eq('user_id', user.id)
      .select()
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
      error: error instanceof Error ? error.message : 'Failed to update notification settings',
    };
  }
}

/**
 * Delete notification settings
 */
export async function deleteNotificationSettings(): Promise<NotificationServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { error } = await supabase
      .from('notifications')
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
      error: error instanceof Error ? error.message : 'Failed to delete notification settings',
    };
  }
}

/**
 * Check if user should receive a reminder notification
 * (For future implementation - Alpha version just stores preferences)
 */
export async function shouldSendReminder(): Promise<{
  shouldSend: boolean;
  reason?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { shouldSend: false, reason: 'Not authenticated' };
    }

    // Get notification settings
    const settingsResponse = await getNotificationSettings();
    if (!settingsResponse.success || !settingsResponse.data) {
      return { shouldSend: false, reason: 'No notification settings' };
    }

    const settings = settingsResponse.data;

    // Check if notifications are enabled
    if (!settings.enabled) {
      return { shouldSend: false, reason: 'Notifications disabled' };
    }

    // Check if user has logged today
    const { data: hasLogged, error } = await supabase.rpc('has_logged_today', {
      p_user_id: user.id,
    });

    if (error) {
      return { shouldSend: false, reason: 'Failed to check log status' };
    }

    // If user has logged and we only send when not logged, don't send
    if (hasLogged && settings.send_if_not_logged) {
      return { shouldSend: false, reason: 'User has already logged today' };
    }

    // Check if we've already sent a reminder today
    const lastSent = settings.last_sent_at
      ? new Date(settings.last_sent_at).toISOString().split('T')[0]
      : null;
    const today = new Date().toISOString().split('T')[0];

    if (lastSent === today) {
      return { shouldSend: false, reason: 'Reminder already sent today' };
    }

    // All checks passed
    return { shouldSend: true };
  } catch (error) {
    return {
      shouldSend: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark reminder as sent
 * Call this after successfully sending a notification
 */
export async function markReminderSent(): Promise<NotificationServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ last_sent_at: new Date().toISOString() })
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
      error: error instanceof Error ? error.message : 'Failed to mark reminder as sent',
    };
  }
}

/**
 * Get or create notification settings
 * Helper function that returns existing settings or creates defaults
 */
export async function getOrCreateNotificationSettings(): Promise<
  NotificationServiceResponse<NotificationSettings>
> {
  const existing = await getNotificationSettings();

  if (existing.success && existing.data) {
    return existing;
  }

  // Create default settings
  return await createNotificationSettings();
}

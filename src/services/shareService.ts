/**
 * Share Service
 * ==============
 * Tracks social sharing events
 *
 * ALPHA VERSION NOTE:
 * - This service only TRACKS sharing events (analytics)
 * - Does NOT integrate with actual social media APIs
 * - Share data is stored for future analytics
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

type Share = Database['public']['Tables']['shares']['Row'];
type ShareType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ShareServiceResponse<T = Share> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ShareData {
  score?: number;
  maxScore?: number;
  streak?: number;
  perfectDays?: number;
  totalLogs?: number;
  timestamp: string;
}

/**
 * Track a share event
 * Call this when user clicks a share button
 */
export async function trackShare(
  shareType: ShareType,
  shareData?: ShareData
): Promise<ShareServiceResponse<Share>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('shares')
      .insert({
        user_id: user.id,
        share_type: shareType,
        share_data: shareData || null,
      })
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
      error: error instanceof Error ? error.message : 'Failed to track share',
    };
  }
}

/**
 * Get all shares for current user
 */
export async function getShares(): Promise<ShareServiceResponse<Share[]>> {
  try {
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .order('shared_at', { ascending: false });

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
      error: error instanceof Error ? error.message : 'Failed to fetch shares',
    };
  }
}

/**
 * Get shares by type
 */
export async function getSharesByType(
  shareType: ShareType
): Promise<ShareServiceResponse<Share[]>> {
  try {
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .eq('share_type', shareType)
      .order('shared_at', { ascending: false });

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
      error: error instanceof Error ? error.message : 'Failed to fetch shares by type',
    };
  }
}

/**
 * Get total shares count
 */
export async function getTotalSharesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('shares')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting shares count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting shares count:', error);
    return 0;
  }
}

/**
 * Get shares count by type
 */
export async function getSharesCountByType(): Promise<Record<ShareType, number>> {
  try {
    const { data, error } = await supabase
      .from('shares')
      .select('share_type');

    if (error) {
      console.error('Error getting shares by type:', error);
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0,
      };
    }

    const counts = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    };

    (data || []).forEach(share => {
      counts[share.share_type as ShareType]++;
    });

    return counts;
  } catch (error) {
    console.error('Error getting shares by type:', error);
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    };
  }
}

/**
 * Generate shareable text for social media
 * This creates the text content that users can copy/paste
 */
export function generateShareText(
  shareType: ShareType,
  data: {
    score?: number;
    maxScore?: number;
    streak?: number;
    perfectDays?: number;
  }
): string {
  const baseText = '📊 SigmaLog - Discipline Tracker\n\n';

  switch (shareType) {
    case 'daily':
      return (
        baseText +
        `Today's discipline: ${data.score || 0}/${data.maxScore || 0} points ` +
        `(${data.maxScore ? Math.round(((data.score || 0) / data.maxScore) * 100) : 0}%)\n` +
        `🔥 Current streak: ${data.streak || 0} days\n\n` +
        'Building the Sigma, one day at a time.'
      );

    case 'weekly':
      return (
        baseText +
        `This week's progress:\n` +
        `✅ Perfect days: ${data.perfectDays || 0}/7\n` +
        `🔥 Current streak: ${data.streak || 0} days\n\n` +
        'Consistency over intensity.'
      );

    case 'monthly':
      return (
        baseText +
        `This month's discipline:\n` +
        `✅ Perfect days: ${data.perfectDays || 0}\n` +
        `🔥 Current streak: ${data.streak || 0} days\n\n` +
        'Track truth, build discipline.'
      );

    case 'quarterly':
      return (
        baseText +
        `90-day discipline report:\n` +
        `✅ Perfect days: ${data.perfectDays || 0}/90\n` +
        `🔥 Best streak: ${data.streak || 0} days\n\n` +
        'Discipline equals freedom.'
      );

    case 'yearly':
      return (
        baseText +
        `Year in review:\n` +
        `✅ Perfect days: ${data.perfectDays || 0}/365\n` +
        `🔥 Longest streak: ${data.streak || 0} days\n\n` +
        'Your habits define you.'
      );

    default:
      return baseText + 'Building discipline, tracking progress.';
  }
}

/**
 * Copy share text to clipboard
 * Helper function for easy sharing
 */
export async function copyShareTextToClipboard(
  shareType: ShareType,
  data: {
    score?: number;
    maxScore?: number;
    streak?: number;
    perfectDays?: number;
  }
): Promise<boolean> {
  try {
    const text = generateShareText(shareType, data);
    await navigator.clipboard.writeText(text);

    // Track the share event
    await trackShare(shareType, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

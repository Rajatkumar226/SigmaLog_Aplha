/**
 * useMilestones Hook
 * ===================
 * React hook for tracking milestone achievements
 *
 * USAGE:
 * const { milestones, progress, loading } = useMilestones(currentStreak);
 */

import { useState, useEffect, useCallback } from 'react';
import * as milestoneService from '../services/milestoneService';
import type { Database } from '../lib/supabase/database.types';

type Milestone = Database['public']['Tables']['milestones']['Row'];

export interface UseMilestonesResult {
  milestones: Milestone[];
  progress: {
    achieved: string[];
    next: string | null;
    nextThreshold: number | null;
    progress: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMilestones(currentStreak: number): UseMilestonesResult {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progress, setProgress] = useState<{
    achieved: string[];
    next: string | null;
    nextThreshold: number | null;
    progress: number;
  }>({
    achieved: [],
    next: '7_day',
    nextThreshold: 7,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all milestones
      const response = await milestoneService.getMilestones();
      if (response.success && response.data) {
        setMilestones(response.data);
      } else {
        setError(response.error || 'Failed to fetch milestones');
      }

      // Calculate progress
      const progressData = await milestoneService.getMilestoneProgress(currentStreak);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  }, [currentStreak]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const refetch = async () => {
    await fetchMilestones();
  };

  return {
    milestones,
    progress,
    loading,
    error,
    refetch,
  };
}

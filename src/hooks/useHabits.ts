/**
 * useHabits Hook
 * ==============
 * React hook for managing habits
 *
 * USAGE:
 * const { habits, loading, error, createHabit, updateHabit, deleteHabit, refetch } = useHabits();
 */

import { useState, useEffect, useCallback } from 'react';
import * as habitService from '../services/habitService';
import type { Database } from '../lib/supabase/database.types';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Omit<Database['public']['Tables']['habits']['Insert'], 'user_id' | 'id'>;
type HabitUpdate = Omit<Database['public']['Tables']['habits']['Update'], 'id' | 'user_id'>;

export interface UseHabitsResult {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  createHabit: (habit: HabitInsert) => Promise<boolean>;
  createHabits: (habits: HabitInsert[]) => Promise<boolean>;
  updateHabit: (habitId: string, updates: HabitUpdate) => Promise<boolean>;
  deleteHabit: (habitId: string) => Promise<boolean>;
  permanentlyDeleteHabit: (habitId: string) => Promise<boolean>;
  permanentlyDeleteAllHabits: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await habitService.getHabits();

      if (response.success && response.data) {
        setHabits(response.data);
      } else {
        setError(response.error || 'Failed to fetch habits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const createHabit = async (habit: HabitInsert): Promise<boolean> => {
    const response = await habitService.createHabit(habit);

    if (response.success && response.data) {
      setHabits(prev => [...prev, response.data!]);
      return true;
    } else {
      setError(response.error || 'Failed to create habit');
      return false;
    }
  };

  const createHabits = async (newHabits: HabitInsert[]): Promise<boolean> => {
    const response = await habitService.createHabits(newHabits);

    if (response.success && response.data) {
      setHabits(prev => [...prev, ...response.data!]);
      return true;
    } else {
      setError(response.error || 'Failed to create habits');
      return false;
    }
  };

  const updateHabit = async (habitId: string, updates: HabitUpdate): Promise<boolean> => {
    const response = await habitService.updateHabit(habitId, updates);

    if (response.success && response.data) {
      setHabits(prev =>
        prev.map(h => (h.id === habitId ? response.data! : h))
      );
      return true;
    } else {
      setError(response.error || 'Failed to update habit');
      return false;
    }
  };

  const deleteHabit = async (habitId: string): Promise<boolean> => {
    const response = await habitService.deleteHabit(habitId);

    if (response.success) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
      return true;
    } else {
      setError(response.error || 'Failed to delete habit');
      return false;
    }
  };

  const permanentlyDeleteHabit = async (habitId: string): Promise<boolean> => {
    const response = await habitService.permanentlyDeleteHabit(habitId);

    if (response.success) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
      return true;
    } else {
      setError(response.error || 'Failed to permanently delete habit');
      return false;
    }
  };

  const permanentlyDeleteAllHabits = async (): Promise<boolean> => {
    const response = await habitService.permanentlyDeleteAllHabits();

    if (response.success) {
      setHabits([]);
      return true;
    } else {
      setError(response.error || 'Failed to permanently delete all habits');
      return false;
    }
  };

  const refetch = async () => {
    await fetchHabits();
  };

  return {
    habits,
    loading,
    error,
    createHabit,
    createHabits,
    updateHabit,
    deleteHabit,
    permanentlyDeleteHabit,
    permanentlyDeleteAllHabits,
    refetch,
  };
}

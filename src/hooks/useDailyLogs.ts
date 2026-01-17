/**
 * useDailyLogs Hook
 * ==================
 * React hook for managing daily habit logs with data integrity
 *
 * USAGE:
 * const { todayCompleted, toggleHabit, dailyScore, streak, loading, historicalLogs } = useDailyLogs();
 */

import { useState, useEffect, useCallback } from 'react';
import * as logService from '../services/logService';
import * as milestoneService from '../services/milestoneService';
import { toast } from 'sonner';

// Format for UI components (WeeklyOverview, MonthlyHeatmap)
export interface DailyLogEntry {
  date: string;
  completedHabits: string[];
  score: number;
  maxScore: number;
}

export interface UseDailyLogsResult {
  todayCompleted: string[]; // Array of completed habit IDs
  dailyScore: logService.DailyScore | null;
  streak: number;
  loading: boolean;
  error: string | null;
  historicalLogs: DailyLogEntry[]; // Historical logs for calendar/weekly view
  toggleHabit: (habitId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDailyLogs(): UseDailyLogsResult {
  const [todayCompleted, setTodayCompleted] = useState<string[]>([]);
  const [dailyScore, setDailyScore] = useState<logService.DailyScore | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalLogs, setHistoricalLogs] = useState<DailyLogEntry[]>([]);

  // Fetch historical logs (last 90 days to cover monthly heatmap + weekly view)
  const fetchHistoricalLogs = useCallback(async () => {
    try {
      const today = new Date();

      // Get weekly stats which gives us daily scores
      const weeklyResponse = await logService.getWeeklyStats();

      // Get current month's heatmap
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const heatmapResponse = await logService.getMonthlyHeatmap(currentYear, currentMonth);

      // Also get previous month's heatmap for better calendar coverage
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevHeatmapResponse = await logService.getMonthlyHeatmap(prevYear, prevMonth);

      // Combine all data into historicalLogs format
      const logsMap = new Map<string, DailyLogEntry>();

      // Add previous month heatmap data
      if (prevHeatmapResponse.success && prevHeatmapResponse.data) {
        prevHeatmapResponse.data.forEach(day => {
          logsMap.set(day.date, {
            date: day.date,
            completedHabits: [], // We don't have habit IDs from heatmap
            score: day.score,
            maxScore: day.maxScore,
          });
        });
      }

      // Add current month heatmap data
      if (heatmapResponse.success && heatmapResponse.data) {
        heatmapResponse.data.forEach(day => {
          logsMap.set(day.date, {
            date: day.date,
            completedHabits: [], // We don't have habit IDs from heatmap
            score: day.score,
            maxScore: day.maxScore,
          });
        });
      }

      // Add weekly stats (may overlap, but that's fine - more recent data)
      if (weeklyResponse.success && weeklyResponse.data) {
        weeklyResponse.data.forEach(day => {
          logsMap.set(day.date, {
            date: day.date,
            completedHabits: [],
            score: day.score,
            maxScore: day.maxScore,
          });
        });
      }

      // Convert map to sorted array (oldest to newest)
      const logs = Array.from(logsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      setHistoricalLogs(logs);
    } catch (err) {
      console.error('Failed to fetch historical logs:', err);
    }
  }, []);

  const fetchTodayData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's completed habits
      const completedResponse = await logService.getTodayCompletedHabits();
      if (completedResponse.success && completedResponse.data) {
        setTodayCompleted(completedResponse.data);
      }

      // Fetch today's score
      const scoreResponse = await logService.getDailyScore(today);
      if (scoreResponse.success && scoreResponse.data) {
        setDailyScore(scoreResponse.data);
      }

      // Calculate streak
      const streakResponse = await logService.calculateStreak();
      if (streakResponse.success && typeof streakResponse.data === 'number') {
        setStreak(streakResponse.data);
      }

      // Fetch historical logs for calendar and weekly view
      await fetchHistoricalLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchHistoricalLogs]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const toggleHabit = async (habitId: string): Promise<boolean> => {
    const isCompleted = todayCompleted.includes(habitId);

    // Optimistically update UI immediately
    if (isCompleted) {
      setTodayCompleted(prev => prev.filter(id => id !== habitId));
    } else {
      setTodayCompleted(prev => [...prev, habitId]);
    }

    try {
      if (isCompleted) {
        // Remove log
        const response = await logService.removeLog(habitId);

        if (response.success) {
          // Refetch score and streak (but not todayCompleted to avoid overwrite)
          const today = new Date().toISOString().split('T')[0];
          const scoreResponse = await logService.getDailyScore(today);
          if (scoreResponse.success && scoreResponse.data) {
            setDailyScore(scoreResponse.data);
          }
          const streakResponse = await logService.calculateStreak();
          if (streakResponse.success && typeof streakResponse.data === 'number') {
            setStreak(streakResponse.data);
          }

          return true;
        } else {
          // Revert optimistic update on failure
          setTodayCompleted(prev => [...prev, habitId]);
          toast.error(response.error || 'Failed to remove log');
          return false;
        }
      } else {
        // Add log
        const response = await logService.logHabit(habitId);

        if (response.success) {
          // Refetch score and streak (but not todayCompleted to avoid overwrite)
          const today = new Date().toISOString().split('T')[0];
          const scoreResponse = await logService.getDailyScore(today);
          if (scoreResponse.success && scoreResponse.data) {
            setDailyScore(scoreResponse.data);
          }

          // Check for milestones
          const streakResponse = await logService.calculateStreak();
          if (streakResponse.success && typeof streakResponse.data === 'number') {
            const newStreak = streakResponse.data;
            setStreak(newStreak);

            const milestoneResponse = await milestoneService.checkAndCreateMilestone(newStreak);

            if (
              milestoneResponse.success &&
              milestoneResponse.data?.milestoneCreated &&
              milestoneResponse.data.milestoneType
            ) {
              const info = milestoneService.getMilestoneInfo(milestoneResponse.data.milestoneType);
              toast.success(`🎉 Milestone Unlocked: ${info.title}!`, {
                description: info.description,
                duration: 5000,
              });
            }
          }

          return true;
        } else {
          // Revert optimistic update on failure
          setTodayCompleted(prev => prev.filter(id => id !== habitId));
          toast.error(response.error || 'Failed to log habit');
          return false;
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      if (isCompleted) {
        setTodayCompleted(prev => [...prev, habitId]);
      } else {
        setTodayCompleted(prev => prev.filter(id => id !== habitId));
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle habit';
      toast.error(errorMsg);
      return false;
    }
  };

  const refetch = async () => {
    await fetchTodayData();
  };

  return {
    todayCompleted,
    dailyScore,
    streak,
    loading,
    error,
    historicalLogs,
    toggleHabit,
    refetch,
  };
}

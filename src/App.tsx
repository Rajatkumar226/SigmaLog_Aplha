import { useState, useEffect, useRef, useMemo } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { HabitSetupScreen } from './components/HabitSetupScreen';
import { MainDashboard } from './components/MainDashboard';
import { ProgressScreen } from './components/ProgressScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { MilestoneModal } from './components/MilestoneModal';
import { TimeCapsuleModal } from './components/TimeCapsuleModal';
import { TimeCapsuleReveal } from './components/TimeCapsuleReveal';
import { useAuth } from './hooks/useAuth';
import { useHabits } from './hooks/useHabits';
import { useDailyLogs } from './hooks/useDailyLogs';
import { useTimeCapsule } from './hooks/useTimeCapsule';
import { toast } from 'sonner';

export interface Habit {
  id: string;
  name: string;
  category: 'Body' | 'Mind' | 'Career' | 'Discipline' | string;
  points: 1 | 2 | 3;
}

// Standard categories for selection
export const STANDARD_CATEGORIES = ['Body', 'Mind', 'Career', 'Discipline'] as const;

export interface DailyLog {
  date: string;
  completedHabits: string[];
  score: number;
  maxScore: number;
}

type Screen = 'landing' | 'setup' | 'dashboard' | 'progress' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [showMilestone, setShowMilestone] = useState(false);
  const [isCreatingHabits, setIsCreatingHabits] = useState(false);
  const [showCapsuleWrite, setShowCapsuleWrite] = useState(false);
  const [showCapsuleReveal, setShowCapsuleReveal] = useState(false);

  // Track if initial screen routing has been done - prevents useEffect from overriding navigation
  const initialRoutingDoneRef = useRef(false);

  // Authentication
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  // Habits management
  const {
    habits,
    loading: habitsLoading,
    createHabit,
    createHabits,
    updateHabit,
    deleteHabit,
    permanentlyDeleteAllHabits,
    refetch: refetchHabits
  } = useHabits();

  // Time capsule
  const {
    pendingCapsule,
    readyCapsule,
    hasCapsule,
    loading: capsuleLoading,
    createCapsule,
    openCapsule,
  } = useTimeCapsule();

  // Auto-show reveal when a capsule is ready
  useEffect(() => {
    if (readyCapsule && isAuthenticated && currentScreen === 'dashboard') {
      setShowCapsuleReveal(true);
    }
  }, [readyCapsule, isAuthenticated, currentScreen]);

  // Daily logs management
  const {
    todayCompleted,
    dailyScore,
    streak,
    toggleHabit,
    historicalLogs,
    refetch: refetchLogs
  } = useDailyLogs();

  // Merge historical logs with today's live data so all UI components see the full picture
  const dailyLogs = useMemo<DailyLog[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const withoutToday = historicalLogs.filter(l => l.date !== today);
    if (dailyScore) {
      return [
        ...withoutToday,
        {
          date: today,
          completedHabits: todayCompleted,
          score: dailyScore.score,
          maxScore: dailyScore.maxScore,
        },
      ];
    }
    return withoutToday as DailyLog[];
  }, [historicalLogs, dailyScore, todayCompleted]);

  // Load screen state from localStorage (screen navigation persistence)
  // CRITICAL: Only runs ONCE on initial load to prevent overriding manual navigation
  useEffect(() => {
    if (!isAuthenticated) return;
    if (habitsLoading) return; // Wait for habits to load first

    // Only do initial routing ONCE
    if (initialRoutingDoneRef.current) {
      return;
    }

    // Mark initial routing as done
    initialRoutingDoneRef.current = true;

    const savedScreen = localStorage.getItem('sigmalog_screen');
    if (habits.length > 0) {
      // User has habits - go to saved screen or dashboard
      if (savedScreen && ['dashboard', 'progress', 'settings'].includes(savedScreen)) {
        setCurrentScreen(savedScreen as Screen);
      } else {
        setCurrentScreen('dashboard');
      }
    } else {
      // No habits - go to setup
      setCurrentScreen('setup');
    }
  }, [isAuthenticated, habitsLoading, habits.length]);

  // Save current screen to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('sigmalog_screen', currentScreen);
    }
  }, [currentScreen, isAuthenticated]);


  const startApp = () => {
    if (habits.length > 0) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('setup');
    }
  };

  const lockHabits = async (newHabits: Habit[]) => {
    // Prevent double submission
    if (isCreatingHabits) {
      return;
    }

    // No habits to create
    if (newHabits.length === 0) {
      toast.error('Please add at least one habit');
      return;
    }

    setIsCreatingHabits(true);

    try {
      // CRITICAL: First delete ALL existing habits (including soft-deleted ones)
      // This prevents unique constraint violations when creating new habits
      await permanentlyDeleteAllHabits();

      // Convert UI format to database format
      const habitsToCreate = newHabits.map(h => ({
        name: h.name,
        category: h.category,
        points: h.points,
      }));

      // Try to create habits - this updates local state via setHabits in the hook
      const success = await createHabits(habitsToCreate);

      if (success) {
        // Navigate to dashboard IMMEDIATELY after successful creation
        toast.success('Habits locked successfully!');
        localStorage.setItem('sigmalog_screen', 'dashboard');
        setCurrentScreen('dashboard');
      } else {
        toast.error('Failed to create habits. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsCreatingHabits(false);
    }
  };

  const updateHabits = async (newHabits: Habit[]) => {
    try {
      // Get current habit IDs from database
      const currentHabitIds = habits.map(h => h.id);
      const newHabitIds = newHabits.map(h => h.id);

      // Find habits to delete (in current but not in new)
      const habitsToDelete = habits.filter(h => !newHabitIds.includes(h.id));

      // Find new habits to create (IDs that start with 'habit-' are temporary local IDs)
      const habitsToCreate = newHabits.filter(h => h.id.startsWith('habit-'));

      // Find existing habits to update
      const habitsToUpdate = newHabits.filter(h =>
        currentHabitIds.includes(h.id) && !h.id.startsWith('habit-')
      );

      // Delete removed habits (soft delete)
      for (const habit of habitsToDelete) {
        await deleteHabit(habit.id);
      }

      // Create new habits
      if (habitsToCreate.length > 0) {
        const newHabitsData = habitsToCreate.map(h => ({
          name: h.name,
          category: h.category,
          points: h.points,
        }));
        await createHabits(newHabitsData);
      }

      // Update existing habits
      for (const habit of habitsToUpdate) {
        const originalHabit = habits.find(h => h.id === habit.id);
        if (originalHabit) {
          // Only update if something changed
          if (
            originalHabit.name !== habit.name ||
            originalHabit.category !== habit.category ||
            originalHabit.points !== habit.points
          ) {
            await updateHabit(habit.id, {
              name: habit.name,
              category: habit.category,
              points: habit.points,
            });
          }
        }
      }

      // Refetch to get accurate data from database
      await refetchHabits();
      toast.success('Habits updated successfully!');
    } catch (error) {
      toast.error('Failed to update habits. Please try again.');
    }
  };

  const resetData = async () => {
    // Permanently delete ALL habits (including inactive) to avoid unique constraint issues
    await permanentlyDeleteAllHabits();

    await refetchHabits();
    setCurrentScreen('setup');
    toast.success('Data reset successfully');
  };

  const handleAuthenticate = () => {
    // Auth state is managed by useAuth hook
    toast.success('Welcome to SigmaLog!');
  };

  const handleSignOut = async () => {
    setCurrentScreen('landing');
    // Sign out handled by useAuth hook
    toast.success('Signed out successfully');
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Loading SigmaLog...
          </div>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <AuthScreen onAuthenticate={handleAuthenticate} />
      </div>
    );
  }

  // Convert database habits to UI format
  const uiHabits: Habit[] = habits.map(h => ({
    id: h.id,
    name: h.name,
    category: h.category,
    points: h.points,
  }));

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {currentScreen === 'landing' && (
        <LandingScreen onStart={startApp} />
      )}
      {currentScreen === 'setup' && (
        <HabitSetupScreen
          onLockHabits={lockHabits}
          existingHabits={uiHabits}
          isLoading={isCreatingHabits}
        />
      )}
      {currentScreen === 'dashboard' && (
        <MainDashboard
          habits={uiHabits}
          todayCompleted={todayCompleted}
          onToggleHabit={toggleHabit}
          dailyLogs={dailyLogs}
          onNavigate={setCurrentScreen}
          capsuleStatus={!hasCapsule ? 'none' : readyCapsule ? 'ready' : 'pending'}
          capsuleDaysLeft={
            pendingCapsule
              ? Math.max(0, Math.ceil(
                  (new Date(pendingCapsule.deliver_on).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                ))
              : 0
          }
          onWriteCapsule={() => setShowCapsuleWrite(true)}
          onOpenCapsule={() => setShowCapsuleReveal(true)}
        />
      )}
      {currentScreen === 'progress' && (
        <ProgressScreen
          habits={uiHabits}
          dailyLogs={dailyLogs}
          onNavigate={setCurrentScreen}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen
          habits={uiHabits}
          onUpdateHabits={updateHabits}
          onResetData={resetData}
          onNavigate={setCurrentScreen}
          onSignOut={handleSignOut}
        />
      )}

      {/* Milestone Modal */}
      {showMilestone && (
        <MilestoneModal
          dailyLogs={dailyLogs}
          onClose={() => setShowMilestone(false)}
        />
      )}

      {/* Time Capsule Write Modal */}
      {showCapsuleWrite && (
        <TimeCapsuleModal
          onClose={() => setShowCapsuleWrite(false)}
          onSubmit={async (message, days) => {
            const result = await createCapsule(message, days);
            if (result.success) {
              toast.success(`Capsule sealed. Opens in ${days} days.`);
            } else {
              toast.error(result.error || 'Failed to create capsule');
            }
          }}
        />
      )}

      {/* Time Capsule Reveal Modal */}
      {showCapsuleReveal && readyCapsule && (
        <TimeCapsuleReveal
          capsule={readyCapsule}
          onClose={() => setShowCapsuleReveal(false)}
          onOpen={openCapsule}
          onWriteNew={() => {
            setShowCapsuleReveal(false);
            setTimeout(() => setShowCapsuleWrite(true), 300);
          }}
        />
      )}

      {/* Alpha version footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
        <p className="text-xs text-gray-700">
          Alpha version — discipline in progress
        </p>
      </div>
    </div>
  );
}

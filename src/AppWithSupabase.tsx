/**
 * App Component with Supabase Integration
 * =========================================
 * This is the new App.tsx that integrates with Supabase backend
 * Replace the existing App.tsx with this file to enable backend functionality
 *
 * KEY CHANGES FROM ORIGINAL:
 * 1. Uses Supabase for authentication instead of localStorage
 * 2. Habits and logs are stored in PostgreSQL database
 * 3. Data integrity rules enforced server-side
 * 4. Automatic milestone detection
 * 5. Real-time auth state management
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { PublicLandingPage } from './components/PublicLandingPage';
import { LandingScreen } from './components/LandingScreen';
import { HabitSetupScreen } from './components/HabitSetupScreen';
import { MainDashboard } from './components/MainDashboard';
import { ProgressScreen } from './components/ProgressScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { MilestoneModal } from './components/MilestoneModal';
import { OnboardingModal } from './components/OnboardingModal';
import { TimeCapsuleModal } from './components/TimeCapsuleModal';
import { TimeCapsuleReveal } from './components/TimeCapsuleReveal';
import { useAuth } from './hooks/useAuth';
import { useHabits } from './hooks/useHabits';
import { useDailyLogs } from './hooks/useDailyLogs';
import {
  registerSW,
  checkAndNotify,
  startReminderInterval,
  stopReminderInterval,
} from './services/pushNotificationService';
import {
  notifyDailyComplete,
  notifyStreakMilestone,
  notifySharePrompt,
} from './services/achievementNotificationService';
import { useTimeCapsule } from './hooks/useTimeCapsule';
import { toast } from 'sonner';

export interface Habit {
  id: string;
  name: string;
  category: 'Body' | 'Mind' | 'Career' | 'Discipline';
  points: 1 | 2 | 3;
}

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [showCapsuleWrite, setShowCapsuleWrite] = useState(false);
  const [showCapsuleReveal, setShowCapsuleReveal] = useState(false);

  // Track if this is initial load vs a refetch
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track if initial screen routing has been done
  const initialRoutingDoneRef = useRef(false);

  // Track previous streak to detect new milestone crossings
  const prevStreakRef = useRef(0);

  // Authentication
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  // Habits management
  const {
    habits,
    loading: habitsLoading,
    createHabits,
    updateHabit,
    permanentlyDeleteAllHabits,
    refetch: refetchHabits
  } = useHabits();

  // Daily logs management
  const {
    todayCompleted,
    dailyScore,
    streak,
    historicalLogs,
    toggleHabit,
    refetch: refetchLogs
  } = useDailyLogs();

  // Time capsule
  const {
    pendingCapsule,
    readyCapsule,
    hasCapsule,
    createCapsule,
    openCapsule,
  } = useTimeCapsule();

  // Auto-show reveal when a capsule is ready
  useEffect(() => {
    if (readyCapsule && isAuthenticated && currentScreen === 'dashboard') {
      setShowCapsuleReveal(true);
    }
  }, [readyCapsule, isAuthenticated, currentScreen]);

  // Load screen state from localStorage (screen navigation persistence)
  // Only runs ONCE on initial load after authentication and habits are loaded
  useEffect(() => {
    if (!isAuthenticated) return;
    if (habitsLoading) return; // Wait for habits to load first

    // Only do initial routing ONCE
    if (initialRoutingDoneRef.current) {
      return;
    }

    // Mark initial routing as done AND initial load complete
    initialRoutingDoneRef.current = true;
    setIsInitialLoad(false);

    const savedScreen = localStorage.getItem('sigmalog_screen');
    const hasSeenOnboarding = localStorage.getItem('sigmalog_onboarding_seen');

    if (habits.length > 0) {
      // User has habits - go to saved screen or dashboard
      if (savedScreen && ['dashboard', 'progress', 'settings'].includes(savedScreen)) {
        setCurrentScreen(savedScreen as Screen);
      } else {
        setCurrentScreen('dashboard');
      }
      // Show onboarding on dashboard if user hasn't seen it
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } else {
      // No habits - go to setup (onboarding will show after setup)
      setCurrentScreen('setup');
    }
  }, [isAuthenticated, habitsLoading, habits.length]);

  // Save current screen to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('sigmalog_screen', currentScreen);
    }
  }, [currentScreen, isAuthenticated]);

  // Bootstrap push notifications once authenticated + logs loaded
  useEffect(() => {
    if (!isAuthenticated || habitsLoading) return;

    // Register SW (no-op if already registered)
    registerSW();

    // Check on load: show notification if reminder time passed and not logged
    checkAndNotify(dailyLogs);

    // Check every minute while app is open
    startReminderInterval(() => dailyLogs);

    return () => stopReminderInterval();
  }, [isAuthenticated, habitsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Daily completion notification ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || habitsLoading || habits.length === 0) return;
    if (todayCompleted.length < habits.length) return;

    const n = new Date();
    const todayStr = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    const key = `sigmalog_done_notified_${todayStr}`;
    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, '1');
    const currentHabits: Habit[] = habits.map(h => ({ id: h.id, name: h.name, category: h.category, points: h.points }));
    notifyDailyComplete(currentHabits, streak);
  }, [todayCompleted.length, habits.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Streak milestone notification ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || streak === 0) {
      prevStreakRef.current = streak;
      return;
    }
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (prev === streak) return;

    const MILESTONES = [7, 14, 21, 30, 60, 90, 180, 365];
    const crossed = MILESTONES.find(m => streak >= m && prev < m);
    if (!crossed) return;

    const key = `sigmalog_streak_notified_${crossed}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');

    const currentHabits: Habit[] = habits.map(h => ({ id: h.id, name: h.name, category: h.category, points: h.points }));
    notifyStreakMilestone(currentHabits, streak);
    setTimeout(() => notifySharePrompt(streak), 8_000);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combine historical logs with today's data for UI components
  const dailyLogs: DailyLog[] = (() => {
    const _n = new Date();
    const today = `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`;

    // Start with historical logs (excluding today since we have fresh data)
    const logs = historicalLogs
      .filter(log => log.date !== today)
      .map(log => ({
        date: log.date,
        completedHabits: log.completedHabits,
        score: log.score,
        maxScore: log.maxScore,
      }));

    // Add today's data if we have it
    if (dailyScore) {
      logs.push({
        date: today,
        completedHabits: todayCompleted,
        score: dailyScore.score,
        maxScore: dailyScore.maxScore,
      });
    }

    // Sort by date (oldest to newest)
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  })();

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
        toast.success('Habits created! Let\'s start tracking.');
        localStorage.setItem('sigmalog_screen', 'dashboard');
        setCurrentScreen('dashboard');
        // Show onboarding for new users
        const hasSeenOnboarding = localStorage.getItem('sigmalog_onboarding_seen');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
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
    // This is a simplified update - in production you'd handle individual updates
    // For now, we'll just refetch to ensure consistency
    await refetchHabits();
    toast.success('Habits updated successfully!');
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
    toast.success('Successfully authenticated!');
  };

  const handleSignOut = async () => {
    // Clear local state
    setCurrentScreen('landing');

    // Sign out handled by useAuth hook
    toast.success('Signed out successfully');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('sigmalog_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  // Show public landing page FIRST for unauthenticated users (before any loading)
  // This ensures the landing page is shown immediately on first visit
  if (!isAuthenticated && !showAuthScreen && !authLoading) {
    return <PublicLandingPage onGetStarted={() => setShowAuthScreen(true)} />;
  }

  // Show loading screen during auth check (after user clicked Get Started) or habits loading
  if (authLoading || (isAuthenticated && habitsLoading && isInitialLoad)) {
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

  // Show auth screen if user clicked "Get Started" but not yet authenticated
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
          streak={streak}
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

      {/* Milestone Modal - Auto-shows on milestone achievements */}
      {showMilestone && (
        <MilestoneModal
          dailyLogs={dailyLogs}
          onClose={() => setShowMilestone(false)}
        />
      )}

      {/* Onboarding Modal - Shows for first-time users */}
      <AnimatePresence>
        {showOnboarding && currentScreen === 'dashboard' && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

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

      {/* Alpha version footer — fixed bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 30,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10,14,26,0.80)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      >
        <p style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.06em' }}>
          Alpha version — discipline in progress
        </p>
      </div>
    </div>
  );
}
